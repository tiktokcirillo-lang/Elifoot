import { nanoid } from 'nanoid';
import type { SaveGame, Team, FinanceRecord, TeamTier } from '@/types';
import { TIER_BASE_CAPACITY, effectiveCapacity } from '@/data/stadiumData';
import { isDerby } from '@/data/rivalries';

// Legacy alias so callers that still reference STADIUM_CAPACITY keep working
const STADIUM_CAPACITY: Record<TeamTier, number> = TIER_BASE_CAPACITY;

/** Retorna a capacidade efetiva do time, considerando expansão de estádio */
function getCapacity(team: Team, save: SaveGame): number {
  const base = team.stadiumCapacity ?? STADIUM_CAPACITY[team.tier];
  const stadiumLevel = (save.infrastructure?.stadium ?? 0) as 0 | 1 | 2 | 3;
  // Expansão só se aplica ao time controlado pelo usuário
  if (!team.isUserControlled) return base;
  return effectiveCapacity(base, stadiumLevel);
}

const TICKET_PRICE: Record<TeamTier, number> = {
  elite: 90,   // R$ por ingresso
  top:   70,
  mid:   55,
  low:   40,
};

const TV_RIGHTS_WEEKLY: Record<TeamTier, number> = {
  elite: 3500,  // em milhares
  top:   2200,
  mid:   1200,
  low:   600,
};

// ============================================================
// Helpers internos
// ============================================================

function addRecord(save: SaveGame, record: Omit<FinanceRecord, 'id' | 'turn'>) {
  save.financeHistory.push({ id: nanoid(8), turn: save.currentTurn, ...record });
  if (save.financeHistory.length > 300) save.financeHistory = save.financeHistory.slice(-300);
}

function attendanceRate(userTeam: Team, awayTeam: Team, isKnockout: boolean): number {
  const base = 0.5;
  const repBonus = (userTeam.reputation / 100) * 0.2;  // até +0.20
  const opponentBonus = (awayTeam.reputation / 100) * 0.2; // até +0.20
  const knockoutBonus = isKnockout ? 0.1 : 0;
  return Math.min(1.0, base + repBonus + opponentBonus + knockoutBonus);
}

// ============================================================
// Receita de bilheteria — chamada após partida em casa
// ============================================================

export function processTicketRevenue(
  save: SaveGame,
  fixtureId: string,
): void {
  const fixture = save.competitions.flatMap((c) => c.fixtures).find((f) => f.id === fixtureId);
  if (!fixture || fixture.homeTeamId !== save.controlledTeamId) return;

  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId)!;
  const awayTeam = save.teams.find((t) => t.id === fixture.awayTeamId);
  if (!awayTeam) return;

  const comp = save.competitions.find((c) => c.fixtures.some((f) => f.id === fixtureId));
  const isKnockout = comp?.format !== 'round_robin';

  const capacity = getCapacity(userTeam, save);
  const rate = attendanceRate(userTeam, awayTeam, isKnockout);
  const price = TICKET_PRICE[userTeam.tier];
  // Fan satisfaction afeta bilheteria: 0→80%, 50→100%, 100→120%
  const fanMult = 0.8 + ((save.fanSatisfaction ?? 50) / 100) * 0.4;
  // Derby/clássico enche mais o estádio (+15% de lotação e receita)
  const derbyBonus = isDerby(userTeam.id, awayTeam.id) ? 1.15 : 1.0;
  const revenue = Math.round((capacity * rate * price * fanMult * derbyBonus) / 1000); // em milhares
  const isDerbyMatch = derbyBonus > 1.0;

  userTeam.budget += revenue;
  addRecord(save, {
    type: 'ticket',
    amount: revenue,
    description: `Bilheteria: ${userTeam.shortName} vs ${awayTeam.shortName} (${Math.round(rate * 100)}% lotação)${isDerbyMatch ? ' — Clássico!' : ''} — ${comp?.shortName ?? ''}`,
  });
}

// ============================================================
// Finanças semanais — chamada a cada 7 turnos
// ============================================================

const SEASON_WEEKS = 40; // 280 turnos / 7 = 40 semanas por temporada

function sponsorFanMultiplier(fanSatisfaction: number): number {
  if (fanSatisfaction >= 85) return 1.20;
  if (fanSatisfaction >= 70) return 1.10;
  if (fanSatisfaction < 50)  return 0.90;
  return 1.0;
}

function calcActiveSponsorWeeklyIncome(
  save: SaveGame,
  userTeam: Team,
): { income: number; fanMult: number; dealNames: string } {
  const fanMult = sponsorFanMultiplier(save.fanSatisfaction ?? 50);
  const activeDeals = (save.sponsorOffers ?? []).filter(
    (o) => o.status === 'active' && o.activeUntil != null && o.activeUntil >= save.season,
  );
  if (activeDeals.length === 0) {
    return {
      income: Math.round(userTeam.reputation * 20 * fanMult),
      fanMult,
      dealNames: '',
    };
  }
  const income = activeDeals.reduce(
    (sum, deal) => sum + Math.round((deal.valuePerSeason / SEASON_WEEKS) * fanMult),
    0,
  );
  return { income, fanMult, dealNames: activeDeals.map((d) => d.brandName).join(', ') };
}

export function processWeeklyFinances(save: SaveGame): void {
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (!userTeam) return;

  // 1. Receita de patrocínio (todos os slots ativos, com multiplicador de torcida)
  const { income: sponsorIncome, fanMult, dealNames } = calcActiveSponsorWeeklyIncome(save, userTeam);
  userTeam.budget += sponsorIncome;
  addRecord(save, {
    type: 'sponsor',
    amount: sponsorIncome,
    description: dealNames
      ? `Patrocínio: ${dealNames}${fanMult !== 1.0 ? ` (×${fanMult.toFixed(2)})` : ''}`
      : `Receita de patrocinadores`,
  });

  // 2. Direitos de TV
  const tvIncome = TV_RIGHTS_WEEKLY[userTeam.tier];
  userTeam.budget += tvIncome;
  addRecord(save, {
    type: 'tv_rights',
    amount: tvIncome,
    description: `Direitos de transmissão`,
  });

  // 3. Folha salarial semanal
  const monthlyWages = userTeam.squad.reduce((s, p) => s + p.wageMonthly, 0);
  const weeklyWages = Math.round(monthlyWages / 4);
  userTeam.budget -= weeklyWages;
  addRecord(save, {
    type: 'wages',
    amount: -weeklyWages,
    description: `Folha salarial (${userTeam.squad.length} atletas)`,
  });

  // 4. Taxas de empréstimo (mensais / 4 por semana)
  const activeLoans = (save.activeLoans ?? []).filter(
    (l) => l.loanedToTeamId === save.controlledTeamId,
  );
  const weeklyLoanFees = Math.round(
    activeLoans.reduce((s, l) => s + l.loanFeeMonthly, 0) / 4,
  );
  if (weeklyLoanFees > 0) {
    userTeam.budget -= weeklyLoanFees;
    addRecord(save, {
      type: 'wages',
      amount: -weeklyLoanFees,
      description: `Taxas de empréstimo (${activeLoans.length} atleta${activeLoans.length > 1 ? 's' : ''})`,
    });
  }
}

// ============================================================
// Receita de transferência — chamada ao vender/comprar
// ============================================================

export function recordTransfer(
  save: SaveGame,
  playerName: string,
  amount: number,
  isSale: boolean,
): void {
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (!userTeam) return;

  addRecord(save, {
    type: isSale ? 'transfer_in' : 'transfer_out',
    amount: isSale ? amount : -amount,
    description: `${isSale ? 'Venda' : 'Compra'}: ${playerName}`,
  });
}

// ============================================================
// Helpers de leitura
// ============================================================

export interface WeeklyCashflow {
  sponsorIncome: number;
  tvIncome: number;
  weeklyWages: number;
  weeklyLoanFees: number;
  projectedTickets: number;
  net: number;
}

export function calcWeeklyCashflow(save: SaveGame): WeeklyCashflow {
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (!userTeam) return { sponsorIncome: 0, tvIncome: 0, weeklyWages: 0, weeklyLoanFees: 0, projectedTickets: 0, net: 0 };

  const { income: sponsorIncome } = calcActiveSponsorWeeklyIncome(save, userTeam);
  const tvIncome = TV_RIGHTS_WEEKLY[userTeam.tier];
  const weeklyWages = Math.round(userTeam.squad.reduce((s, p) => s + p.wageMonthly, 0) / 4);
  const weeklyLoanFees = Math.round(
    (save.activeLoans ?? [])
      .filter((l) => l.loanedToTeamId === save.controlledTeamId)
      .reduce((s, l) => s + l.loanFeeMonthly, 0) / 4,
  );
  const avgAttendance = 0.65 + (userTeam.reputation / 100) * 0.25;
  const projectedTickets = Math.round(
    (getCapacity(userTeam, save) * avgAttendance * TICKET_PRICE[userTeam.tier]) / 1000,
  );

  return {
    sponsorIncome,
    tvIncome,
    weeklyWages,
    weeklyLoanFees,
    projectedTickets,
    net: sponsorIncome + tvIncome - weeklyWages - weeklyLoanFees,
  };
}

// ============================================================
// Resumo da folha salarial vs. orçamento
// ============================================================

export interface WageSummary {
  monthlyWages: number;       // salários mensais do elenco
  loanFeesMonthly: number;    // taxas mensais de empréstimos recebidos
  totalMonthlyCost: number;   // soma dos dois
  wageBudget: number;         // limite saudável (65% da receita base mensal)
  usedPercent: number;        // totalMonthlyCost / wageBudget × 100
  status: 'healthy' | 'warning' | 'critical';
}

export function getWageSummary(save: SaveGame): WageSummary {
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (!userTeam) {
    return { monthlyWages: 0, loanFeesMonthly: 0, totalMonthlyCost: 0, wageBudget: 1, usedPercent: 0, status: 'healthy' };
  }

  const { income: weeklyBaseSponsor } = calcActiveSponsorWeeklyIncome(save, userTeam);
  const weeklyBaseIncome = weeklyBaseSponsor + TV_RIGHTS_WEEKLY[userTeam.tier];
  const monthlyBaseIncome = weeklyBaseIncome * 4;
  const wageBudget = Math.round(monthlyBaseIncome * 0.65);

  const monthlyWages = userTeam.squad.reduce((s, p) => s + p.wageMonthly, 0);
  const loanFeesMonthly = (save.activeLoans ?? [])
    .filter((l) => l.loanedToTeamId === save.controlledTeamId)
    .reduce((s, l) => s + l.loanFeeMonthly, 0);
  const totalMonthlyCost = monthlyWages + loanFeesMonthly;
  const usedPercent = wageBudget > 0 ? Math.round((totalMonthlyCost / wageBudget) * 100) : 0;

  return {
    monthlyWages,
    loanFeesMonthly,
    totalMonthlyCost,
    wageBudget,
    usedPercent,
    status: usedPercent >= 100 ? 'critical' : usedPercent >= 80 ? 'warning' : 'healthy',
  };
}

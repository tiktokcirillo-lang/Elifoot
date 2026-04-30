import { nanoid } from 'nanoid';
import type { SaveGame, Team, FinanceRecord, TeamTier } from '@/types';

// ============================================================
// Constantes financeiras por tier
// ============================================================

const STADIUM_CAPACITY: Record<TeamTier, number> = {
  elite: 70000,
  top:   50000,
  mid:   35000,
  low:   20000,
};

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

  const capacity = STADIUM_CAPACITY[userTeam.tier];
  const rate = attendanceRate(userTeam, awayTeam, isKnockout);
  const price = TICKET_PRICE[userTeam.tier];
  const revenue = Math.round((capacity * rate * price) / 1000); // em milhares

  userTeam.budget += revenue;
  addRecord(save, {
    type: 'ticket',
    amount: revenue,
    description: `Bilheteria: ${userTeam.shortName} vs ${awayTeam.shortName} (${Math.round(rate * 100)}% lotação) — ${comp?.shortName ?? ''}`,
  });
}

// ============================================================
// Finanças semanais — chamada a cada 7 turnos
// ============================================================

export function processWeeklyFinances(save: SaveGame): void {
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (!userTeam) return;

  // 1. Receita de patrocínio primário
  const sponsorIncome = Math.round(userTeam.reputation * 28);
  userTeam.budget += sponsorIncome;
  addRecord(save, {
    type: 'sponsor',
    amount: sponsorIncome,
    description: `Receita de patrocinadores (Semana)`,
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
  projectedTickets: number; // estimativa por semana baseada em jogos em casa
  net: number;
}

export function calcWeeklyCashflow(save: SaveGame): WeeklyCashflow {
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (!userTeam) return { sponsorIncome: 0, tvIncome: 0, weeklyWages: 0, projectedTickets: 0, net: 0 };

  const sponsorIncome = Math.round(userTeam.reputation * 28);
  const tvIncome = TV_RIGHTS_WEEKLY[userTeam.tier];
  const weeklyWages = Math.round(userTeam.squad.reduce((s, p) => s + p.wageMonthly, 0) / 4);
  const avgAttendance = 0.65 + (userTeam.reputation / 100) * 0.25;
  const projectedTickets = Math.round(
    (STADIUM_CAPACITY[userTeam.tier] * avgAttendance * TICKET_PRICE[userTeam.tier]) / 1000,
  );

  return {
    sponsorIncome,
    tvIncome,
    weeklyWages,
    projectedTickets,
    net: sponsorIncome + tvIncome - weeklyWages,
  };
}

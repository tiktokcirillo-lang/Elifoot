import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  SaveGame,
  SponsorOffer,
  Team,
  Competition,
  CompetitionStanding,
  NewsItem,
  Fixture,
  MatchResult,
  TrainingPlan,
  TacticalSetup,
  TransferListing,
  TransferBid,
  Formation,
  Infrastructure,
  ManagerJobOffer,
  PressConferenceOption,
} from '@/types';
import { SPONSOR_BRANDS } from '@/data/sponsors';
import { MANAGER_SKILLS } from '@/data/managerSkills';
import { simulateMatch, simulatePenaltyShootout } from '@/engine/matchSimulator';
import {
  createBrasileirao,
  applyResultToStandings,
  sortStandings,
} from '@/competitions/brasileirao';
import { createCopaDoBrasil, createGroupsKnockout, createPaulistao } from '@/competitions/knockoutFormats';
import { buildBrasileiraoTeams } from '@/data/brasileiraoTeams';
import { buildSerieBTeams } from '@/data/serieBTeams';
import { buildSerieCTeams } from '@/data/serieCTeams';
import { buildExtraTeams, LIBERTADORES_EXTRA_SEEDS, CHAMPIONS_EXTRA_SEEDS, PAULISTAO_EXTRA_SEEDS, SULAMERICANA_EXTRA_SEEDS, MUNDIAL_EXTRA_SEEDS, COPA_MUNDO_SEEDS } from '@/data/extraTeams';
import { persistSave, loadSave } from '@/db/database';
import { resolveKnockoutsForSave } from '@/engine/knockoutEngine';
import { applyWeeklyTraining } from '@/engine/trainingEngine';
import { autoPickStartingEleven, generateYouthPlayer, generateSquad } from '@/engine/playerGenerator';
import { processWeeklyFinances, processTicketRevenue, recordTransfer } from '@/engine/financeEngine';
import { isSeasonOver, processSeasonEnd, generateBoardObjectives, startNewSeason } from '@/engine/seasonEngine';
import { createRng } from '@/utils/random';
import { generateAvailableScouts, generateScoutReport, generateLoanOffers } from '@/engine/scoutingEngine';
import { generateNarrativeNews, generateDerbyNews, derbyMoraleEffect } from '@/engine/storyEngine';
import { getRivalry, isDerby } from '@/data/rivalries';

// ============================================================
// Utilidades exportadas
// ============================================================

// Janelas de transferências: pré-temporada (turnos 1-28) e meio do ano (133-161)
export function isTransferWindowOpen(currentTurn: number): boolean {
  return (currentTurn >= 1 && currentTurn <= 28) || (currentTurn >= 133 && currentTurn <= 161);
}

// Regra dos 12 jogos (2026): jogador só pode ser transferido entre clubes da Série A
// se tiver disputado no máximo 12 partidas pelo clube vendedor no Brasileirão da temporada.
export function isEligibleForSerieATransfer(
  playerId: string,
  save: SaveGame,
  sellerTeamId: string,
  buyerTeamId: string,
): boolean {
  // Só se aplica na janela de meio de temporada (turnos 133-161)
  if (!(save.currentTurn >= 133 && save.currentTurn <= 161)) return true;

  const brasileirao = save.competitions.find((c) => c.format === 'round_robin');
  if (!brasileirao) return true;

  // Ambos os times precisam estar no Brasileirão
  const sellerInBR = brasileirao.teamIds.includes(sellerTeamId);
  const buyerInBR = brasileirao.teamIds.includes(buyerTeamId);
  if (!sellerInBR || !buyerInBR) return true;

  const seller = save.teams.find((t) => t.id === sellerTeamId);
  const player = seller?.squad.find((p) => p.id === playerId);
  if (!player) return false;

  const appearances = (player.appearancesInComp ?? {})[brasileirao.id] ?? 0;
  return appearances <= 12;
}

// Times do estado de São Paulo elegíveis para o Paulistão
const SP_TEAM_IDS = new Set(['pal', 'cor', 'sao', 'rbb']);

// ============================================================
// Estado
// ============================================================

interface GameState {
  save: SaveGame | null;

  // Lifecycle
  newGame: (managerName: string, teamId: string, saveName: string) => Promise<void>;
  loadGame: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  closeGame: () => void;

  // Gameplay
  advanceTurn: () => Promise<void>;
  playUserMatch: (fixtureId: string) => Promise<MatchResult | null>;
  simulateFirstHalf: (fixtureId: string) => Promise<MatchResult | null>;
  simulateSecondHalf: (fixtureId: string, firstHalfResult: MatchResult, subs: { outId: string; inId: string }[]) => Promise<MatchResult | null>;
  setUserStarting11: (ids: string[]) => void;
  renewContract: (playerId: string) => void;

  // Transferências
  listPlayerForSale: (playerId: string, askingPrice: number) => void;
  withdrawListing: (listingId: string) => void;
  makeBid: (listingId: string, amount: number) => void;
  acceptBid: (listingId: string, bidId: string) => void;
  rejectBid: (listingId: string, bidId: string) => void;

  // Base / academia
  promoteYouthPlayer: (playerId: string) => void;

  // Treinamento
  setTrainingPlan: (plan: TrainingPlan) => void;

  // Tática
  setTacticalSetup: (setup: TacticalSetup) => void;
  setFormation: (formation: Formation) => void;

  // Temporada
  startNewSeason: () => Promise<void>;

  // Patrocínios
  acceptSponsorOffer: (offerId: string) => void;
  rejectSponsorOffer: (offerId: string) => void;

  // Carreira
  switchTeam: (teamId: string) => void;
  resignFromClub: () => void;
  unlockSkill: (skillId: string) => void;

  // Leitura
  getUserTeam: () => Team | undefined;
  getCompetition: (id: string) => Competition | undefined;
  getNextUserFixture: () => Fixture | undefined;
  markNewsRead: (newsId: string) => void;
  // Scouting
  hireScout: (scoutId: string) => void;
  fireScout: (scoutId: string) => void;
  assignScout: (scoutId: string) => void;
  markScoutReportRead: (reportId: string) => void;
  signScoutedPlayer: (reportId: string) => void;
  // Empréstimos
  acceptLoanOffer: (offerId: string) => void;
  rejectLoanOffer: (offerId: string) => void;
  // Interações com jogadores
  resolvePlayerInteraction: (interactionId: string, optionIndex: number) => void;
  // Avaliações pós-jogo
  recordMatchRating: (fixtureId: string, ratings: Record<string, number>) => void;
  // Team talk
  applyTeamTalk: (moraleBonus: number) => void;
  // Infraestrutura
  upgradeInfrastructure: (type: keyof Infrastructure) => void;
  // Coletiva de imprensa
  applyPressConferenceEffects: (effects: PressConferenceOption) => void;
  // Propostas de emprego
  acceptJobOffer: (offerId: string) => void;
  rejectJobOffer: (offerId: string) => void;
  // Counter-oferta de transferência
  acceptCounterOffer: (listingId: string, bidId: string) => void;
  // Seleção Nacional
  acceptNationalTeamOffer: () => void;
  rejectNationalTeamOffer: () => void;
  resignNationalTeam: () => void;
  updateNationalTeamSquad: (playerIds: string[]) => void;
}

// ============================================================
// Helpers internos
// ============================================================

function pushNews(save: SaveGame, news: Omit<NewsItem, 'id' | 'read' | 'turn'>) {
  save.news.unshift({
    ...news,
    id: nanoid(8),
    turn: save.currentTurn,
    read: false,
  });
  if (save.news.length > 200) save.news = save.news.slice(0, 200);
}

// Atualiza stats de jogadores (gols, cartões, aparências) após um jogo simulado
function updateStatsFromFixture(teams: Team[], fixture: Fixture): void {
  if (!fixture.result) return;
  const home = teams.find((t) => t.id === fixture.homeTeamId);
  const away = teams.find((t) => t.id === fixture.awayTeamId);
  if (!home || !away) return;

  // Aparências: todos os 11 titulares
  [home, away].forEach((team) => {
    team.starting11.slice(0, 11).forEach((pid) => {
      const p = team.squad.find((pl) => pl.id === pid);
      if (p) {
        p.stats.appearances++;
        p.stats.minutesPlayed += 90;
        // Rastreia aparições por competição (regra dos 12 jogos da Série A)
        if (!p.appearancesInComp) p.appearancesInComp = {};
        p.appearancesInComp[fixture.competitionId] =
          (p.appearancesInComp[fixture.competitionId] ?? 0) + 1;
      }
    });
  });

  // Gols e cartões pelos eventos
  for (const ev of fixture.result.events) {
    if (!ev.playerId) continue;
    const team = ev.side === 'home' ? home : away;
    const player = team.squad.find((p) => p.id === ev.playerId);
    if (!player) continue;
    if (ev.type === 'goal' || ev.type === 'penalty_scored') player.stats.goals++;
    else if (ev.type === 'yellow_card') player.stats.yellowCards++;
    else if (ev.type === 'red_card') player.stats.redCards++;
  }
}

function simulateAllPendingFixturesForTurn(save: SaveGame, turn: number) {
  for (const comp of save.competitions) {
    if (comp.finished) continue;
    const fixturesForTurn = comp.fixtures.filter(
      (f) => f.scheduledTurn === turn && !f.played,
    );
    if (fixturesForTurn.length === 0) continue;

    fixturesForTurn.forEach((fixture) => {
      const isUserMatch =
        fixture.homeTeamId === save.controlledTeamId ||
        fixture.awayTeamId === save.controlledTeamId;
      if (isUserMatch) return;

      const home = save.teams.find((t) => t.id === fixture.homeTeamId);
      const away = save.teams.find((t) => t.id === fixture.awayTeamId);
      if (!home || !away) return;

      // Pênaltis só em jogos únicos de knockout (final sem ida e volta)
      const isSingleLegKnockout =
        !fixture.isTwoLeg &&
        fixture.stage !== 'regular' &&
        fixture.stage !== 'group';

      const result = simulateMatch(home, away, { decidePenalties: isSingleLegKnockout });
      fixture.result = result;
      fixture.played = true;
      updateStatsFromFixture(save.teams, fixture);

      if (
        comp.format === 'round_robin' ||
        comp.format === 'groups_knockout' ||
        comp.format === 'groups_then_knockout_paulista'
      ) {
        if (fixture.stage === 'group' || fixture.stage === 'regular') {
          comp.standings = applyResultToStandings(
            comp.standings,
            fixture.homeTeamId,
            fixture.awayTeamId,
            result,
          );
        }
      }

      // Derby AI: aplica efeito de moral nos times envolvidos
      if (isDerby(fixture.homeTeamId, fixture.awayTeamId) && fixture.stage === 'regular') {
        const rivalry = getRivalry(fixture.homeTeamId, fixture.awayTeamId);
        if (rivalry) {
          const homeWon = result.homeGoals > result.awayGoals;
          const drew = result.homeGoals === result.awayGoals;
          [home, away].forEach((team) => {
            const won = team === home ? homeWon : !homeWon && !drew;
            const delta = derbyMoraleEffect(won, drew, rivalry.tier);
            team.squad.forEach((p) => { p.morale = Math.max(0, Math.min(100, p.morale + delta)); });
          });
        }
      }
    });
  }
}

// ============================================================
// Criação das competições iniciais
// ============================================================

function generateInitialCompetitions(
  teams: Team[],
  allTeams: Team[],
  userTeamId: string,
  season: number,
  previousBrasileiraoStandings?: CompetitionStanding[],
  previousLibertadoresFinalists?: { champion?: string; runnerUp?: string },
  previousChampionsChampion?: string,
): Competition[] {
  const brTeamIds = teams.map((t) => t.id);
  // Série B and C teams in allTeams
  const serieBTeamIds = allTeams.filter((t) => t.division === 'B').map((t) => t.id);
  const serieCTeamIds = allTeams.filter((t) => t.division === 'C').map((t) => t.id);

  // ── Brasileirão ────────────────────────────────────────────
  const brasileirao = createBrasileirao({
    teamIds: brTeamIds,
    season,
    startTurn: 1,
    turnsBetweenRounds: 7,
    seed: season * 1000 + 1,
  });

  // ── Copa do Brasil (top 16 por reputação, garante time do user) ──
  const sortedByRep = [...teams].sort((a, b) => b.reputation - a.reputation);
  let copaTeams = sortedByRep.slice(0, 16);
  if (!copaTeams.find((t) => t.id === userTeamId)) {
    copaTeams = [...sortedByRep.slice(0, 15), teams.find((t) => t.id === userTeamId)!];
  }
  const copa = createCopaDoBrasil({
    teamIds: copaTeams.map((t) => t.id),
    season,
    startTurn: 4,
    turnsBetweenLegs: 7,
    seed: season * 1000 + 2,
  });

  // ── Libertadores (top 6 BR por classificação ou reputação + 10 sul-americanos) ──
  let top6BrIds: string[];
  if (previousBrasileiraoStandings && previousBrasileiraoStandings.length >= 6) {
    // Usa classificação real da temporada anterior
    top6BrIds = previousBrasileiraoStandings.slice(0, 6).map((s) => s.teamId);
  } else {
    top6BrIds = sortedByRep.slice(0, 6).map((t) => t.id);
  }

  const saTeams = allTeams
    .filter((t) => LIBERTADORES_EXTRA_SEEDS.some((s) => s.id === t.id))
    .slice(0, 10)
    .map((t) => t.id);
  const libTeamIds = [...top6BrIds, ...saTeams]; // 16 times, 4 grupos de 4

  const libertadores = createGroupsKnockout({
    teamIds: libTeamIds,
    numberOfGroups: 4,
    teamsPerGroup: 4,
    season,
    startTurn: 3,
    turnsBetweenRounds: 7,
    turnsBetweenLegs: 7,
    name: 'CONMEBOL Libertadores',
    shortName: 'Libertadores',
    knockoutTwoLeg: true,
    seed: season * 1000 + 3,
  });

  // ── Sul-Americana (times 7-12 BR + 10 times SA extra) ────────
  let brSulTeamIds: string[];
  if (previousBrasileiraoStandings && previousBrasileiraoStandings.length >= 12) {
    brSulTeamIds = previousBrasileiraoStandings.slice(6, 12).map((s) => s.teamId);
  } else {
    brSulTeamIds = sortedByRep.slice(6, 12).map((t) => t.id);
  }
  // Garante que o time do user está na Sul-Americana se não entrou na Libertadores
  if (!top6BrIds.includes(userTeamId) && !brSulTeamIds.includes(userTeamId)) {
    brSulTeamIds = [...brSulTeamIds.slice(0, 5), userTeamId];
  }
  const saExtraIds = allTeams
    .filter((t) => SULAMERICANA_EXTRA_SEEDS.some((s) => s.id === t.id))
    .slice(0, 10)
    .map((t) => t.id);
  const sulAmericanaTeamIds = [...brSulTeamIds, ...saExtraIds]; // 6 + 10 = 16

  const sulAmericana = createGroupsKnockout({
    teamIds: sulAmericanaTeamIds,
    numberOfGroups: 4,
    teamsPerGroup: 4,
    season,
    startTurn: 6,
    turnsBetweenRounds: 7,
    turnsBetweenLegs: 7,
    name: 'CONMEBOL Sul-Americana',
    shortName: 'Sul-Americana',
    knockoutTwoLeg: true,
    seed: season * 1000 + 6,
  });

  // ── Champions League (16 times europeus, fundo de tela) ───
  const euTeamIds = allTeams
    .filter((t) => CHAMPIONS_EXTRA_SEEDS.some((s) => s.id === t.id))
    .slice(0, 16)
    .map((t) => t.id);

  const champions = createGroupsKnockout({
    teamIds: euTeamIds,
    numberOfGroups: 4,
    teamsPerGroup: 4,
    season,
    startTurn: 5,
    turnsBetweenRounds: 7,
    turnsBetweenLegs: 7,
    name: 'UEFA Champions League',
    shortName: 'Champions',
    knockoutTwoLeg: true,
    seed: season * 1000 + 4,
  });

  // ── Mundial de Clubes (8 times — 2 CONMEBOL, 1 UEFA, 4 outras confederações)
  // Vagas CONMEBOL: campeão e vice da Libertadores anterior; sem resultado anterior usa top 2 por reputação
  const top2BrMundial = (() => {
    const { champion, runnerUp } = previousLibertadoresFinalists ?? {};
    if (champion && runnerUp) return [champion, runnerUp];
    if (champion) return [champion, ...sortedByRep.filter((t) => t.id !== champion).slice(0, 1).map((t) => t.id)];
    return sortedByRep.slice(0, 2).map((t) => t.id);
  })();
  const top1SaMundial = allTeams
    .filter((t) => LIBERTADORES_EXTRA_SEEDS.some((s) => s.id === t.id))
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 1)
    .map((t) => t.id);
  // Vaga UEFA: campeão da Champions anterior; sem resultado usa o de maior reputação
  const top1EuMundial = previousChampionsChampion
    ? [previousChampionsChampion]
    : allTeams
        .filter((t) => CHAMPIONS_EXTRA_SEEDS.some((s) => s.id === t.id))
        .sort((a, b) => b.reputation - a.reputation)
        .slice(0, 1)
        .map((t) => t.id);
  // Rotaciona times extras (AFC/CAF/CONCACAF/OFC) por temporada — simulando classificação dinâmica
  const mundialExtrasPool = allTeams
    .filter((t) => MUNDIAL_EXTRA_SEEDS.some((s) => s.id === t.id));
  const mundialRng = createRng(season * 999 + 7);
  const shuffledExtras = [...mundialExtrasPool].sort(() => mundialRng() - 0.5);
  const mundialExtrasIds = shuffledExtras.slice(0, 4).map((t) => t.id);
  // Garante 8 times únicos
  const mundialTeamIds = [...new Set([...top2BrMundial, ...top1SaMundial, ...top1EuMundial, ...mundialExtrasIds])];
  // Completa até 8 se necessário
  if (mundialTeamIds.length < 8) {
    for (const t of sortedByRep) {
      if (!mundialTeamIds.includes(t.id)) mundialTeamIds.push(t.id);
      if (mundialTeamIds.length === 8) break;
    }
  }

  const mundial = createGroupsKnockout({
    teamIds: mundialTeamIds.slice(0, 8),
    numberOfGroups: 2,
    teamsPerGroup: 4,
    season,
    startTurn: 130,
    turnsBetweenRounds: 7,
    turnsBetweenLegs: 7,
    name: 'FIFA Mundial de Clubes',
    shortName: 'Mundial',
    knockoutTwoLeg: false,
    seed: season * 1000 + 7,
  });

  const result: Competition[] = [brasileirao, copa, libertadores, sulAmericana, mundial, champions];

  // ── Série B ───────────────────────────────────────────────
  if (serieBTeamIds.length >= 4) {
    const serieB = createBrasileirao({
      teamIds: serieBTeamIds,
      season,
      startTurn: 2,
      turnsBetweenRounds: 7,
      seed: season * 1000 + 20,
      id: `serie_b_${season}`,
      name: 'Campeonato Brasileiro Série B',
      shortName: 'Série B',
    });
    result.push(serieB);
  }

  // ── Série C ───────────────────────────────────────────────
  if (serieCTeamIds.length >= 4) {
    const serieC = createBrasileirao({
      teamIds: serieCTeamIds,
      season,
      startTurn: 3,
      turnsBetweenRounds: 7,
      seed: season * 1000 + 21,
      id: `serie_c_${season}`,
      name: 'Campeonato Brasileiro Série C',
      shortName: 'Série C',
    });
    result.push(serieC);
  }

  // ── Copa do Mundo (a cada 4 temporadas: 2026, 2030, 2034…) ──
  const isWorldCupSeason = (season - 2026) % 4 === 0;
  if (isWorldCupSeason) {
    const copaMundoIds = allTeams
      .filter((t) => COPA_MUNDO_SEEDS.some((s) => s.id === t.id))
      .map((t) => t.id);
    if (copaMundoIds.length >= 16) {
      const copaMundo = createGroupsKnockout({
        teamIds: copaMundoIds.slice(0, 16),
        numberOfGroups: 4,
        teamsPerGroup: 4,
        season,
        startTurn: 220,
        turnsBetweenRounds: 7,
        turnsBetweenLegs: 7,
        name: 'Copa do Mundo FIFA',
        shortName: 'Copa do Mundo',
        knockoutTwoLeg: false,
        seed: season * 1000 + 8,
      });
      result.push(copaMundo);
    }
  }

  // ── Paulistão — 16 times: 4 BR paulistas + 12 extras → 4 grupos de 4 ──
  if (SP_TEAM_IDS.has(userTeamId)) {
    const spBrTeams = teams.filter((t) => SP_TEAM_IDS.has(t.id)).map((t) => t.id);
    const spExtraTeams = allTeams
      .filter((t) => PAULISTAO_EXTRA_SEEDS.some((s) => s.id === t.id))
      .map((t) => t.id);
    const paulistaoTeamIds = [...spBrTeams, ...spExtraTeams]; // 4 BR + até 12 extras = 16

    if (paulistaoTeamIds.length >= 8) {
      const paulistao = createPaulistao({
        teamIds: paulistaoTeamIds.slice(0, 16),
        numberOfGroups: 4,
        teamsPerGroup: 4,
        season,
        startTurn: 2,
        turnsBetweenRounds: 7,
        turnsBetweenLegs: 7,
        name: 'Campeonato Paulista',
        shortName: 'Paulistão',
        seed: season * 1000 + 5,
      });
      result.push(paulistao);
    }
  }

  return result;
}

// ============================================================
// IA de transferências
// ============================================================

function processAITransfers(save: SaveGame): void {
  const market = save.transferMarket;
  const rng = Math.random;

  // A cada 7 turnos: times de IA listam jogadores para venda
  if (save.currentTurn % 7 === 0) {
    const aiTeams = save.teams.filter((t) => !t.isUserControlled);

    aiTeams.forEach((team) => {
      if (rng() >= 0.18) return; // 18% de chance por semana (era 12%)

      const listed = market
        .filter((l) => l.fromTeamId === team.id && l.status === 'open')
        .map((l) => l.playerId);

      // Times com elenco grande listam a partir do 3º melhor; outros a partir do 4º
      const keepTop = team.squad.length > 24 ? 3 : 4;
      const available = team.squad
        .filter((p) => !listed.includes(p.id))
        .sort((a, b) => b.overall - a.overall)
        .slice(keepTop);

      if (available.length === 0) return;

      // Escolhe aleatoriamente entre os até 6 primeiros disponíveis
      const pick = available[Math.floor(rng() * Math.min(available.length, 6))];
      market.push({
        id: nanoid(8),
        playerId: pick.id,
        fromTeamId: team.id,
        askingPrice: Math.round(pick.marketValue * (0.85 + rng() * 0.35)),
        turn: save.currentTurn,
        status: 'open',
        bids: [],
      });
    });
  }

  // Times de IA fazem ofertas em listagens abertas
  const openListings = market.filter((l) => l.status === 'open' && l.fromTeamId !== save.controlledTeamId);
  openListings.forEach((listing) => {
    if (rng() > 0.18) return; // 18% de chance por turno (era 8%)

    const aiCandidates = save.teams.filter(
      (t) => !t.isUserControlled && t.id !== listing.fromTeamId,
    );
    const biddingTeam = aiCandidates.find(() => rng() < 0.25);
    if (!biddingTeam) return;

    // Times com elenco curto pagam mais para fechar logo
    const needBonus = biddingTeam.squad.length < 20 ? 1.1 : 1.0;
    const amount = Math.round(listing.askingPrice * (0.85 + rng() * 0.3) * needBonus);

    if (biddingTeam.budget < amount * 0.75) return;
    if (listing.bids.some((b) => b.fromTeamId === biddingTeam.id)) return;

    listing.bids.push({
      id: nanoid(8),
      fromTeamId: biddingTeam.id,
      amount,
      turn: save.currentTurn,
      status: 'pending',
    });
  });

  // IA contra-oferta ou rejeita ofertas do user abaixo do limiar (70-89%)
  market
    .filter((l) => l.status === 'open' && l.fromTeamId !== save.controlledTeamId)
    .forEach((listing) => {
      const userBid = listing.bids.find((b) => b.fromTeamId === save.controlledTeamId && b.status === 'pending');
      if (userBid && userBid.amount < listing.askingPrice * 0.9 && userBid.amount >= listing.askingPrice * 0.6) {
        if (Math.random() < 0.4) {
          userBid.status = 'countered';
          userBid.counterAmount = Math.round(listing.askingPrice * (0.88 + Math.random() * 0.07));
        }
      }
    });

  // IA aceita automaticamente ofertas >= 90% do preço pedido (era 100%)
  market
    .filter((l) => l.status === 'open' && l.fromTeamId !== save.controlledTeamId)
    .forEach((listing) => {
      const threshold = listing.askingPrice * 0.9;
      const best = listing.bids
        .filter((b) => b.status === 'pending' && b.amount >= threshold)
        .sort((a, b) => b.amount - a.amount)[0];
      if (!best) return;
      executeTransfer(listing, best, save);
    });

  // Remover listagens antigas (> 56 turnos = 8 semanas)
  save.transferMarket = market.filter(
    (l) => l.status !== 'open' || save.currentTurn - l.turn <= 56,
  );
}

function generateSponsorOffer(save: SaveGame): void {
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (!userTeam) return;

  const eligible = SPONSOR_BRANDS.filter((b) => userTeam.reputation >= b.minReputation);
  if (eligible.length === 0) return;

  const pendingBrandIds = new Set(
    save.sponsorOffers.filter((o) => o.status === 'pending').map((o) => o.brandId),
  );
  const candidates = eligible.filter((b) => !pendingBrandIds.has(b.id));
  if (candidates.length === 0) return;

  const brand = candidates[Math.floor(Math.random() * candidates.length)];
  const repRatio = Math.min(1, userTeam.reputation / 100);
  const value = Math.round(brand.maxDealPerSeason * repRatio * (0.7 + Math.random() * 0.35));
  const seasons = 1 + Math.floor(Math.random() * 3);

  const offer: SponsorOffer = {
    id: nanoid(8),
    brandId: brand.id,
    brandName: brand.name,
    valuePerSeason: value,
    seasons,
    offeredAt: save.currentTurn,
    expiresAt: save.currentTurn + 28,
    status: 'pending',
  };

  save.sponsorOffers.push(offer);
  pushNews(save, {
    type: 'finance',
    title: `Proposta de patrocínio: ${brand.name}`,
    body: `${brand.name} oferece R$ ${(value / 1000).toFixed(1)}M/temporada por ${seasons} temporada(s). Válida por 28 dias — acesse Patrocínios.`,
  });
}

function executeTransfer(listing: TransferListing, bid: TransferBid, save: SaveGame) {
  const seller = save.teams.find((t) => t.id === listing.fromTeamId);
  const buyer = save.teams.find((t) => t.id === bid.fromTeamId);
  if (!seller || !buyer) return;

  // Bloqueia compra se o time do usuário já tem 30 jogadores
  if (buyer.isUserControlled && buyer.squad.length >= 30) return;

  const playerIdx = seller.squad.findIndex((p) => p.id === listing.playerId);
  if (playerIdx === -1) return;

  const player = seller.squad[playerIdx];
  seller.squad.splice(playerIdx, 1);
  seller.starting11 = seller.starting11.filter((id) => id !== player.id);
  seller.bench = seller.bench.filter((id) => id !== player.id);

  buyer.squad.push(player);
  buyer.budget -= bid.amount;
  seller.budget += bid.amount;

  listing.status = 'sold';
  bid.status = 'accepted';
  listing.bids.filter((b) => b.id !== bid.id).forEach((b) => (b.status = 'rejected'));
}

function createPlayerFromReport(report: import('@/types').ScoutReport, season: number): import('@/types').Player {
  const rng = createRng(report.realOVR * 100 + report.age * 7 + report.estimatedValue);
  const base = report.realOVR;
  const clamp = (v: number) => Math.max(30, Math.min(99, Math.round(v)));
  const noise = () => (rng() - 0.5) * 12;

  let attack: number, defense: number, pace: number, technique: number, stamina: number;
  switch (report.position) {
    case 'GK':
      defense = clamp(base * 1.15 + noise()); attack = clamp(base * 0.3 + noise());
      pace = clamp(base * 0.55 + noise()); technique = clamp(base * 0.7 + noise()); stamina = clamp(base * 0.8 + noise());
      break;
    case 'DF':
      defense = clamp(base * 1.1 + noise()); attack = clamp(base * 0.65 + noise());
      pace = clamp(base * 0.85 + noise()); technique = clamp(base * 0.75 + noise()); stamina = clamp(base * 0.9 + noise());
      break;
    case 'MF':
      attack = clamp(base * 0.9 + noise()); defense = clamp(base * 0.9 + noise());
      pace = clamp(base * 0.85 + noise()); technique = clamp(base * 1.0 + noise()); stamina = clamp(base * 0.95 + noise());
      break;
    default: // FW
      attack = clamp(base * 1.15 + noise()); defense = clamp(base * 0.55 + noise());
      pace = clamp(base * 1.05 + noise()); technique = clamp(base * 0.95 + noise()); stamina = clamp(base * 0.85 + noise());
  }

  const foot = rng() > 0.85 ? 'L' as const : rng() > 0.7 ? 'B' as const : 'R' as const;
  return {
    id: nanoid(8),
    name: report.name,
    age: report.age,
    position: report.position,
    foot,
    attack, defense, pace, technique, stamina,
    overall: report.realOVR,
    potential: report.realPotential,
    morale: 65 + Math.floor(rng() * 25),
    fitness: 70 + Math.floor(rng() * 20),
    contractUntil: season + 1 + Math.floor(rng() * 3),
    wageMonthly: Math.max(5, Math.round(report.estimatedValue * 0.003)),
    marketValue: report.estimatedValue,
    yellowCardsInComp: {},
    appearancesInComp: {},
    stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 },
  };
}

// ============================================================
// Store
// ============================================================

export const useGameStore = create<GameState>((set, get) => ({
  save: null,

  async newGame(managerName, teamId, saveName) {
    const brTeams = buildBrasileiraoTeams();

    // Suporte a times customizados: substituem o Avaí (último da tabela) no Brasileirão
    if (teamId.startsWith('custom_')) {
      try {
        type CustomSeed = { id: string; name: string; shortName: string; city: string; primaryColor: string; secondaryColor: string; tier: Team['tier']; reputation: number; budget: number; squadSeed: number };
        const customs: CustomSeed[] = JSON.parse(localStorage.getItem('elifoot_custom_teams') ?? '[]');
        const seed = customs.find((s) => s.id === teamId);
        if (!seed) throw new Error('Time personalizado não encontrado');
        const squad = generateSquad(seed.tier, seed.squadSeed);
        const { starting, bench } = autoPickStartingEleven(squad, '4-3-3');
        const customTeam: Team = {
          id: seed.id, name: seed.name, shortName: seed.shortName,
          city: seed.city, country: 'BR',
          primaryColor: seed.primaryColor, secondaryColor: seed.secondaryColor,
          tier: seed.tier, reputation: seed.reputation, budget: seed.budget,
          squad, formation: '4-3-3', starting11: starting, bench,
          isUserControlled: true,
        };
        const avaIdx = brTeams.findIndex((t) => t.id === 'ava');
        if (avaIdx !== -1) brTeams[avaIdx] = customTeam;
        else brTeams.push(customTeam);
      } catch (e) {
        throw new Error('Erro ao carregar time personalizado');
      }
    } else {
      const userTeam = brTeams.find((t) => t.id === teamId);
      if (!userTeam) throw new Error('Time não encontrado');
      userTeam.isUserControlled = true;
    }

    const extraTeams = buildExtraTeams([
      ...LIBERTADORES_EXTRA_SEEDS,
      ...CHAMPIONS_EXTRA_SEEDS,
      ...PAULISTAO_EXTRA_SEEDS,
      ...SULAMERICANA_EXTRA_SEEDS,
      ...MUNDIAL_EXTRA_SEEDS,
      ...COPA_MUNDO_SEEDS,
    ]);
    const serieBTeams = buildSerieBTeams();
    const serieCTeams = buildSerieCTeams();
    const allTeams = [...brTeams, ...extraTeams, ...serieBTeams, ...serieCTeams];
    const resolvedUserTeam = allTeams.find((t) => t.id === teamId);
    if (!resolvedUserTeam) throw new Error('Time não encontrado após setup');

    const competitions = generateInitialCompetitions(brTeams, allTeams, teamId, 2026);

    const save: SaveGame = {
      id: nanoid(10),
      name: saveName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      managerName,
      controlledTeamId: teamId,
      season: 2026,
      currentTurn: 1,
      teams: allTeams,
      competitions,
      news: [],
      seasonStartTurn: 1,
      seasonEndTurn: 280,
      transferMarket: [],
      trainingPlan: { type: 'tactics', intensity: 'normal' },
      tacticalSetup: { posture: 'balanced', pressing: 'medium', penaltyTakerId: null, cornerTakerId: null, captainId: null },
      financeHistory: [],
      boardObjectives: generateBoardObjectives(resolvedUserTeam),
      seasonRecords: [],
      hallOfFame: [],
      seasonAwards: [],
      seasonOver: false,
      youthPlayers: [
        generateYouthPlayer(2026 * 300 + 1, 2026),
        generateYouthPlayer(2026 * 300 + 2, 2026),
        generateYouthPlayer(2026 * 300 + 3, 2026),
      ],
      managerWarnings: 0,
      sponsorOffers: [],
      managerReputation: 0,
      managerXP: 0,
      managerXPSpent: 0,
      unlockedSkills: [],
      boardConfidence: 60,
      careerClubs: [resolvedUserTeam.name],
      scouts: [],
      scoutReports: [],
      loanMarket: [],
      activeLoans: [],
      playerInteractions: [],
      matchRatings: [],
      fanSatisfaction: 50,
      infrastructure: { training: 0, medical: 0, youth: 0 },
      internationalAbsences: [],
      squadMorale: 70,
      managerJobOffers: [],
      isNationalTeamManager: false,
      nationalTeamSquad: [],
      nationalTeamResults: [],
    };

    pushNews(save, {
      type: 'general',
      title: `Bem-vindo ao ${resolvedUserTeam.name}, ${managerName}`,
      body: `Você assume o comando técnico para a temporada ${save.season}. Boa sorte!`,
    });

    await persistSave(save);
    set({ save });
  },

  async loadGame(saveId) {
    const loaded = await loadSave(saveId);
    if (loaded) {
      // Compat: campos adicionados progressivamente
      if (!loaded.transferMarket)   loaded.transferMarket = [];
      if (!loaded.trainingPlan)     loaded.trainingPlan   = { type: 'tactics', intensity: 'normal' };
      if (!loaded.tacticalSetup)    loaded.tacticalSetup  = { posture: 'balanced', pressing: 'medium', penaltyTakerId: null, cornerTakerId: null, captainId: null };
      if (loaded.tacticalSetup && loaded.tacticalSetup.captainId === undefined) loaded.tacticalSetup.captainId = null;
      if (!loaded.financeHistory)   loaded.financeHistory = [];
      if (!loaded.boardObjectives)  {
        const ut = loaded.teams.find((t) => t.id === loaded.controlledTeamId);
        loaded.boardObjectives = ut ? generateBoardObjectives(ut) : [];
      }
      if (!loaded.seasonRecords)    loaded.seasonRecords  = [];
      if (!loaded.hallOfFame)       loaded.hallOfFame     = [];
      if (!loaded.seasonAwards)     loaded.seasonAwards   = [];
      if (loaded.seasonOver === undefined) loaded.seasonOver = false;
      if (!loaded.youthPlayers)     loaded.youthPlayers   = [
        generateYouthPlayer(loaded.season * 300 + 1, loaded.season),
        generateYouthPlayer(loaded.season * 300 + 2, loaded.season),
        generateYouthPlayer(loaded.season * 300 + 3, loaded.season),
      ];
      if (loaded.managerWarnings === undefined) loaded.managerWarnings = 0;
      if (!loaded.sponsorOffers)             loaded.sponsorOffers   = [];
      if (loaded.managerReputation === undefined) loaded.managerReputation = 0;
      if (loaded.managerXP         === undefined) loaded.managerXP         = 0;
      if (loaded.managerXPSpent    === undefined) loaded.managerXPSpent    = 0;
      if (!loaded.unlockedSkills)                loaded.unlockedSkills     = [];
      if (loaded.boardConfidence   === undefined) loaded.boardConfidence    = 60;
      if (!loaded.careerClubs) {
        const ut = loaded.teams.find((t) => t.id === loaded.controlledTeamId);
        loaded.careerClubs = ut ? [ut.name] : [];
      }
      // Compat: inicializa appearancesInComp em jogadores antigos
      loaded.teams.forEach((t) => t.squad.forEach((p) => {
        if (!p.appearancesInComp) p.appearancesInComp = {};
      }));
      if (!loaded.scouts) loaded.scouts = [];
      if (!loaded.scoutReports) loaded.scoutReports = [];
      if (!loaded.loanMarket) loaded.loanMarket = [];
      if (!loaded.activeLoans) loaded.activeLoans = [];
      if (!loaded.playerInteractions) loaded.playerInteractions = [];
      if (!loaded.matchRatings) loaded.matchRatings = [];
      if (loaded.fanSatisfaction === undefined) loaded.fanSatisfaction = 50;
      if (!loaded.infrastructure) loaded.infrastructure = { training: 0, medical: 0, youth: 0 };
      if (!loaded.internationalAbsences) loaded.internationalAbsences = [];
      if (loaded.squadMorale === undefined) loaded.squadMorale = 70;
      if (!loaded.managerJobOffers) loaded.managerJobOffers = [];
      // Compat: add nationality to existing players
      loaded.teams.forEach((t) => t.squad.forEach((p) => {
        if (!p.nationality) p.nationality = 'BR';
      }));
      // Compat: add Série B teams if not present
      const hasSerieBTeams = loaded.teams.some((t) => t.division === 'B');
      if (!hasSerieBTeams) {
        const newSerieBTeams = buildSerieBTeams();
        const existingIds = new Set(loaded.teams.map((t) => t.id));
        newSerieBTeams.filter((t) => !existingIds.has(t.id)).forEach((t) => loaded.teams.push(t));
      }
      // Compat: add Série C teams if not present
      const hasSerieCTeams = loaded.teams.some((t) => t.division === 'C');
      if (!hasSerieCTeams) {
        const newSerieCTeams = buildSerieCTeams();
        const existingIds2 = new Set(loaded.teams.map((t) => t.id));
        newSerieCTeams.filter((t) => !existingIds2.has(t.id)).forEach((t) => loaded.teams.push(t));
      }
      // Compat: national team fields
      if (loaded.isNationalTeamManager === undefined) loaded.isNationalTeamManager = false;
      if (!loaded.nationalTeamSquad) loaded.nationalTeamSquad = [];
      if (!loaded.nationalTeamResults) loaded.nationalTeamResults = [];
      set({ save: loaded });
    }
  },

  async saveGame() {
    const { save } = get();
    if (save) await persistSave(save);
  },

  closeGame() {
    set({ save: null });
  },

  async advanceTurn() {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;

    // Bloqueia se houver partida do user pendente no turno atual
    const userFixturePending = save.competitions.some((c) =>
      c.fixtures.some(
        (f) =>
          f.scheduledTurn === save.currentTurn &&
          !f.played &&
          (f.homeTeamId === save.controlledTeamId || f.awayTeamId === save.controlledTeamId),
      ),
    );
    if (userFixturePending) {
      pushNews(save, {
        type: 'general',
        title: 'Você tem uma partida hoje',
        body: 'Vá para a tela de partida antes de avançar o turno.',
      });
      set({ save });
      return;
    }

    // Auto-simula partidas do user que passaram do prazo (segurança)
    for (const comp of save.competitions) {
      for (const f of comp.fixtures) {
        if (f.played) continue;
        if (f.scheduledTurn >= save.currentTurn) continue;
        if (f.homeTeamId !== save.controlledTeamId && f.awayTeamId !== save.controlledTeamId) continue;
        const home = save.teams.find((t) => t.id === f.homeTeamId);
        const away = save.teams.find((t) => t.id === f.awayTeamId);
        if (!home || !away) continue;
        f.result = simulateMatch(home, away, {});
        f.played = true;
        updateStatsFromFixture(save.teams, f);
        if (comp.format === 'round_robin' || comp.format === 'groups_knockout') {
          if (f.stage === 'group' || f.stage === 'regular') {
            comp.standings = applyResultToStandings(comp.standings, f.homeTeamId, f.awayTeamId, f.result);
          }
        }
      }
    }

    // Simula fixtures da IA no turno atual
    simulateAllPendingFixturesForTurn(save, save.currentTurn);

    // Resolve mata-matas (determina vencedores e gera próximas fases)
    resolveKnockoutsForSave(save);

    // Notícias de títulos
    save.competitions.forEach((comp) => {
      if (comp.finished && comp.championId && !save.news.find((n) => n.title.includes(comp.shortName + ' campeão'))) {
        const champ = save.teams.find((t) => t.id === comp.championId);
        if (champ) {
          pushNews(save, {
            type: 'achievement',
            title: `${comp.shortName} campeão!`,
            body: `${champ.name} conquista o título do ${comp.name} ${comp.season}!`,
          });
        }
      }
    });

    // Avança turno
    save.currentTurn++;

    // Deadline Day — último dia da janela de transferências
    if (save.currentTurn === 28 || save.currentTurn === 161) {
      pushNews(save, {
        type: 'transfer',
        title: '⚡ DEADLINE DAY — Último dia da janela!',
        body: 'A janela de transferências fecha hoje. Última chance para reforçar ou liberar jogadores.',
      });
      processAITransfers(save); // processamento extra de IA no deadline day
    }

    // Notícias narrativas (a cada 7 turnos, máx. 1 por ciclo)
    if (save.currentTurn % 7 === 0) {
      const narrativeItems = generateNarrativeNews(save);
      if (narrativeItems.length > 0) {
        // Evita duplicar a mesma notícia na semana
        const alreadyHas = (title: string) => save.news.slice(0, 10).some((n) => n.title === title);
        for (const item of narrativeItems) {
          if (!alreadyHas(item.title)) { pushNews(save, item); break; }
        }
      }
    }

    // Notificação de contratos expirando (uma vez por temporada, no turno 200)
    if (save.currentTurn === 200) {
      const userTeamContracts = save.teams.find((t) => t.id === save.controlledTeamId);
      if (userTeamContracts) {
        const expiring = userTeamContracts.squad.filter((p) => p.contractUntil <= save.season);
        if (expiring.length > 0) {
          pushNews(save, {
            type: 'general',
            title: 'Contratos expirando',
            body: `${expiring.length} jogador(es) perderão o vínculo ao final da temporada: ${expiring.map((p) => p.name).join(', ')}. Renove em Elenco.`,
          });
        }
      }
    }

    // Finanças semanais (a cada 7 turnos)
    if (save.currentTurn % 7 === 0) {
      processWeeklyFinances(save);
    }

    // Detecta fim de temporada
    if (!save.seasonOver && isSeasonOver(save)) {
      processSeasonEnd(save);
      pushNews(save, {
        type: 'achievement',
        title: `Temporada ${save.season} encerrada!`,
        body: `Confira o resumo da temporada no painel principal.`,
      });
    }

    // Recuperação de fitness e moral leve
    save.teams.forEach((team) => {
      team.squad.forEach((p) => {
        p.fitness = Math.min(100, p.fitness + 2);
        if (p.morale < 70) p.morale = Math.min(70, p.morale + 1);
        // Cura de lesão
        if (p.injuredUntil && p.injuredUntil <= save.currentTurn) {
          p.injuredUntil = undefined;
        }
      });
    });

    // Treinamento semanal (a cada 7 turnos)
    if (save.currentTurn % 7 === 0) {
      const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
      if (userTeam) {
        const { injuredPlayerIds } = applyWeeklyTraining(userTeam, save.trainingPlan, save.currentTurn);
        if (injuredPlayerIds.length > 0) {
          injuredPlayerIds.forEach((pid) => {
            const p = userTeam.squad.find((x) => x.id === pid);
            if (p) {
              pushNews(save, {
                type: 'injury',
                title: `Lesão no treino`,
                body: `${p.name} se lesionou no treino e ficará afastado por alguns dias.`,
              });
            }
          });
        }
      }
    }

    // Expirar ofertas de patrocínio pendentes
    save.sponsorOffers = save.sponsorOffers.map((o) =>
      o.status === 'pending' && o.expiresAt < save.currentTurn
        ? { ...o, status: 'expired' as const }
        : o,
    );

    // Gerar novas ofertas de patrocínio (turn 14 no início, depois a cada 35 turnos)
    if (
      !save.dismissed &&
      (save.currentTurn === 14 || (save.currentTurn > 14 && save.currentTurn % 35 === 0))
    ) {
      generateSponsorOffer(save);
    }

    // Scout: entrega relatório quando missão termina
    (save.scouts ?? []).forEach((scout) => {
      if (scout.status === 'scouting' && scout.reportDueTurn && save.currentTurn >= scout.reportDueTurn) {
        const report = generateScoutReport(scout, save.season, save.currentTurn);
        if (!save.scoutReports) save.scoutReports = [];
        save.scoutReports.unshift(report);
        if (save.scoutReports.length > 50) save.scoutReports = save.scoutReports.slice(0, 50);
        scout.status = 'idle';
        scout.assignedTurn = undefined;
        scout.reportDueTurn = undefined;
        pushNews(save, { type: 'general', title: `Relatório: ${report.name}`, body: `${scout.name} encontrou um jogador. Acesse Scouting para ver.` });
      }
    });

    // Mercado de empréstimos: atualiza a cada 28 turnos
    if (save.currentTurn % 28 === 0 || !(save.loanMarket ?? []).some((o) => o.status === 'available')) {
      if (!save.loanMarket) save.loanMarket = [];
      save.loanMarket = save.loanMarket.map((o) =>
        o.status === 'available' && save.currentTurn - o.offeredAt > 28
          ? { ...o, status: 'expired' as const }
          : o,
      );
      const existingIds = new Set(save.loanMarket.map((o) => o.playerId));
      generateLoanOffers(save).forEach((o) => { if (!existingIds.has(o.playerId)) save.loanMarket!.push(o); });
    }

    // Interações com jogadores (a cada 21 turnos)
    if (save.currentTurn % 21 === 0 && !save.dismissed) {
      const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
      if (userTeam) {
        if (!save.playerInteractions) save.playerInteractions = [];
        const unresolved = save.playerInteractions.filter((i) => !i.resolved).map((i) => i.playerId);
        const candidates = userTeam.squad.filter((p) => !unresolved.includes(p.id));
        const unhappy = candidates.find((p) => p.morale < 40 && p.stats.appearances > 3);
        if (unhappy) {
          save.playerInteractions.push({
            id: nanoid(8), playerId: unhappy.id, playerName: unhappy.name,
            type: 'playing_time',
            message: `${unhappy.name} está insatisfeito com o tempo de jogo e pediu uma conversa.`,
            options: [
              { label: 'Prometo mais oportunidades', moraleEffect: 15, confidenceEffect: 5 },
              { label: 'Mantenha o foco no trabalho', moraleEffect: -5, confidenceEffect: 0 },
              { label: 'Pode procurar outro clube', moraleEffect: -10, confidenceEffect: -5, acceptsRequest: true },
            ],
            resolved: false, turn: save.currentTurn,
          });
        }
        const contractPlayer = candidates.find(
          (p) => p.contractUntil <= save.season && p.morale > 50 && !unresolved.includes(p.id)
        );
        if (contractPlayer) {
          save.playerInteractions.push({
            id: nanoid(8), playerId: contractPlayer.id, playerName: contractPlayer.name,
            type: 'contract_demand',
            message: `${contractPlayer.name} quer discutir a renovação do contrato antes do fim da temporada.`,
            options: [
              { label: 'Renovar com aumento de 15%', moraleEffect: 20, confidenceEffect: 8 },
              { label: 'Oferecer renovação sem aumento', moraleEffect: 5, confidenceEffect: 2 },
              { label: 'Não estamos interessados em renovar', moraleEffect: -20, confidenceEffect: -5 },
            ],
            resolved: false, turn: save.currentTurn,
          });
        }
      }
    }

    // Fan satisfaction semanal (baseado na posição no Brasileirão)
    if (save.currentTurn % 7 === 0) {
      const brasileiraoFan = save.competitions.find((c) => c.id.startsWith('brasileirao_'));
      if (brasileiraoFan) {
        const standings = sortStandings(brasileiraoFan.standings, save.teams, brasileiraoFan.id, brasileiraoFan.fixtures);
        const pos = standings.findIndex((s) => s.teamId === save.controlledTeamId) + 1;
        const fanDelta = pos === 0 ? 0 : pos <= 4 ? 2 : pos >= 17 ? -3 : 0;
        save.fanSatisfaction = Math.max(0, Math.min(100, (save.fanSatisfaction ?? 50) + fanDelta));
      }
    }

    // Moral coletivo do elenco (a cada 7 turnos)
    if (save.currentTurn % 7 === 0) {
      const userTeamMorale = save.teams.find((t) => t.id === save.controlledTeamId);
      if (userTeamMorale && userTeamMorale.squad.length > 0) {
        const avgMorale = userTeamMorale.squad.reduce((s, p) => s + p.morale, 0) / userTeamMorale.squad.length;
        save.squadMorale = Math.round(
          avgMorale * 0.6 +
          (save.fanSatisfaction ?? 50) * 0.25 +
          (save.boardConfidence ?? 60) * 0.15
        );
        save.squadMorale = Math.max(0, Math.min(100, save.squadMorale));
      }
    }

    // Base: gera novo jovem a cada 35 turnos
    if (save.currentTurn % 35 === 0 && !save.dismissed) {
      const youthLevel = save.infrastructure?.youth ?? 0;
      const baseSeed = save.season * 10000 + save.currentTurn;
      const newYouth = generateYouthPlayer(baseSeed, save.season);
      if (youthLevel >= 1) newYouth.potential = Math.min(90, (newYouth.potential ?? newYouth.overall) + youthLevel * 5);
      if (!save.youthPlayers) save.youthPlayers = [];
      if (save.youthPlayers.length < 8) {
        save.youthPlayers.push(newYouth);
        pushNews(save, {
          type: 'general',
          title: `Nova revelação na base: ${newYouth.name}`,
          body: `${newYouth.name} (${newYouth.position}, ${newYouth.age} anos, OVR ${newYouth.overall}) chegou à base do clube.`,
        });
      }
    }

    // Propostas de emprego (a cada 42 turnos)
    if (save.currentTurn % 42 === 0 && !save.dismissed) {
      if (!save.managerJobOffers) save.managerJobOffers = [];
      save.managerJobOffers = save.managerJobOffers.filter((o) => o.expiresAt > save.currentTurn);
      if (save.managerJobOffers.length < 3) {
        const rep = save.managerReputation ?? 0;
        const aiTeams = save.teams.filter(
          (t) => !t.isUserControlled && t.id !== save.controlledTeamId && (!t.division || t.division === 'A'),
        );
        if (aiTeams.length > 0) {
          const rng2 = Math.random;
          const candidate = aiTeams[Math.floor(rng2() * aiTeams.length)];
          if (!save.managerJobOffers.some((o) => o.teamId === candidate.id)) {
            const offer: ManagerJobOffer = {
              id: nanoid(8),
              teamId: candidate.id,
              teamName: candidate.name,
              salary: Math.round(candidate.reputation * 2 + 50),
              transferBudget: candidate.budget,
              reputationRequired: Math.max(0, rep - 500),
              expiresAt: save.currentTurn + 28,
              penaltyIfMidSeason: save.currentTurn > 28 && save.currentTurn < 250,
            };
            save.managerJobOffers.push(offer);
            pushNews(save, {
              type: 'general',
              title: `Proposta de emprego: ${candidate.name}`,
              body: `${candidate.name} quer você como técnico. Salário: R$ ${offer.salary}k/mês. Acesse Carreira para avaliar.`,
            });
          }
        }
      }
    }

    // Convocações internacionais (a cada 28 turnos, nas semanas 28 e 140)
    if (save.currentTurn % 28 === 0 && !save.dismissed) {
      if (!save.internationalAbsences) save.internationalAbsences = [];
      // Libera jogadores que voltaram
      save.internationalAbsences = save.internationalAbsences.filter((a) => a.returnTurn > save.currentTurn);
      // Chama jogadores com OVR >= 68 que não estão convocados
      const userTeamIntl = save.teams.find((t) => t.id === save.controlledTeamId);
      if (userTeamIntl) {
        const absentIds = new Set(save.internationalAbsences.map((a) => a.playerId));
        const eligible = userTeamIntl.squad
          .filter((p) => p.overall >= 68 && !absentIds.has(p.id) && !p.injuredUntil)
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 2) + 1); // 1-2 convocados
        if (eligible.length > 0) {
          eligible.forEach((p) => {
            save.internationalAbsences!.push({ playerId: p.id, playerName: p.name, returnTurn: save.currentTurn + 7 });
          });
          pushNews(save, {
            type: 'general',
            title: `Convocação internacional: ${eligible.map((p) => p.name).join(', ')}`,
            body: `${eligible.length > 1 ? 'Jogadores convocados' : 'Jogador convocado'} para a seleção. Retornam no dia ${save.currentTurn + 7}.`,
          });
        }
      }
    }

    // Retorno de jogadores da seleção
    if (save.internationalAbsences) {
      const returned = save.internationalAbsences.filter((a) => a.returnTurn <= save.currentTurn);
      if (returned.length > 0) {
        pushNews(save, {
          type: 'general',
          title: `Retorno da seleção: ${returned.map((a) => a.playerName).join(', ')}`,
          body: 'Jogadores estão de volta ao clube.',
        });
        save.internationalAbsences = save.internationalAbsences.filter((a) => a.returnTurn > save.currentTurn);
      }
    }

    // Convite de seleção nacional (rep >= 2000, a cada 56 turnos, sem oferta ativa)
    if (!save.isNationalTeamManager && !save.nationalTeamOffer && save.currentTurn % 56 === 0) {
      const rep = save.managerReputation ?? 0;
      if (rep >= 2000) {
        const offer: import('@/types').NationalTeamOffer = {
          country: 'BR',
          teamName: 'Seleção Brasileira',
          teamId: 'nt_bra',
          salary: 500,
          expiresAt: save.currentTurn + 28,
        };
        save.nationalTeamOffer = offer;
        pushNews(save, {
          type: 'achievement',
          title: 'Convite da Seleção Brasileira!',
          body: 'Você recebeu um convite para comandar a Seleção Brasileira. Acesse a aba Seleção Nacional para responder.',
        });
      }
    }

    // Data FIFA — simula amistoso da seleção (a cada 28 turnos, quando for técnico)
    if (save.isNationalTeamManager && save.nationalTeamCountry && save.currentTurn % 28 === 0) {
      const ntSquadIds = save.nationalTeamSquad ?? [];
      const allNtPlayers = save.teams.flatMap((t) => t.squad.filter((p) => ntSquadIds.includes(p.id)));
      if (allNtPlayers.length >= 11) {
        const opponents = [
          { id: 'nt_arg', name: 'Argentina', country: 'AR' },
          { id: 'nt_fra', name: 'França', country: 'FR' },
          { id: 'nt_ger', name: 'Alemanha', country: 'DE' },
          { id: 'nt_eng', name: 'Inglaterra', country: 'EN' },
          { id: 'nt_esp', name: 'Espanha', country: 'ES' },
        ];
        const opp = opponents[save.currentTurn % opponents.length];
        const ntTeam = save.teams.find((t) => t.id === save.nationalTeamCountry?.replace('BR', 'nt_bra').replace('AR', 'nt_arg').replace('FR', 'nt_fra')) ?? {
          id: 'nt_tmp',
          name: save.nationalTeamCountry === 'BR' ? 'Brasil' : save.nationalTeamCountry ?? 'Seleção',
          shortName: save.nationalTeamCountry ?? 'NT',
          city: '',
          country: '',
          primaryColor: '#009C3B',
          secondaryColor: '#FFD700',
          tier: 'elite' as const,
          reputation: 85,
          budget: 0,
          squad: allNtPlayers,
          formation: '4-3-3' as const,
          starting11: allNtPlayers.slice(0, 11).map((p) => p.id),
          bench: allNtPlayers.slice(11, 16).map((p) => p.id),
          isUserControlled: false,
        };
        const oppTeam = save.teams.find((t) => t.id === opp.id) ?? {
          id: opp.id,
          name: opp.name,
          shortName: opp.country,
          city: '',
          country: opp.country,
          primaryColor: '#666666',
          secondaryColor: '#FFFFFF',
          tier: 'elite' as const,
          reputation: 80,
          budget: 0,
          squad: [],
          formation: '4-4-2' as const,
          starting11: [],
          bench: [],
          isUserControlled: false,
        };
        const ntResult = simulateMatch(ntTeam, oppTeam, {});
        const ntRecord: import('@/types').NationalTeamResult = {
          id: nanoid(8),
          turn: save.currentTurn,
          season: save.season,
          opponentId: opp.id,
          opponentName: opp.name,
          opponentCountry: opp.country,
          goals: ntResult.homeGoals,
          opponentGoals: ntResult.awayGoals,
          isHome: true,
        };
        if (!save.nationalTeamResults) save.nationalTeamResults = [];
        save.nationalTeamResults.push(ntRecord);
        const outcome = ntResult.homeGoals > ntResult.awayGoals ? 'vitória' : ntResult.homeGoals < ntResult.awayGoals ? 'derrota' : 'empate';
        pushNews(save, {
          type: 'match',
          title: `Data FIFA — Seleção: ${ntResult.homeGoals}x${ntResult.awayGoals} vs ${opp.name}`,
          body: `A seleção conquistou uma ${outcome} no amistoso internacional.`,
        });
      }
    }

    // Infraestrutura — efeito médico: acelera recuperação de lesões
    if (save.currentTurn % 7 === 0 && save.infrastructure?.medical > 0) {
      const userTeamMed = save.teams.find((t) => t.id === save.controlledTeamId);
      userTeamMed?.squad.forEach((p) => {
        if (p.injuredUntil && p.injuredUntil > save.currentTurn) {
          p.injuredUntil = Math.max(save.currentTurn, p.injuredUntil - save.infrastructure.medical);
        }
      });
    }

    // Mercado de transferências
    processAITransfers(save);

    await persistSave(save);
    set({ save });
  },

  async playUserMatch(fixtureId) {
    const state = get();
    if (!state.save) return null;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;

    let targetCompId: string | null = null;
    let targetFixture: Fixture | null = null;
    for (const comp of save.competitions) {
      const f = comp.fixtures.find((x) => x.id === fixtureId);
      if (f) { targetCompId = comp.id; targetFixture = f; break; }
    }
    if (!targetFixture || !targetCompId) return null;
    if (targetFixture.played) return targetFixture.result ?? null;

    const home = save.teams.find((t) => t.id === targetFixture!.homeTeamId)!;
    const away = save.teams.find((t) => t.id === targetFixture!.awayTeamId)!;

    const isSingleLegKnockout =
      !targetFixture.isTwoLeg &&
      targetFixture.stage !== 'regular' &&
      targetFixture.stage !== 'group';

    const isUserHome = targetFixture.homeTeamId === save.controlledTeamId;
    const tactical = save.tacticalSetup;

    const result = simulateMatch(home, away, {
      decidePenalties: isSingleLegKnockout,
      homePosture: isUserHome ? tactical.posture : 'balanced',
      awayPosture: isUserHome ? 'balanced' : tactical.posture,
      homePressing: isUserHome ? tactical.pressing : 'medium',
      awayPressing: isUserHome ? 'medium' : tactical.pressing,
    });
    targetFixture.result = result;
    targetFixture.played = true;
    updateStatsFromFixture(save.teams, targetFixture);

    const comp = save.competitions.find((c) => c.id === targetCompId)!;
    if (
      comp.format === 'round_robin' ||
      comp.format === 'groups_knockout' ||
      comp.format === 'groups_then_knockout_paulista'
    ) {
      if (targetFixture.stage === 'group' || targetFixture.stage === 'regular') {
        comp.standings = applyResultToStandings(
          comp.standings,
          targetFixture.homeTeamId,
          targetFixture.awayTeamId,
          result,
        );
        comp.standings = sortStandings(comp.standings, save.teams, comp.id, comp.fixtures);
      }
    }

    // Bilheteria do jogo em casa
    processTicketRevenue(save, fixtureId);

    // Efeito de clássico/derby
    const opponentId = isUserHome ? targetFixture.awayTeamId : targetFixture.homeTeamId;
    const rivalry = getRivalry(save.controlledTeamId, opponentId);
    if (rivalry) {
      const userGoals = isUserHome ? result.homeGoals : result.awayGoals;
      const oppGoals  = isUserHome ? result.awayGoals : result.homeGoals;
      const won = userGoals > oppGoals;
      const drew = userGoals === oppGoals;
      const delta = derbyMoraleEffect(won, drew, rivalry.tier);
      const userTeamObj = save.teams.find((t) => t.id === save.controlledTeamId);
      userTeamObj?.squad.forEach((p) => { p.morale = Math.max(0, Math.min(100, p.morale + delta)); });
      if (won) {
        save.managerXP = (save.managerXP ?? 0) + 50;
        save.managerReputation = (save.managerReputation ?? 0) + 30;
      }
      const derbyNews = generateDerbyNews(save, save.controlledTeamId, opponentId, userGoals, oppGoals);
      if (derbyNews) pushNews(save, derbyNews);
    }

    // Fan satisfaction após partida
    {
      const userGoalsFan = isUserHome ? result.homeGoals : result.awayGoals;
      const oppGoalsFan  = isUserHome ? result.awayGoals : result.homeGoals;
      const derbyMult = rivalry ? (rivalry.tier === 'classico' ? 2 : 1.5) : 1;
      const fanDelta = userGoalsFan > oppGoalsFan ? Math.round(5 * derbyMult)
        : userGoalsFan < oppGoalsFan ? Math.round(-7 * derbyMult) : 1;
      save.fanSatisfaction = Math.max(0, Math.min(100, (save.fanSatisfaction ?? 50) + fanDelta));
    }

    // Resolve mata-matas depois da partida do usuário
    resolveKnockoutsForSave(save);

    if (!rivalry) {
      pushNews(save, {
        type: 'match',
        title: `${home.shortName} ${result.homeGoals} x ${result.awayGoals} ${away.shortName}`,
        body: `Partida válida pelo ${comp.shortName} concluída.`,
      });
    }

    await persistSave(save);
    set({ save });
    return result;
  },

  // ── Simulação em dois tempos ──────────────────────────────

  async simulateFirstHalf(fixtureId) {
    const { save } = get();
    if (!save) return null;

    let targetFixture: Fixture | null = null;
    for (const comp of save.competitions) {
      const f = comp.fixtures.find((x) => x.id === fixtureId);
      if (f) { targetFixture = f; break; }
    }
    if (!targetFixture || targetFixture.played) return null;

    const home = save.teams.find((t) => t.id === targetFixture!.homeTeamId);
    const away = save.teams.find((t) => t.id === targetFixture!.awayTeamId);
    if (!home || !away) return null;

    const isUserHome = targetFixture.homeTeamId === save.controlledTeamId;
    const tactical = save.tacticalSetup;

    return simulateMatch(home, away, {
      minuteEnd: 45,
      homePosture: isUserHome ? tactical.posture : 'balanced',
      awayPosture: isUserHome ? 'balanced' : tactical.posture,
      homePressing: isUserHome ? tactical.pressing : 'medium',
      awayPressing: isUserHome ? 'medium' : tactical.pressing,
    });
  },

  async simulateSecondHalf(fixtureId, firstHalfResult, subs) {
    const state = get();
    if (!state.save) return null;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;

    let targetCompId: string | null = null;
    let targetFixture: Fixture | null = null;
    for (const comp of save.competitions) {
      const f = comp.fixtures.find((x) => x.id === fixtureId);
      if (f) { targetCompId = comp.id; targetFixture = f; break; }
    }
    if (!targetFixture || !targetCompId || targetFixture.played) return null;

    const home = save.teams.find((t) => t.id === targetFixture!.homeTeamId)!;
    const away = save.teams.find((t) => t.id === targetFixture!.awayTeamId)!;

    const isSingleLegKnockout =
      !targetFixture.isTwoLeg &&
      targetFixture.stage !== 'regular' &&
      targetFixture.stage !== 'group';

    const isUserHome = targetFixture.homeTeamId === save.controlledTeamId;
    const tactical = save.tacticalSetup;

    // Copia o time do usuário e aplica as substituições
    const homeForSim: typeof home = isUserHome ? JSON.parse(JSON.stringify(home)) : home;
    const awayForSim: typeof away = isUserHome ? away : JSON.parse(JSON.stringify(away));
    const userTeamForSim = isUserHome ? homeForSim : awayForSim;
    for (const sub of subs) {
      const idx = userTeamForSim.starting11.indexOf(sub.outId);
      if (idx !== -1) userTeamForSim.starting11[idx] = sub.inId;
    }

    const secondHalf = simulateMatch(homeForSim, awayForSim, {
      minuteStart: 46,
      minuteEnd: 90,
      homePosture: isUserHome ? tactical.posture : 'balanced',
      awayPosture: isUserHome ? 'balanced' : tactical.posture,
      homePressing: isUserHome ? tactical.pressing : 'medium',
      awayPressing: isUserHome ? 'medium' : tactical.pressing,
    });

    // Combina os dois tempos
    const combined: MatchResult = {
      homeGoals: firstHalfResult.homeGoals + secondHalf.homeGoals,
      awayGoals: firstHalfResult.awayGoals + secondHalf.awayGoals,
      homeShots: firstHalfResult.homeShots + secondHalf.homeShots,
      awayShots: firstHalfResult.awayShots + secondHalf.awayShots,
      homeShotsOnTarget: firstHalfResult.homeShotsOnTarget + secondHalf.homeShotsOnTarget,
      awayShotsOnTarget: firstHalfResult.awayShotsOnTarget + secondHalf.awayShotsOnTarget,
      homePossession: Math.round((firstHalfResult.homePossession + secondHalf.homePossession) / 2),
      events: [...firstHalfResult.events, ...secondHalf.events],
    };

    // Pênaltis se jogo único de mata-mata e empate no placar agregado
    if (isSingleLegKnockout && combined.homeGoals === combined.awayGoals) {
      const { homePens, awayPens } = simulatePenaltyShootout(homeForSim, awayForSim, Math.random);
      combined.homePenalties = homePens;
      combined.awayPenalties = awayPens;
      combined.events.push({
        minute: 120,
        type: 'penalty_scored',
        side: homePens > awayPens ? 'home' : 'away',
        description: `Disputa de pênaltis: ${homeForSim.shortName} ${homePens} x ${awayPens} ${awayForSim.shortName}.`,
      });
    }

    targetFixture.result = combined;
    targetFixture.played = true;
    updateStatsFromFixture(save.teams, targetFixture);

    const comp = save.competitions.find((c) => c.id === targetCompId)!;
    if (
      comp.format === 'round_robin' ||
      comp.format === 'groups_knockout' ||
      comp.format === 'groups_then_knockout_paulista'
    ) {
      if (targetFixture.stage === 'group' || targetFixture.stage === 'regular') {
        comp.standings = applyResultToStandings(
          comp.standings,
          targetFixture.homeTeamId,
          targetFixture.awayTeamId,
          combined,
        );
        comp.standings = sortStandings(comp.standings, save.teams, comp.id, comp.fixtures);
      }
    }

    processTicketRevenue(save, fixtureId);

    // Efeito de clássico/derby
    const isUserHome2 = targetFixture.homeTeamId === save.controlledTeamId;
    const opponentId2 = isUserHome2 ? targetFixture.awayTeamId : targetFixture.homeTeamId;
    const rivalry2 = getRivalry(save.controlledTeamId, opponentId2);
    if (rivalry2) {
      const userGoals2 = isUserHome2 ? combined.homeGoals : combined.awayGoals;
      const oppGoals2  = isUserHome2 ? combined.awayGoals : combined.homeGoals;
      const won2 = userGoals2 > oppGoals2;
      const drew2 = userGoals2 === oppGoals2;
      const delta2 = derbyMoraleEffect(won2, drew2, rivalry2.tier);
      const userTeamObj2 = save.teams.find((t) => t.id === save.controlledTeamId);
      userTeamObj2?.squad.forEach((p) => { p.morale = Math.max(0, Math.min(100, p.morale + delta2)); });
      if (won2) {
        save.managerXP = (save.managerXP ?? 0) + 50;
        save.managerReputation = (save.managerReputation ?? 0) + 30;
      }
      const derbyNews2 = generateDerbyNews(save, save.controlledTeamId, opponentId2, userGoals2, oppGoals2);
      if (derbyNews2) pushNews(save, derbyNews2);
    }

    // Fan satisfaction após partida (segundo tempo)
    {
      const userGoalsFan2 = isUserHome2 ? combined.homeGoals : combined.awayGoals;
      const oppGoalsFan2  = isUserHome2 ? combined.awayGoals : combined.homeGoals;
      const derbyMult2 = rivalry2 ? (rivalry2.tier === 'classico' ? 2 : 1.5) : 1;
      const fanDelta2 = userGoalsFan2 > oppGoalsFan2 ? Math.round(5 * derbyMult2)
        : userGoalsFan2 < oppGoalsFan2 ? Math.round(-7 * derbyMult2) : 1;
      save.fanSatisfaction = Math.max(0, Math.min(100, (save.fanSatisfaction ?? 50) + fanDelta2));
    }

    resolveKnockoutsForSave(save);

    if (!rivalry2) {
      pushNews(save, {
        type: 'match',
        title: `${home.shortName} ${combined.homeGoals} x ${combined.awayGoals} ${away.shortName}`,
        body: `Partida válida pelo ${comp.shortName} concluída.`,
      });
    }

    await persistSave(save);
    set({ save });
    return combined;
  },

  // ── Renovação de contrato ──────────────────────────────────

  renewContract(playerId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!userTeam) return;
    const player = userTeam.squad.find((p) => p.id === playerId);
    if (!player) return;

    const bonus = player.wageMonthly; // bônus de assinatura = 1 mês de salário
    if (userTeam.budget < bonus) {
      pushNews(save, {
        type: 'finance',
        title: 'Budget insuficiente',
        body: `Não há budget para pagar o bônus de renovação de ${player.name} (R$ ${bonus}k).`,
      });
      set({ save });
      return;
    }

    userTeam.budget -= bonus;
    player.contractUntil = save.season + 3;
    player.wageMonthly = Math.round(player.wageMonthly * 1.08);

    pushNews(save, {
      type: 'transfer',
      title: `Contrato renovado: ${player.name}`,
      body: `Novo vínculo até ${player.contractUntil}. Salário: R$ ${player.wageMonthly}k/mês.`,
    });

    set({ save });
  },

  setUserStarting11(ids) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const team = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!team) return;
    team.starting11 = ids;
    set({ save });
  },

  // ── Transferências ────────────────────────────────────────

  listPlayerForSale(playerId, askingPrice) {
    const state = get();
    if (!state.save) return;
    if (!isTransferWindowOpen(state.save.currentTurn)) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const existing = save.transferMarket.find(
      (l) => l.playerId === playerId && l.status === 'open',
    );
    if (existing) return;
    save.transferMarket.push({
      id: nanoid(8),
      playerId,
      fromTeamId: save.controlledTeamId,
      askingPrice,
      turn: save.currentTurn,
      status: 'open',
      bids: [],
    });
    set({ save });
  },

  withdrawListing(listingId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const l = save.transferMarket.find((x) => x.id === listingId);
    if (l && l.fromTeamId === save.controlledTeamId) l.status = 'withdrawn';
    set({ save });
  },

  makeBid(listingId, amount) {
    const state = get();
    if (!state.save) return;
    if (!isTransferWindowOpen(state.save.currentTurn)) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const listing = save.transferMarket.find((l) => l.id === listingId);
    if (!listing || listing.status !== 'open') return;

    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId)!;
    if (userTeam.budget < amount) return;

    if (listing.bids.some((b) => b.fromTeamId === save.controlledTeamId)) return;
    listing.bids.push({
      id: nanoid(8),
      fromTeamId: save.controlledTeamId,
      amount,
      turn: save.currentTurn,
      status: 'pending',
    });
    set({ save });
  },

  acceptBid(listingId, bidId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const listing = save.transferMarket.find(
      (l) => l.id === listingId && l.fromTeamId === save.controlledTeamId,
    );
    const bid = listing?.bids.find((b) => b.id === bidId);
    if (!listing || !bid) return;

    // Regra dos 12 jogos: bloqueia transferência doméstica mid-season se elegibilidade violada
    if (!isEligibleForSerieATransfer(listing.playerId, save, listing.fromTeamId, bid.fromTeamId)) {
      pushNews(save, {
        type: 'transfer',
        title: 'Transferência bloqueada',
        body: 'O jogador disputou mais de 12 partidas pelo Brasileirão e não pode ser transferido para outro clube da Série A nesta janela.',
      });
      set({ save });
      return;
    }

    const player = save.teams.flatMap((t) => t.squad).find((p) => p.id === listing.playerId);
    executeTransfer(listing, bid, save);
    if (player) recordTransfer(save, player.name, bid.amount, true);
    pushNews(save, {
      type: 'transfer',
      title: 'Transferência concluída',
      body: `Venda aceita por R$ ${(bid.amount / 1000).toFixed(1)}M.`,
    });
    set({ save });
  },

  rejectBid(listingId, bidId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const listing = save.transferMarket.find(
      (l) => l.id === listingId && l.fromTeamId === save.controlledTeamId,
    );
    const bid = listing?.bids.find((b) => b.id === bidId);
    if (bid) bid.status = 'rejected';
    set({ save });
  },

  // ── Base / academia ────────────────────────────────────────

  promoteYouthPlayer(playerId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const idx = save.youthPlayers.findIndex((p) => p.id === playerId);
    if (idx === -1) return;
    const [player] = save.youthPlayers.splice(idx, 1);
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (userTeam) {
      if (userTeam.squad.length >= 30) {
        pushNews(save, {
          type: 'general',
          title: 'Elenco cheio',
          body: `Limite de 30 jogadores atingido. Libere ou venda um atleta antes de promover ${player.name}.`,
        });
        set({ save });
        return;
      }
      userTeam.squad.push(player);
      pushNews(save, {
        type: 'general',
        title: `${player.name} promovido da base`,
        body: `${player.name} (${player.position}, ${player.age} anos) sobe ao time principal.`,
      });
    }
    set({ save });
  },

  // ── Tática ───────────────────────────────────────────────

  setTacticalSetup(setup) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.tacticalSetup = setup;
    set({ save });
  },

  setFormation(formation) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const team = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!team) return;
    team.formation = formation;
    const { starting, bench } = autoPickStartingEleven(team.squad, formation);
    team.starting11 = starting;
    team.bench = bench;
    set({ save });
  },

  // ── Nova temporada ────────────────────────────────────────

  async startNewSeason() {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;

    // Captura classificação real do Brasileirão antes de reiniciar
    const prevBrasileirao = save.competitions.find((c) => c.format === 'round_robin');
    const prevBrasileiraoStandings = prevBrasileirao
      ? sortStandings(prevBrasileirao.standings, save.teams)
      : undefined;

    // Captura campeão e vice da Libertadores antes de reiniciar
    const prevLibertadores = save.competitions.find((c) => c.shortName === 'Libertadores');
    const prevLibertadoresFinalists = (() => {
      if (!prevLibertadores?.championId) return undefined;
      const finalMatch = prevLibertadores.knockoutBracket?.find((p) => p.stage === 'final');
      const runnerUp = finalMatch
        ? (finalMatch.team1Id === prevLibertadores.championId ? finalMatch.team2Id : finalMatch.team1Id)
        : undefined;
      return { champion: prevLibertadores.championId, runnerUp };
    })();

    // Captura campeão da Champions League antes de reiniciar
    const prevChampionsChampion = save.competitions.find((c) => c.shortName === 'Champions')?.championId;

    startNewSeason(save);

    // Garante que os times extras (SA, EU, paulistas) estejam em save.teams
    const knownIds = new Set(save.teams.map((t) => t.id));
    const allExtraSeeds = [
      ...LIBERTADORES_EXTRA_SEEDS,
      ...CHAMPIONS_EXTRA_SEEDS,
      ...PAULISTAO_EXTRA_SEEDS,
      ...SULAMERICANA_EXTRA_SEEDS,
      ...MUNDIAL_EXTRA_SEEDS,
      ...COPA_MUNDO_SEEDS,
    ];
    const missingExtras = buildExtraTeams(allExtraSeeds.filter((s) => !knownIds.has(s.id)));
    save.teams.push(...missingExtras);
    // Garante que times da Série B estejam em save.teams
    buildSerieBTeams().filter((t) => !knownIds.has(t.id)).forEach((t) => save.teams.push(t));
    // Garante que times da Série C estejam em save.teams
    buildSerieCTeams().filter((t) => !knownIds.has(t.id)).forEach((t) => save.teams.push(t));

    // Recria competições respeitando promoção/rebaixamento
    const ORIGINAL_SERIE_A = new Set(['fla','pal','cor','sao','flu','atm','bot','cru','gre','int','bah','for','ath','vas','rbb','cri','jvt','cui','gpa','ava']);
    // Série A: times originais sem division='B'/'C', ou times explicitamente promovidos (division='A')
    const brTeams = save.teams.filter(
      (t) => t.division === 'A' || (ORIGINAL_SERIE_A.has(t.id) && t.division !== 'B' && t.division !== 'C'),
    );
    const comps = generateInitialCompetitions(
      brTeams,
      save.teams,
      save.controlledTeamId,
      save.season,
      prevBrasileiraoStandings,
      prevLibertadoresFinalists,
      prevChampionsChampion,
    );
    save.competitions = comps;

    pushNews(save, {
      type: 'general',
      title: `Temporada ${save.season} começa!`,
      body: `Nova temporada iniciada. Bom trabalho, ${save.managerName}!`,
    });

    await persistSave(save);
    set({ save });
  },

  // ── Patrocínios ───────────────────────────────────────────

  acceptSponsorOffer(offerId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const offer = save.sponsorOffers.find((o) => o.id === offerId);
    if (!offer || offer.status !== 'pending') return;

    // Encerra deal ativo anterior
    save.sponsorOffers
      .filter((o) => o.status === 'active')
      .forEach((o) => { o.status = 'expired'; });

    offer.status = 'active';
    offer.activeSince = save.season;
    offer.activeUntil = save.season + offer.seasons - 1;

    pushNews(save, {
      type: 'finance',
      title: `Contrato firmado: ${offer.brandName}`,
      body: `Patrocínio de R$ ${(offer.valuePerSeason / 1000).toFixed(1)}M/temporada — até a temporada ${offer.activeUntil}.`,
    });

    set({ save });
  },

  rejectSponsorOffer(offerId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const offer = save.sponsorOffers.find((o) => o.id === offerId);
    if (!offer || offer.status !== 'pending') return;
    offer.status = 'rejected';
    set({ save });
  },

  // ── Carreira ──────────────────────────────────────────────

  switchTeam(teamId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const newTeam = save.teams.find((t) => t.id === teamId);
    if (!newTeam) return;

    const oldTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (oldTeam) oldTeam.isUserControlled = false;

    newTeam.isUserControlled = true;
    save.controlledTeamId = teamId;
    save.dismissed = false;
    save.managerWarnings = 0;
    save.boardObjectives = generateBoardObjectives(newTeam);
    // Deais de patrocínio ficam com o clube anterior
    save.sponsorOffers = save.sponsorOffers
      .map((o) => o.status === 'active' ? { ...o, status: 'expired' as const } : o)
      .filter((o) => o.status !== 'pending');

    pushNews(save, {
      type: 'general',
      title: `Você assume o ${newTeam.name}`,
      body: `Nova missão: ${newTeam.name}. Boa sorte, ${save.managerName}!`,
    });

    set({ save });
  },

  resignFromClub() {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.dismissed = true;
    pushNews(save, {
      type: 'general',
      title: 'Você pediu demissão',
      body: 'Acesse Histórico para escolher um novo clube.',
    });
    set({ save });
  },

  unlockSkill(skillId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const skill = MANAGER_SKILLS.find((s) => s.id === skillId);
    if (!skill) return;
    const available = (save.managerXP ?? 0) - (save.managerXPSpent ?? 0);
    if (available < skill.cost) return;
    if ((save.unlockedSkills ?? []).includes(skillId)) return;
    save.managerXPSpent = (save.managerXPSpent ?? 0) + skill.cost;
    save.unlockedSkills = [...(save.unlockedSkills ?? []), skillId];
    set({ save });
  },

  // ── Treinamento ───────────────────────────────────────────

  setTrainingPlan(plan) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.trainingPlan = plan;
    set({ save });
  },

  // ── Coletiva de imprensa ──────────────────────────────────

  applyPressConferenceEffects(effects) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.boardConfidence = Math.max(0, Math.min(100, (save.boardConfidence ?? 60) + effects.boardEffect));
    save.fanSatisfaction = Math.max(0, Math.min(100, (save.fanSatisfaction ?? 50) + effects.fanEffect));
    if (effects.moraleEffect !== 0) {
      const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
      userTeam?.squad.forEach((p) => {
        p.morale = Math.max(0, Math.min(100, p.morale + effects.moraleEffect));
      });
    }
    set({ save });
  },

  // ── Propostas de emprego ──────────────────────────────────

  acceptJobOffer(offerId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const offer = (save.managerJobOffers ?? []).find((o) => o.id === offerId);
    if (!offer) return;
    const newTeam = save.teams.find((t) => t.id === offer.teamId);
    if (!newTeam) return;
    const oldTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (oldTeam) oldTeam.isUserControlled = false;
    newTeam.isUserControlled = true;
    save.controlledTeamId = offer.teamId;
    save.dismissed = false;
    save.managerWarnings = 0;
    save.boardObjectives = generateBoardObjectives(newTeam);
    save.managerJobOffers = [];
    save.sponsorOffers = save.sponsorOffers
      .map((o) => o.status === 'active' ? { ...o, status: 'expired' as const } : o)
      .filter((o) => o.status !== 'pending');
    if (!save.careerClubs) save.careerClubs = [];
    if (!save.careerClubs.includes(newTeam.name)) save.careerClubs.push(newTeam.name);
    pushNews(save, {
      type: 'general',
      title: `Você aceita a proposta do ${newTeam.name}!`,
      body: `Novo clube, nova missão. Salário: R$ ${offer.salary}k/mês. Boa sorte, ${save.managerName}!`,
    });
    set({ save });
  },

  rejectJobOffer(offerId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.managerJobOffers = (save.managerJobOffers ?? []).filter((o) => o.id !== offerId);
    set({ save });
  },

  // ── Counter-oferta de transferência ───────────────────────

  acceptCounterOffer(listingId, bidId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const listing = save.transferMarket.find((l) => l.id === listingId);
    const bid = listing?.bids.find((b) => b.id === bidId && b.status === 'countered');
    if (!listing || !bid || bid.counterAmount == null) return;
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!userTeam || userTeam.budget < bid.counterAmount) return;
    bid.amount = bid.counterAmount;
    bid.status = 'pending';
    const player = save.teams.flatMap((t) => t.squad).find((p) => p.id === listing.playerId);
    executeTransfer(listing, bid, save);
    if (player) recordTransfer(save, player.name, bid.counterAmount, false);
    pushNews(save, {
      type: 'transfer',
      title: 'Contra-oferta aceita',
      body: `${player?.name ?? 'Jogador'} contratado por R$ ${(bid.counterAmount / 1000).toFixed(1)}M.`,
    });
    set({ save });
  },

  // ── Seleção Nacional ─────────────────────────────────────

  acceptNationalTeamOffer() {
    const state = get();
    if (!state.save || !state.save.nationalTeamOffer) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const offer = save.nationalTeamOffer!;
    save.isNationalTeamManager = true;
    save.nationalTeamCountry = offer.country;
    save.nationalTeamOffer = undefined;
    if (!save.nationalTeamSquad) save.nationalTeamSquad = [];
    if (!save.nationalTeamResults) save.nationalTeamResults = [];
    pushNews(save, {
      type: 'achievement',
      title: `Você aceita comandar a ${offer.teamName}!`,
      body: `Parabéns, ${save.managerName}! Você agora é o técnico da ${offer.teamName}. Faça sua convocação na aba Seleção Nacional.`,
    });
    set({ save });
  },

  rejectNationalTeamOffer() {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.nationalTeamOffer = undefined;
    set({ save });
  },

  resignNationalTeam() {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.isNationalTeamManager = false;
    save.nationalTeamCountry = undefined;
    save.nationalTeamSquad = [];
    pushNews(save, {
      type: 'general',
      title: 'Você deixa o comando da seleção',
      body: 'Você pediu demissão da seleção nacional.',
    });
    set({ save });
  },

  updateNationalTeamSquad(playerIds) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.nationalTeamSquad = playerIds.slice(0, 23);
    set({ save });
  },

  // ── Infraestrutura ────────────────────────────────────────

  upgradeInfrastructure(type) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!userTeam) return;

    const COSTS: Record<keyof Infrastructure, [number, number, number]> = {
      training: [500, 1500, 3000],
      medical:  [400, 1200, 2500],
      youth:    [600, 2000, 4000],
    };
    const currentLevel = save.infrastructure[type] as 0 | 1 | 2 | 3;
    if (currentLevel >= 3) return;
    const cost: number = COSTS[type][currentLevel as 0 | 1 | 2];
    if (userTeam.budget < cost) return;
    userTeam.budget -= cost;
    (save.infrastructure[type] as number)++;
    pushNews(save, {
      type: 'finance',
      title: `Infraestrutura melhorada: ${type}`,
      body: `Nível ${save.infrastructure[type]} atingido. Investimento: R$ ${(cost / 1000).toFixed(1)}M.`,
    });
    set({ save });
  },

  // ── Leitura ───────────────────────────────────────────────

  getUserTeam() {
    const save = get().save;
    if (!save) return undefined;
    return save.teams.find((t) => t.id === save.controlledTeamId);
  },

  getCompetition(id) {
    return get().save?.competitions.find((c) => c.id === id);
  },

  getNextUserFixture() {
    const save = get().save;
    if (!save) return undefined;
    let earliest: Fixture | undefined;
    for (const comp of save.competitions) {
      for (const f of comp.fixtures) {
        if (f.played) continue;
        if (f.homeTeamId !== save.controlledTeamId && f.awayTeamId !== save.controlledTeamId) continue;
        if (!earliest || f.scheduledTurn < earliest.scheduledTurn) earliest = f;
      }
    }
    return earliest;
  },

  markNewsRead(newsId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const item = save.news.find((n) => n.id === newsId);
    if (item) item.read = true;
    set({ save });
  },

  // ── Scouting ──────────────────────────────────────────────

  hireScout(scoutId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const available = generateAvailableScouts(save.season * 999);
    const scout = available.find((s) => s.id === scoutId);
    if (!scout) return;
    if (!save.scouts) save.scouts = [];
    if (save.scouts.some((s) => s.id === scoutId)) return;
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!userTeam || userTeam.budget < scout.wageMontly * 3) {
      pushNews(save, { type: 'finance', title: 'Budget insuficiente', body: `Não há budget para contratar ${scout.name}.` });
      set({ save }); return;
    }
    userTeam.budget -= scout.wageMontly * 3;
    save.scouts.push({ ...scout });
    pushNews(save, { type: 'general', title: `Scout contratado: ${scout.name}`, body: `${scout.name} (qualidade ${scout.quality}/4) integra o staff de scouting.` });
    set({ save });
  },

  fireScout(scoutId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.scouts = (save.scouts ?? []).filter((s) => s.id !== scoutId);
    set({ save });
  },

  assignScout(scoutId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const scout = (save.scouts ?? []).find((s) => s.id === scoutId);
    if (!scout || scout.status === 'scouting') return;
    scout.status = 'scouting';
    scout.assignedTurn = save.currentTurn;
    scout.reportDueTurn = save.currentTurn + 14;
    pushNews(save, { type: 'general', title: `Scout em missão: ${scout.name}`, body: `${scout.name} foi enviado para prospecção. Relatório em 14 dias.` });
    set({ save });
  },

  markScoutReportRead(reportId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const report = (save.scoutReports ?? []).find((r) => r.id === reportId);
    if (report) report.read = true;
    set({ save });
  },

  signScoutedPlayer(reportId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const report = (save.scoutReports ?? []).find((r) => r.id === reportId);
    if (!report) return;
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!userTeam) return;
    if (userTeam.squad.length >= 30) {
      pushNews(save, { type: 'general', title: 'Elenco cheio', body: 'Libere um atleta antes de contratar.' });
      set({ save }); return;
    }
    if (userTeam.budget < report.estimatedValue) {
      pushNews(save, { type: 'finance', title: 'Budget insuficiente', body: `Precisaria de R$ ${(report.estimatedValue / 1000).toFixed(1)}M para contratar ${report.name}.` });
      set({ save }); return;
    }
    userTeam.budget -= report.estimatedValue;
    const player = createPlayerFromReport(report, save.season);
    userTeam.squad.push(player);
    save.scoutReports = (save.scoutReports ?? []).filter((r) => r.id !== reportId);
    pushNews(save, { type: 'transfer', title: `Contratado: ${player.name}`, body: `${player.name} (${player.position}, ${player.age} anos, OVR ${player.overall}) assina pelo clube.` });
    set({ save });
  },

  // ── Empréstimos ───────────────────────────────────────────

  acceptLoanOffer(offerId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const offer = (save.loanMarket ?? []).find((o) => o.id === offerId && o.status === 'available');
    if (!offer) return;
    const fromTeam = save.teams.find((t) => t.id === offer.fromTeamId);
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!fromTeam || !userTeam) return;
    if (userTeam.squad.length >= 30) {
      pushNews(save, { type: 'general', title: 'Elenco cheio', body: 'Libere um atleta antes de aceitar empréstimo.' });
      set({ save }); return;
    }
    const playerIdx = fromTeam.squad.findIndex((p) => p.id === offer.playerId);
    if (playerIdx === -1) return;
    const player = fromTeam.squad[playerIdx];
    fromTeam.squad.splice(playerIdx, 1);
    fromTeam.starting11 = fromTeam.starting11.filter((id) => id !== player.id);
    fromTeam.bench = fromTeam.bench.filter((id) => id !== player.id);
    userTeam.squad.push(player);
    offer.status = 'accepted';
    if (!save.activeLoans) save.activeLoans = [];
    save.activeLoans.push({
      id: nanoid(8), playerId: player.id,
      originalTeamId: offer.fromTeamId, loanedToTeamId: save.controlledTeamId,
      loanFeeMonthly: offer.loanFeeMonthly, loanUntil: offer.loanUntil, canRecall: false,
    });
    pushNews(save, { type: 'transfer', title: `Empréstimo: ${player.name}`, body: `${player.name} chega por empréstimo até ${offer.loanUntil}. Taxa: R$ ${offer.loanFeeMonthly}k/mês.` });
    set({ save });
  },

  rejectLoanOffer(offerId) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const offer = (save.loanMarket ?? []).find((o) => o.id === offerId);
    if (offer) offer.status = 'expired';
    set({ save });
  },

  // ── Interações com jogadores ──────────────────────────────

  resolvePlayerInteraction(interactionId, optionIndex) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const interaction = (save.playerInteractions ?? []).find((i) => i.id === interactionId);
    if (!interaction || interaction.resolved) return;
    const option = interaction.options[optionIndex];
    if (!option) return;
    interaction.resolved = true;
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    const player = userTeam?.squad.find((p) => p.id === interaction.playerId);
    if (player) player.morale = Math.max(0, Math.min(100, player.morale + option.moraleEffect));
    if (option.confidenceEffect) {
      save.boardConfidence = Math.max(0, Math.min(100, (save.boardConfidence ?? 60) + option.confidenceEffect));
    }
    set({ save });
  },

  // ── Team Talk ─────────────────────────────────────────────

  applyTeamTalk(moraleBonus) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
    if (!userTeam) return;
    userTeam.squad.forEach((p) => {
      p.morale = Math.max(0, Math.min(100, p.morale + moraleBonus));
    });
    set({ save });
  },

  // ── Avaliações pós-jogo ───────────────────────────────────

  recordMatchRating(fixtureId, ratings) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    if (!save.matchRatings) save.matchRatings = [];
    const existing = save.matchRatings.find((r) => r.fixtureId === fixtureId);
    if (existing) { existing.ratings = ratings; } else { save.matchRatings.push({ fixtureId, ratings }); }
    set({ save });
  },

}));

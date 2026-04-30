import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  SaveGame,
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
} from '@/types';
import { simulateMatch, simulatePenaltyShootout } from '@/engine/matchSimulator';
import {
  createBrasileirao,
  applyResultToStandings,
  sortStandings,
} from '@/competitions/brasileirao';
import { createCopaDoBrasil, createGroupsKnockout, createPaulistao } from '@/competitions/knockoutFormats';
import { buildBrasileiraoTeams } from '@/data/brasileiraoTeams';
import { buildExtraTeams, LIBERTADORES_EXTRA_SEEDS, CHAMPIONS_EXTRA_SEEDS, PAULISTAO_EXTRA_SEEDS, SULAMERICANA_EXTRA_SEEDS, MUNDIAL_EXTRA_SEEDS, COPA_MUNDO_SEEDS } from '@/data/extraTeams';
import { persistSave, loadSave } from '@/db/database';
import { resolveKnockoutsForSave } from '@/engine/knockoutEngine';
import { applyWeeklyTraining } from '@/engine/trainingEngine';
import { autoPickStartingEleven, generateYouthPlayer, generateSquad } from '@/engine/playerGenerator';
import { processWeeklyFinances, processTicketRevenue, recordTransfer } from '@/engine/financeEngine';
import { isSeasonOver, processSeasonEnd, generateBoardObjectives, startNewSeason } from '@/engine/seasonEngine';

// ============================================================
// Utilidades exportadas
// ============================================================

// Janelas de transferências: pré-temporada (turnos 1-28) e meio do ano (133-161)
export function isTransferWindowOpen(currentTurn: number): boolean {
  return (currentTurn >= 1 && currentTurn <= 28) || (currentTurn >= 133 && currentTurn <= 161);
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

  // Leitura
  getUserTeam: () => Team | undefined;
  getCompetition: (id: string) => Competition | undefined;
  getNextUserFixture: () => Fixture | undefined;
  markNewsRead: (newsId: string) => void;
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
): Competition[] {
  const brTeamIds = teams.map((t) => t.id);

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

  // ── Mundial de Clubes (8 times, top de cada confederação) ──
  const top2BrMundial = sortedByRep.slice(0, 2).map((t) => t.id);
  const top2SaMundial = allTeams
    .filter((t) => LIBERTADORES_EXTRA_SEEDS.some((s) => s.id === t.id))
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 2)
    .map((t) => t.id);
  const top2EuMundial = allTeams
    .filter((t) => CHAMPIONS_EXTRA_SEEDS.some((s) => s.id === t.id))
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 2)
    .map((t) => t.id);
  const mundialExtrasIds = allTeams
    .filter((t) => MUNDIAL_EXTRA_SEEDS.some((s) => s.id === t.id))
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 2)
    .map((t) => t.id);
  // Garante 8 times únicos
  const mundialTeamIds = [...new Set([...top2BrMundial, ...top2SaMundial, ...top2EuMundial, ...mundialExtrasIds])];
  // Completa até 8 se necessário com outros BR
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

  // ── Paulistão (apenas se o time do usuário for paulista) ──
  if (SP_TEAM_IDS.has(userTeamId)) {
    const spBrTeams = teams.filter((t) => SP_TEAM_IDS.has(t.id)).map((t) => t.id);
    const spExtraTeams = allTeams
      .filter((t) => PAULISTAO_EXTRA_SEEDS.some((s) => s.id === t.id))
      .map((t) => t.id);
    const paulistaoTeamIds = [...spBrTeams, ...spExtraTeams]; // 4 BR + 4 extras = 8

    if (paulistaoTeamIds.length >= 4) {
      const paulistao = createPaulistao({
        teamIds: paulistaoTeamIds,
        numberOfGroups: 2,
        teamsPerGroup: Math.floor(paulistaoTeamIds.length / 2),
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
    const candidates = aiTeams.filter(() => rng() < 0.12); // ~12% dos times por semana

    candidates.forEach((team) => {
      // Lista um jogador aleatório que não esteja já listado
      const listed = market
        .filter((l) => l.fromTeamId === team.id && l.status === 'open')
        .map((l) => l.playerId);
      const available = team.squad
        .filter((p) => !listed.includes(p.id))
        .sort((a, b) => b.overall - a.overall)
        .slice(3); // nunca lista os 3 melhores
      if (available.length === 0) return;

      const player = available[Math.floor(rng() * available.length)];
      market.push({
        id: nanoid(8),
        playerId: player.id,
        fromTeamId: team.id,
        askingPrice: Math.round(player.marketValue * (0.9 + rng() * 0.4)),
        turn: save.currentTurn,
        status: 'open',
        bids: [],
      });
    });
  }

  // Times de IA fazem ofertas em listagens abertas
  const openListings = market.filter((l) => l.status === 'open' && l.fromTeamId !== save.controlledTeamId);
  openListings.forEach((listing) => {
    if (rng() > 0.08) return; // 8% de chance por turno por listagem
    const biddingTeam = save.teams
      .filter((t) => !t.isUserControlled && t.id !== listing.fromTeamId)
      .find(() => rng() < 0.2);
    if (!biddingTeam) return;
    if (biddingTeam.budget < listing.askingPrice * 0.7) return;

    const amount = Math.round(listing.askingPrice * (0.8 + rng() * 0.3));
    if (listing.bids.some((b) => b.fromTeamId === biddingTeam.id)) return;

    listing.bids.push({
      id: nanoid(8),
      fromTeamId: biddingTeam.id,
      amount,
      turn: save.currentTurn,
      status: 'pending',
    });
  });

  // IA aceita automaticamente ofertas >= preço pedido nas suas listagens
  market
    .filter((l) => l.status === 'open' && l.fromTeamId !== save.controlledTeamId)
    .forEach((listing) => {
      const best = listing.bids
        .filter((b) => b.status === 'pending' && b.amount >= listing.askingPrice)
        .sort((a, b) => b.amount - a.amount)[0];
      if (!best) return;

      executeTransfer(listing, best, save);
    });

  // Remover listagens antigas (> 60 turnos)
  save.transferMarket = market.filter(
    (l) => l.status !== 'open' || save.currentTurn - l.turn <= 60,
  );
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
    const allTeams = [...brTeams, ...extraTeams];
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
      tacticalSetup: { posture: 'balanced', pressing: 'medium', penaltyTakerId: null, cornerTakerId: null },
      financeHistory: [],
      boardObjectives: generateBoardObjectives(resolvedUserTeam),
      seasonRecords: [],
      hallOfFame: [],
      seasonOver: false,
      youthPlayers: [
        generateYouthPlayer(2026 * 300 + 1, 2026),
        generateYouthPlayer(2026 * 300 + 2, 2026),
        generateYouthPlayer(2026 * 300 + 3, 2026),
      ],
      managerWarnings: 0,
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
      if (!loaded.tacticalSetup)    loaded.tacticalSetup  = { posture: 'balanced', pressing: 'medium', penaltyTakerId: null, cornerTakerId: null };
      if (!loaded.financeHistory)   loaded.financeHistory = [];
      if (!loaded.boardObjectives)  {
        const ut = loaded.teams.find((t) => t.id === loaded.controlledTeamId);
        loaded.boardObjectives = ut ? generateBoardObjectives(ut) : [];
      }
      if (!loaded.seasonRecords)    loaded.seasonRecords  = [];
      if (!loaded.hallOfFame)       loaded.hallOfFame     = [];
      if (loaded.seasonOver === undefined) loaded.seasonOver = false;
      if (!loaded.youthPlayers)     loaded.youthPlayers   = [
        generateYouthPlayer(loaded.season * 300 + 1, loaded.season),
        generateYouthPlayer(loaded.season * 300 + 2, loaded.season),
        generateYouthPlayer(loaded.season * 300 + 3, loaded.season),
      ];
      if (loaded.managerWarnings === undefined) loaded.managerWarnings = 0;
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
        comp.standings = sortStandings(comp.standings, save.teams);
      }
    }

    // Bilheteria do jogo em casa
    processTicketRevenue(save, fixtureId);

    // Resolve mata-matas depois da partida do usuário
    resolveKnockoutsForSave(save);

    pushNews(save, {
      type: 'match',
      title: `${home.shortName} ${result.homeGoals} x ${result.awayGoals} ${away.shortName}`,
      body: `Partida válida pelo ${comp.shortName} concluída.`,
    });

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
        comp.standings = sortStandings(comp.standings, save.teams);
      }
    }

    processTicketRevenue(save, fixtureId);
    resolveKnockoutsForSave(save);

    pushNews(save, {
      type: 'match',
      title: `${home.shortName} ${combined.homeGoals} x ${combined.awayGoals} ${away.shortName}`,
      body: `Partida válida pelo ${comp.shortName} concluída.`,
    });

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

    // Recria competições com os mesmos times + extras
    const brTeamIds = new Set(['fla','pal','cor','sao','flu','atm','bot','cru','gre','int','bah','for','ath','vas','rbb','cri','jvt','cui','gpa','ava']);
    const brTeams = save.teams.filter((t) => brTeamIds.has(t.id));
    const comps = generateInitialCompetitions(
      brTeams,
      save.teams,
      save.controlledTeamId,
      save.season,
      prevBrasileiraoStandings,
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

  // ── Treinamento ───────────────────────────────────────────

  setTrainingPlan(plan) {
    const state = get();
    if (!state.save) return;
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;
    save.trainingPlan = plan;
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
}));

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  SaveGame,
  Team,
  Competition,
  NewsItem,
  Fixture,
  MatchResult,
} from '@/types';
import { simulateMatch } from '@/engine/matchSimulator';
import {
  createBrasileirao,
  applyResultToStandings,
  sortStandings,
} from '@/competitions/brasileirao';
import { buildBrasileiraoTeams } from '@/data/brasileiraoTeams';
import { persistSave, loadSave } from '@/db/database';

// ============================================================
// Estado
// ============================================================

interface GameState {
  save: SaveGame | null;

  // Ações de ciclo de vida
  newGame: (managerName: string, teamId: string, saveName: string) => Promise<void>;
  loadGame: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  closeGame: () => void;

  // Ações de gameplay
  advanceTurn: () => Promise<void>;
  playUserMatch: (fixtureId: string) => Promise<MatchResult | null>;
  setUserStarting11: (ids: string[]) => void;

  // Helpers de leitura
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
      // Se for partida do usuário, deixa pra ele jogar via playUserMatch
      const isUserMatch =
        fixture.homeTeamId === save.controlledTeamId ||
        fixture.awayTeamId === save.controlledTeamId;
      if (isUserMatch) return;

      const home = save.teams.find((t) => t.id === fixture.homeTeamId);
      const away = save.teams.find((t) => t.id === fixture.awayTeamId);
      if (!home || !away) return;

      const decidePenalties =
        fixture.stage !== 'regular' && fixture.stage !== 'group' && fixture.legNumber === 2;

      const result = simulateMatch(home, away, { decidePenalties });
      fixture.result = result;
      fixture.played = true;

      if (comp.format === 'round_robin' || comp.format === 'groups_knockout' || comp.format === 'groups_then_knockout_paulista') {
        comp.standings = applyResultToStandings(
          comp.standings,
          fixture.homeTeamId,
          fixture.awayTeamId,
          result,
        );
      }
    });
  }
}

function generateInitialCompetitions(teams: Team[], season: number): Competition[] {
  const comps: Competition[] = [];

  // Brasileirão começa no turno 1, uma rodada a cada 7 dias
  comps.push(
    createBrasileirao({
      teamIds: teams.map((t) => t.id),
      season,
      startTurn: 1,
      turnsBetweenRounds: 7,
      seed: season * 1000 + 1,
    }),
  );

  // Outras competições serão adicionadas em fases futuras (Copa do Brasil,
  // Libertadores, etc) usando os geradores em src/competitions/knockoutFormats.ts
  return comps;
}

// ============================================================
// Store
// ============================================================

export const useGameStore = create<GameState>((set, get) => ({
  save: null,

  async newGame(managerName, teamId, saveName) {
    const teams = buildBrasileiraoTeams();
    const userTeam = teams.find((t) => t.id === teamId);
    if (!userTeam) throw new Error('Time não encontrado');
    userTeam.isUserControlled = true;

    const competitions = generateInitialCompetitions(teams, 2026);

    const save: SaveGame = {
      id: nanoid(10),
      name: saveName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      managerName,
      controlledTeamId: teamId,
      season: 2026,
      currentTurn: 1,
      teams,
      competitions,
      news: [],
      seasonStartTurn: 1,
      seasonEndTurn: 280,
    };

    pushNews(save, {
      type: 'general',
      title: `Bem-vindo ao ${userTeam.name}, ${managerName}`,
      body: `Você assume o comando técnico para a temporada ${save.season}. Boa sorte!`,
    });

    await persistSave(save);
    set({ save });
  },

  async loadGame(saveId) {
    const loaded = await loadSave(saveId);
    if (loaded) set({ save: loaded });
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
    // Cria cópia profunda mínima do save
    const save = JSON.parse(JSON.stringify(state.save)) as SaveGame;

    // Verifica se há partida do usuário não jogada no turno atual
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

    // Simula tudo do turno atual e avança
    simulateAllPendingFixturesForTurn(save, save.currentTurn);
    save.currentTurn++;

    // Recupera fitness e atualiza moral levemente
    save.teams.forEach((team) => {
      team.squad.forEach((p) => {
        p.fitness = Math.min(100, p.fitness + 2);
      });
    });

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
      if (f) {
        targetCompId = comp.id;
        targetFixture = f;
        break;
      }
    }
    if (!targetFixture || !targetCompId) return null;
    if (targetFixture.played) return targetFixture.result ?? null;

    const home = save.teams.find((t) => t.id === targetFixture!.homeTeamId)!;
    const away = save.teams.find((t) => t.id === targetFixture!.awayTeamId)!;
    const result = simulateMatch(home, away, {});
    targetFixture.result = result;
    targetFixture.played = true;

    const comp = save.competitions.find((c) => c.id === targetCompId)!;
    if (comp.format === 'round_robin' || comp.format === 'groups_knockout' || comp.format === 'groups_then_knockout_paulista') {
      comp.standings = applyResultToStandings(
        comp.standings,
        targetFixture.homeTeamId,
        targetFixture.awayTeamId,
        result,
      );
      comp.standings = sortStandings(comp.standings, save.teams);
    }

    pushNews(save, {
      type: 'match',
      title: `${home.shortName} ${result.homeGoals} x ${result.awayGoals} ${away.shortName}`,
      body: `Partida válida pelo ${comp.shortName} concluída.`,
    });

    await persistSave(save);
    set({ save });
    return result;
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
    for (const comp of save.competitions) {
      const f = comp.fixtures.find(
        (x) =>
          !x.played &&
          (x.homeTeamId === save.controlledTeamId || x.awayTeamId === save.controlledTeamId),
      );
      if (f) return f;
    }
    return undefined;
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

import { nanoid } from 'nanoid';
import type {
  Competition,
  Fixture,
  CompetitionStanding,
  Team,
  MatchResult,
} from '@/types';
import { shuffle, createRng } from '@/utils/random';

// ============================================================
// Round robin (todos contra todos) ida e volta. Algoritmo do círculo.
// ============================================================

function generateRoundRobinFixtures(
  teamIds: string[],
  competitionId: string,
  startTurn: number,
  turnsBetweenRounds: number,
): Fixture[] {
  const ids = teamIds.slice();
  if (ids.length % 2 === 1) ids.push('__BYE__');
  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;

  const fixtures: Fixture[] = [];
  let working = ids.slice();

  // Primeiro turno
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = working[i];
      const away = working[n - 1 - i];
      if (home !== '__BYE__' && away !== '__BYE__') {
        fixtures.push({
          id: nanoid(8),
          competitionId,
          round: r + 1,
          stage: 'regular',
          homeTeamId: r % 2 === 0 ? home : away,
          awayTeamId: r % 2 === 0 ? away : home,
          scheduledTurn: startTurn + r * turnsBetweenRounds,
          played: false,
        });
      }
    }
    // Rotaciona mantendo o primeiro fixo
    working = [working[0], working[n - 1], ...working.slice(1, n - 1)];
  }

  // Segundo turno (returno) - inverte mando
  const returnFixtures = fixtures.map((f) => ({
    ...f,
    id: nanoid(8),
    round: f.round + rounds,
    homeTeamId: f.awayTeamId,
    awayTeamId: f.homeTeamId,
    scheduledTurn: f.scheduledTurn + rounds * turnsBetweenRounds,
  }));

  return [...fixtures, ...returnFixtures];
}

// ============================================================
// Cria competição Brasileirão completa
// ============================================================

export interface BrasileiraoConfig {
  teamIds: string[];
  season: number;
  startTurn: number;
  turnsBetweenRounds: number; // dias entre rodadas no calendário do jogo
  seed?: number;
}

export function createBrasileirao(cfg: BrasileiraoConfig): Competition {
  const compId = `brasileirao_${cfg.season}`;
  const rng = createRng(cfg.seed ?? Date.now());
  const shuffled = shuffle(cfg.teamIds, rng);

  const fixtures = generateRoundRobinFixtures(
    shuffled,
    compId,
    cfg.startTurn,
    cfg.turnsBetweenRounds,
  );

  const standings: CompetitionStanding[] = cfg.teamIds.map((id) => ({
    teamId: id,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));

  return {
    id: compId,
    name: 'Campeonato Brasileiro Série A',
    shortName: 'Brasileirão',
    format: 'round_robin',
    season: cfg.season,
    teamIds: cfg.teamIds,
    fixtures,
    standings,
    currentRound: 1,
    totalRounds: (cfg.teamIds.length - 1) * 2,
    finished: false,
  };
}

// ============================================================
// Aplica resultado na tabela
// ============================================================

export function applyResultToStandings(
  standings: CompetitionStanding[],
  homeId: string,
  awayId: string,
  result: MatchResult,
): CompetitionStanding[] {
  const next = standings.map((s) => ({ ...s }));
  const home = next.find((s) => s.teamId === homeId);
  const away = next.find((s) => s.teamId === awayId);
  if (!home || !away) return next;

  home.played++;
  away.played++;
  home.goalsFor += result.homeGoals;
  home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals;
  away.goalsAgainst += result.homeGoals;

  if (result.homeGoals > result.awayGoals) {
    home.wins++;
    home.points += 3;
    away.losses++;
  } else if (result.homeGoals < result.awayGoals) {
    away.wins++;
    away.points += 3;
    home.losses++;
  } else {
    home.draws++;
    away.draws++;
    home.points++;
    away.points++;
  }

  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  return next;
}

// ============================================================
// Ordenação da tabela: pontos, vitórias, saldo, gols pró
// ============================================================

export function sortStandings(
  standings: CompetitionStanding[],
  teams: Team[],
): CompetitionStanding[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const ta = teams.find((t) => t.id === a.teamId)?.name ?? '';
    const tb = teams.find((t) => t.id === b.teamId)?.name ?? '';
    return ta.localeCompare(tb);
  });
}

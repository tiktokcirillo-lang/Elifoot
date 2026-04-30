import { nanoid } from 'nanoid';
import type {
  Competition,
  Fixture,
  CompetitionStanding,
  CompetitionFormat,
  KnockoutPair,
} from '@/types';
import { shuffle, createRng } from '@/utils/random';

// ============================================================
// Helpers
// ============================================================

function emptyStandings(teamIds: string[], group?: string): CompetitionStanding[] {
  return teamIds.map((id) => ({
    teamId: id,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    group,
  }));
}

function pairsForKnockoutRound(
  teamIds: string[],
  stage: KnockoutPair['stage'],
): KnockoutPair[] {
  const pairs: KnockoutPair[] = [];
  for (let i = 0; i < teamIds.length; i += 2) {
    pairs.push({
      id: nanoid(8),
      stage,
      team1Id: teamIds[i],
      team2Id: teamIds[i + 1],
    });
  }
  return pairs;
}

function knockoutFixturesForPairs(
  pairs: KnockoutPair[],
  competitionId: string,
  startTurn: number,
  turnsBetweenLegs: number,
  isTwoLeg: boolean,
  round: number,
): Fixture[] {
  const fixtures: Fixture[] = [];
  pairs.forEach((p, idx) => {
    if (!p.team1Id || !p.team2Id) return;
    const f1: Fixture = {
      id: nanoid(8),
      competitionId,
      round,
      stage: p.stage,
      homeTeamId: p.team1Id,
      awayTeamId: p.team2Id,
      scheduledTurn: startTurn + idx * 0, // mesma rodada
      played: false,
      isTwoLeg,
      legNumber: 1,
      pairId: p.id,
    };
    fixtures.push(f1);
    p.leg1ResultId = f1.id;
    if (isTwoLeg) {
      const f2: Fixture = {
        id: nanoid(8),
        competitionId,
        round: round + 1,
        stage: p.stage,
        homeTeamId: p.team2Id,
        awayTeamId: p.team1Id,
        scheduledTurn: startTurn + turnsBetweenLegs,
        played: false,
        isTwoLeg: true,
        legNumber: 2,
        pairId: p.id,
      };
      fixtures.push(f2);
      p.leg2ResultId = f2.id;
    }
  });
  return fixtures;
}

// ============================================================
// COPA DO BRASIL — mata-mata puro com chave fixa
// ============================================================

export interface KnockoutConfig {
  teamIds: string[];
  season: number;
  startTurn: number;
  turnsBetweenLegs: number;
  seed?: number;
}

export function createCopaDoBrasil(cfg: KnockoutConfig): Competition {
  const compId = `copa_brasil_${cfg.season}`;
  const rng = createRng(cfg.seed ?? Date.now());
  const shuffled = shuffle(cfg.teamIds, rng);

  const totalTeams = shuffled.length;
  const initialStage: KnockoutPair['stage'] =
    totalTeams >= 32 ? 'r32'
    : totalTeams >= 16 ? 'r16'
    : totalTeams >= 8 ? 'qf'
    : totalTeams >= 4 ? 'sf'
    : 'final';

  const initialPairs = pairsForKnockoutRound(shuffled.slice(0, totalTeams), initialStage);
  const fixtures = knockoutFixturesForPairs(
    initialPairs,
    compId,
    cfg.startTurn,
    cfg.turnsBetweenLegs,
    true,
    1,
  );

  return {
    id: compId,
    name: 'Copa do Brasil',
    shortName: 'Copa BR',
    format: 'pure_knockout',
    season: cfg.season,
    teamIds: cfg.teamIds,
    fixtures,
    standings: emptyStandings(cfg.teamIds),
    knockoutBracket: initialPairs,
    currentRound: 1,
    totalRounds: Math.log2(totalTeams) * 2, // ida e volta por fase
    finished: false,
  };
}

// ============================================================
// LIBERTADORES — 8 grupos de 4, depois mata-mata
// ============================================================

export interface GroupsKnockoutConfig {
  teamIds: string[];
  numberOfGroups: number; // 8 para libertadores, 8 para Mundial 2025
  teamsPerGroup: number; // 4
  season: number;
  startTurn: number;
  turnsBetweenRounds: number;
  turnsBetweenLegs: number;
  name: string;
  shortName: string;
  knockoutTwoLeg?: boolean; // libertadores sim, mundial não
  seed?: number;
}

export function createGroupsKnockout(
  cfg: GroupsKnockoutConfig,
  format: CompetitionFormat = 'groups_knockout',
): Competition {
  const compId = `${cfg.shortName.toLowerCase().replace(/\s+/g, '_')}_${cfg.season}`;
  const rng = createRng(cfg.seed ?? Date.now());
  const shuffled = shuffle(cfg.teamIds, rng);

  // Distribui em grupos
  const groups: Record<string, string[]> = {};
  const groupNames = 'ABCDEFGHIJKLMN'.slice(0, cfg.numberOfGroups).split('');
  groupNames.forEach((g, i) => {
    groups[g] = shuffled.slice(i * cfg.teamsPerGroup, (i + 1) * cfg.teamsPerGroup);
  });

  // Gera fixtures de fase de grupos: ida e volta entre todos do grupo
  const fixtures: Fixture[] = [];
  let round = 1;
  for (const groupName of groupNames) {
    const grp = groups[groupName];
    // Ida e volta: 6 jogos por time se 4 times, distribuídos em 6 rodadas
    const matchesIda: [string, string][] = [];
    for (let i = 0; i < grp.length; i++) {
      for (let j = i + 1; j < grp.length; j++) {
        matchesIda.push([grp[i], grp[j]]);
      }
    }
    matchesIda.forEach(([h, a], idx) => {
      fixtures.push({
        id: nanoid(8),
        competitionId: compId,
        round: idx + 1,
        stage: 'group',
        homeTeamId: h,
        awayTeamId: a,
        scheduledTurn: cfg.startTurn + idx * cfg.turnsBetweenRounds,
        played: false,
      });
      fixtures.push({
        id: nanoid(8),
        competitionId: compId,
        round: idx + 1 + matchesIda.length,
        stage: 'group',
        homeTeamId: a,
        awayTeamId: h,
        scheduledTurn:
          cfg.startTurn + (idx + matchesIda.length) * cfg.turnsBetweenRounds,
        played: false,
      });
    });
  }

  const allStandings: CompetitionStanding[] = [];
  groupNames.forEach((g) => {
    allStandings.push(...emptyStandings(groups[g], g));
  });

  return {
    id: compId,
    name: cfg.name,
    shortName: cfg.shortName,
    format,
    season: cfg.season,
    teamIds: cfg.teamIds,
    fixtures,
    standings: allStandings,
    groups,
    currentRound: 1,
    totalRounds: 6 + 8, // 6 rodadas de grupo + ~8 jogos mata-mata aproximado
    finished: false,
    knockoutBracket: [],
  };
}

// ============================================================
// PAULISTÃO — 4 grupos de 4, oitavas, quartas, semis e final
// ============================================================

export function createPaulistao(cfg: GroupsKnockoutConfig): Competition {
  const comp = createGroupsKnockout(
    { ...cfg, name: 'Campeonato Paulista', shortName: 'Paulistão' },
    'groups_then_knockout_paulista',
  );
  return comp;
}

// ============================================================
// CHAMPIONS LEAGUE — formato suíço (8 jogos por time, classificação única)
// 36 times, cada um joga 8 partidas (4 em casa, 4 fora) contra 8 adversários distintos
// Top 8 vai direto às oitavas, 9 ao 24 jogam playoffs.
// ============================================================

export interface SwissConfig {
  teamIds: string[];
  season: number;
  startTurn: number;
  turnsBetweenRounds: number;
  matchesPerTeam: number; // 8 no formato atual
  seed?: number;
}

export function createChampionsLeague(cfg: SwissConfig): Competition {
  const compId = `champions_${cfg.season}`;
  const rng = createRng(cfg.seed ?? Date.now());
  const ids = cfg.teamIds.slice();
  const totalMatches = (ids.length * cfg.matchesPerTeam) / 2;

  const fixtures: Fixture[] = [];
  // Sorteio simplificado: para cada time, escolhe N adversários únicos respeitando mando
  // Estratégia: cria um grafo de partidas garantindo balanceamento aproximado
  const homeCount: Record<string, number> = {};
  const awayCount: Record<string, number> = {};
  const opponents: Record<string, Set<string>> = {};
  ids.forEach((id) => {
    homeCount[id] = 0;
    awayCount[id] = 0;
    opponents[id] = new Set();
  });

  let attempts = 0;
  while (fixtures.length < totalMatches && attempts < 50000) {
    attempts++;
    const a = ids[Math.floor(rng() * ids.length)];
    const b = ids[Math.floor(rng() * ids.length)];
    if (a === b) continue;
    if (opponents[a].has(b)) continue;
    if (opponents[a].size >= cfg.matchesPerTeam) continue;
    if (opponents[b].size >= cfg.matchesPerTeam) continue;

    const aCanHome = homeCount[a] < cfg.matchesPerTeam / 2;
    const bCanHome = homeCount[b] < cfg.matchesPerTeam / 2;
    let home: string, away: string;
    if (aCanHome && !bCanHome) { home = a; away = b; }
    else if (!aCanHome && bCanHome) { home = b; away = a; }
    else if (rng() < 0.5) { home = a; away = b; }
    else { home = b; away = a; }

    if (homeCount[home] >= cfg.matchesPerTeam / 2) continue;
    if (awayCount[away] >= cfg.matchesPerTeam / 2) continue;

    homeCount[home]++;
    awayCount[away]++;
    opponents[a].add(b);
    opponents[b].add(a);

    fixtures.push({
      id: nanoid(8),
      competitionId: compId,
      round: 0, // distribuído depois
      stage: 'regular',
      homeTeamId: home,
      awayTeamId: away,
      scheduledTurn: 0,
      played: false,
    });
  }

  // Distribui em rodadas: a cada rodada cada time joga no máximo 1 vez
  const rounds: Fixture[][] = [];
  fixtures.forEach((f) => {
    let placed = false;
    for (const round of rounds) {
      const teamsInRound = new Set(round.flatMap((x) => [x.homeTeamId, x.awayTeamId]));
      if (!teamsInRound.has(f.homeTeamId) && !teamsInRound.has(f.awayTeamId)) {
        round.push(f);
        placed = true;
        break;
      }
    }
    if (!placed) rounds.push([f]);
  });
  rounds.forEach((round, rIdx) => {
    round.forEach((f) => {
      f.round = rIdx + 1;
      f.scheduledTurn = cfg.startTurn + rIdx * cfg.turnsBetweenRounds;
    });
  });

  return {
    id: compId,
    name: 'UEFA Champions League',
    shortName: 'Champions',
    format: 'swiss_knockout',
    season: cfg.season,
    teamIds: cfg.teamIds,
    fixtures,
    standings: emptyStandings(cfg.teamIds),
    currentRound: 1,
    totalRounds: rounds.length + 5, // rodadas suíças + mata-mata
    finished: false,
    knockoutBracket: [],
  };
}

// ============================================================
// MUNDIAL DE CLUBES (formato 2025 em diante: 32 times, 8 grupos de 4, mata-mata em jogo único)
// ============================================================

export function createMundialClubes(cfg: GroupsKnockoutConfig): Competition {
  return createGroupsKnockout(
    {
      ...cfg,
      name: 'Mundial de Clubes FIFA',
      shortName: 'Mundial',
      knockoutTwoLeg: false,
      numberOfGroups: 8,
      teamsPerGroup: 4,
    },
    'groups_knockout',
  );
}

// ============================================================
// COPA DO MUNDO (32 seleções, 8 grupos de 4, mata-mata em jogo único)
// ============================================================

export function createCopaDoMundo(cfg: GroupsKnockoutConfig): Competition {
  return createGroupsKnockout(
    {
      ...cfg,
      name: 'Copa do Mundo FIFA',
      shortName: 'Copa do Mundo',
      knockoutTwoLeg: false,
      numberOfGroups: 8,
      teamsPerGroup: 4,
    },
    'groups_knockout',
  );
}

// ============================================================
// Avança chaveamento mata-mata baseado em resultados
// Retorna pares para a próxima fase
// ============================================================

export function advanceKnockout(
  pairs: KnockoutPair[],
  nextStage: KnockoutPair['stage'],
): KnockoutPair[] {
  const winners = pairs.map((p) => p.winnerId).filter((x): x is string => Boolean(x));
  return pairsForKnockoutRound(winners, nextStage);
}

// Helpers exportados para reuso
export { pairsForKnockoutRound, knockoutFixturesForPairs };

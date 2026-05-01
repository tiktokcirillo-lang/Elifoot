import { nanoid } from 'nanoid';
import type { Competition, Fixture, KnockoutPair, SaveGame, Team } from '@/types';
import { createRng } from '@/utils/random';
import { sortStandings } from '@/competitions/brasileirao';

// ============================================================
// Progressão de estágios do mata-mata
// ============================================================

const STAGE_ORDER: KnockoutPair['stage'][] = ['r32', 'r16', 'qf', 'sf', 'final'];

function nextStage(stage: KnockoutPair['stage']): KnockoutPair['stage'] | null {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

// ============================================================
// Geração de chaves e fixtures dinamicamente
// ============================================================

function createPairs(teamIds: string[], stage: KnockoutPair['stage']): KnockoutPair[] {
  const pairs: KnockoutPair[] = [];
  for (let i = 0; i + 1 < teamIds.length; i += 2) {
    pairs.push({ id: nanoid(8), stage, team1Id: teamIds[i], team2Id: teamIds[i + 1] });
  }
  return pairs;
}

function createFixturesForPairs(
  pairs: KnockoutPair[],
  compId: string,
  leg1Turn: number,
  leg2Turn: number,
  twoLegs: boolean,
  startRound: number,
): Fixture[] {
  const fixtures: Fixture[] = [];
  pairs.forEach((pair) => {
    if (!pair.team1Id || !pair.team2Id) return;
    const f1: Fixture = {
      id: nanoid(8),
      competitionId: compId,
      round: startRound,
      stage: pair.stage,
      homeTeamId: pair.team1Id,
      awayTeamId: pair.team2Id,
      scheduledTurn: leg1Turn,
      played: false,
      isTwoLeg: twoLegs,
      legNumber: 1,
      pairId: pair.id,
    };
    pair.leg1ResultId = f1.id;
    fixtures.push(f1);

    if (twoLegs) {
      const f2: Fixture = {
        id: nanoid(8),
        competitionId: compId,
        round: startRound + 1,
        stage: pair.stage,
        homeTeamId: pair.team2Id,
        awayTeamId: pair.team1Id,
        scheduledTurn: leg2Turn,
        played: false,
        isTwoLeg: true,
        legNumber: 2,
        pairId: pair.id,
      };
      pair.leg2ResultId = f2.id;
      fixtures.push(f2);
    }
  });
  return fixtures;
}

// ============================================================
// Determina o vencedor de um par
// ============================================================

function simulatePenalties(team1: Team, team2: Team, seed: number): 'team1' | 'team2' {
  const rng = createRng(seed);
  const tech = (t: Team) => {
    const players = t.starting11.length === 11
      ? t.starting11.map((id) => t.squad.find((p) => p.id === id)).filter(Boolean)
      : [...t.squad].sort((a, b) => b.overall - a.overall).slice(0, 11);
    return players.reduce((s, p) => s + (p?.technique ?? 70), 0) / (players.length || 1);
  };
  const r1 = 0.58 + (tech(team1) - 70) / 200;
  const r2 = 0.58 + (tech(team2) - 70) / 200;
  let s1 = 0, s2 = 0;
  for (let i = 0; i < 5; i++) {
    if (rng() < r1) s1++;
    if (rng() < r2) s2++;
  }
  let i = 5;
  while (s1 === s2 && i < 30) {
    if (rng() < r1) s1++;
    if (rng() < r2) s2++;
    i++;
  }
  if (s1 === s2) s1++;
  return s1 > s2 ? 'team1' : 'team2';
}

function resolveWinner(pair: KnockoutPair, comp: Competition, save: SaveGame): string | null {
  if (!pair.team1Id || !pair.team2Id) return null;
  const leg1 = pair.leg1ResultId ? comp.fixtures.find((f) => f.id === pair.leg1ResultId) : undefined;
  const leg2 = pair.leg2ResultId ? comp.fixtures.find((f) => f.id === pair.leg2ResultId) : undefined;
  if (!leg1?.played || !leg1.result) return null;

  const team1 = save.teams.find((t) => t.id === pair.team1Id)!;
  const team2 = save.teams.find((t) => t.id === pair.team2Id)!;

  if (!pair.leg2ResultId) {
    // Jogo único
    const r = leg1.result;
    if (r.homeGoals > r.awayGoals) return pair.team1Id;
    if (r.awayGoals > r.homeGoals) return pair.team2Id;
    // Empate no jogo único → pênaltis
    const seed = pair.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const w = simulatePenalties(team1, team2, seed + save.currentTurn);
    // Armazena resultado nos penalties do resultado do leg1
    if (w === 'team1') {
      leg1.result.homePenalties = 3;
      leg1.result.awayPenalties = 2;
    } else {
      leg1.result.homePenalties = 2;
      leg1.result.awayPenalties = 3;
    }
    return w === 'team1' ? pair.team1Id : pair.team2Id;
  }

  // Dois jogos
  if (!leg2?.played || !leg2.result) return null;
  // team1 é mandante no leg1, visitante no leg2
  const agg1 = leg1.result.homeGoals + leg2.result.awayGoals;
  const agg2 = leg1.result.awayGoals + leg2.result.homeGoals;

  if (agg1 > agg2) return pair.team1Id;
  if (agg2 > agg1) return pair.team2Id;

  // Agregado empatado → pênaltis no leg2
  const seed = pair.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const w = simulatePenalties(team2, team1, seed + save.currentTurn); // leg2: team2 é mandante
  if (w === 'team1') {
    leg2.result.homePenalties = 2; // team2 home
    leg2.result.awayPenalties = 3; // team1 away vence
  } else {
    leg2.result.homePenalties = 3;
    leg2.result.awayPenalties = 2;
  }
  return w === 'team1' ? pair.team2Id : pair.team1Id; // w === 'team1' significa team2 vence (pois é home no leg2)
}

// ============================================================
// Resolve mata-mata puro
// ============================================================

function resolveKnockoutComp(comp: Competition, save: SaveGame): void {
  const pairs = comp.knockoutBracket!;

  // Passo 1: determinar vencedores dos pares concluídos
  for (const pair of pairs) {
    if (pair.winnerId) continue;
    const winner = resolveWinner(pair, comp, save);
    if (winner) pair.winnerId = winner;
  }

  // Passo 2: verificar se todos os pares de algum estágio estão resolvidos → gerar próximo
  const stages = STAGE_ORDER.filter((s) => pairs.some((p) => p.stage === s));
  for (const stage of stages) {
    const stagePairs = pairs.filter((p) => p.stage === stage);
    if (!stagePairs.every((p) => p.winnerId)) continue;

    const next = nextStage(stage);
    if (!next) {
      // Final encerrada
      if (!comp.finished) {
        comp.finished = true;
        comp.championId = stagePairs[0]?.winnerId;
      }
      continue;
    }

    // Próximo estágio já foi gerado?
    if (pairs.some((p) => p.stage === next)) continue;

    // Gera próxima fase
    const winners = stagePairs.map((p) => p.winnerId!);
    const newPairs = createPairs(winners, next);
    const startRound = Math.max(...comp.fixtures.map((f) => f.round)) + 1;
    const leg1Turn = save.currentTurn + 7;
    const leg2Turn = save.currentTurn + 14;
    // Respeita singleLegKnockout em todas as fases (Copa do Mundo = jogo único, Paulistão/Libertadores = ida e volta)
    const twoLegNext = comp.singleLegKnockout !== true;
    const newFixtures = createFixturesForPairs(newPairs, comp.id, leg1Turn, leg2Turn, twoLegNext, startRound);
    comp.fixtures.push(...newFixtures);
    pairs.push(...newPairs);
    break;
  }
}

// ============================================================
// Resolve grupos + mata-mata
// ============================================================

function resolveGroupKnockoutComp(comp: Competition, save: SaveGame): void {
  const groupFixtures = comp.fixtures.filter((f) => f.stage === 'group');
  const groupsComplete = groupFixtures.length > 0 && groupFixtures.every((f) => f.played);

  if (!comp.knockoutBracket) comp.knockoutBracket = [];

  if (groupsComplete && comp.knockoutBracket.length === 0) {
    // Fase de grupos encerrada — gerar oitavas ou quartas de final
    if (!comp.groups) return;
    const groupNames = Object.keys(comp.groups).sort();
    const qualifiers: string[] = [];

    for (const g of groupNames) {
      const gs = sortStandings(
        comp.standings.filter((s) => s.group === g),
        save.teams,
      );
      if (gs.length >= 2) {
        qualifiers.push(gs[0].teamId); // 1º do grupo
        qualifiers.push(gs[1].teamId); // 2º do grupo
      }
    }

    // 2 qualifiers → final direto | 4 → semi | 8 → quartas | >8 → oitavas
    const knockoutStage: KnockoutPair['stage'] =
      qualifiers.length <= 2 ? 'final' :
      qualifiers.length <= 4 ? 'sf' :
      qualifiers.length <= 8 ? 'qf' :
      'r16';
    // Cruza grupos: 1ºA vs 2ºB, 1ºB vs 2ºA …
    const crossed: string[] = [];
    const half = groupNames.length;
    for (let i = 0; i < half; i++) {
      crossed.push(qualifiers[i * 2]);       // 1º do grupo i
      crossed.push(qualifiers[(((i + 1) % half) * 2) + 1]); // 2º do grupo seguinte
    }

    const newPairs = createPairs(crossed, knockoutStage);
    const startRound = Math.max(...comp.fixtures.map((f) => f.round)) + 1;
    const leg1Turn = save.currentTurn + 7;
    const leg2Turn = save.currentTurn + 14;
    const twoLeg = comp.singleLegKnockout !== true;
    const newFixtures = createFixturesForPairs(newPairs, comp.id, leg1Turn, leg2Turn, twoLeg, startRound);
    comp.fixtures.push(...newFixtures);
    comp.knockoutBracket.push(...newPairs);
  }

  // Avançar knockout gerado
  if (comp.knockoutBracket.length > 0) {
    resolveKnockoutComp(comp, save);
  }
}

// ============================================================
// Ponto de entrada — chamado a cada advanceTurn
// ============================================================

export function resolveKnockoutsForSave(save: SaveGame): void {
  for (const comp of save.competitions) {
    if (comp.finished) continue;
    if (comp.format === 'pure_knockout') {
      if (comp.knockoutBracket) resolveKnockoutComp(comp, save);
    } else if (
      comp.format === 'groups_knockout' ||
      comp.format === 'groups_then_knockout_paulista'
    ) {
      resolveGroupKnockoutComp(comp, save);
    }
    // swiss_knockout e round_robin não precisam de avanço de chaveamento aqui
  }
}

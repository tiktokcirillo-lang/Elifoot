import type { Team, Player, MatchResult, MatchEvent } from '@/types';
import { createRng, pickWeighted, clamp } from '@/utils/random';

// ============================================================
// Calcula força ofensiva, defensiva e de meio campo de um time
// considerando apenas os 11 titulares.
// ============================================================

interface TeamStrength {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeping: number;
  formationModifier: number;
}

function getStartingPlayers(team: Team): Player[] {
  if (team.starting11.length === 11) {
    return team.starting11
      .map((id) => team.squad.find((p) => p.id === id))
      .filter((p): p is Player => Boolean(p));
  }
  // fallback: pega os 11 melhores
  return team.squad
    .filter((p) => !p.injuredUntil || p.injuredUntil < 0)
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 11);
}

function calculateStrength(team: Team): TeamStrength {
  const players = getStartingPlayers(team);
  if (players.length === 0) {
    return { attack: 50, midfield: 50, defense: 50, goalkeeping: 50, formationModifier: 1 };
  }

  const gk = players.find((p) => p.position === 'GK');
  const defs = players.filter((p) => p.position === 'DF');
  const mids = players.filter((p) => p.position === 'MF');
  const fwds = players.filter((p) => p.position === 'FW');

  const avg = (arr: Player[], key: keyof Player) =>
    arr.length === 0
      ? 50
      : arr.reduce((s, p) => s + (p[key] as number), 0) / arr.length;

  const attack = avg(fwds, 'attack') * 0.6 + avg(mids, 'attack') * 0.3 + avg(fwds, 'technique') * 0.1;
  const midfield = avg(mids, 'technique') * 0.5 + avg(mids, 'pace') * 0.25 + avg(mids, 'stamina') * 0.25;
  const defense = avg(defs, 'defense') * 0.7 + avg(mids, 'defense') * 0.2 + avg(defs, 'pace') * 0.1;
  const goalkeeping = gk ? gk.defense * 0.7 + gk.technique * 0.3 : 50;

  // Modificadores de formação simplificados
  const formationModifier =
    team.formation === '4-3-3' ? 1.04
    : team.formation === '4-2-3-1' ? 1.02
    : team.formation === '3-5-2' ? 1.0
    : team.formation === '4-4-2' ? 1.0
    : team.formation === '5-3-2' ? 0.96
    : team.formation === '4-5-1' ? 0.97
    : 1.0;

  // Aplica fitness e moral médios
  const morale = avg(players, 'morale') / 100;
  const fitness = avg(players, 'fitness') / 100;
  const condition = 0.7 + 0.15 * morale + 0.15 * fitness; // 0.7 a 1.0

  return {
    attack: attack * condition * formationModifier,
    midfield: midfield * condition * formationModifier,
    defense: defense * condition,
    goalkeeping: goalkeeping * (0.85 + 0.15 * fitness),
    formationModifier,
  };
}

// ============================================================
// Pick de marcador / assistente baseado em peso de posição
// ============================================================

function pickScorer(team: Team, rng: () => number): Player | undefined {
  const players = getStartingPlayers(team);
  const weighted = players
    .filter((p) => p.position !== 'GK')
    .map((p) => {
      const positionWeight =
        p.position === 'FW' ? 5 : p.position === 'MF' ? 2 : 0.6;
      return { item: p, weight: positionWeight * (p.attack + p.technique) };
    });
  if (weighted.length === 0) return undefined;
  return pickWeighted(rng, weighted);
}

function pickFouler(team: Team, rng: () => number): Player | undefined {
  const players = getStartingPlayers(team);
  if (players.length === 0) return undefined;
  const weighted = players.map((p) => ({
    item: p,
    weight: p.position === 'DF' ? 3 : p.position === 'MF' ? 2.5 : 1,
  }));
  return pickWeighted(rng, weighted);
}

// ============================================================
// Simulação principal minuto a minuto
// ============================================================

export interface SimulateOptions {
  isNeutralVenue?: boolean;
  seed?: number;
  decidePenalties?: boolean;
  // Postura tática do time da casa e visitante
  homePosture?: 'attack' | 'balanced' | 'defensive';
  awayPosture?: 'attack' | 'balanced' | 'defensive';
  // Pressing do time da casa e visitante
  homePressing?: 'high' | 'medium' | 'low';
  awayPressing?: 'high' | 'medium' | 'low';
  // Intervalo de minutos simulados (para simulação em dois tempos)
  minuteStart?: number; // padrão: 1
  minuteEnd?: number;   // padrão: 90
}

export function simulateMatch(
  home: Team,
  away: Team,
  options: SimulateOptions = {},
): MatchResult {
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = createRng(seed);

  const homeStrength = calculateStrength(home);
  const awayStrength = calculateStrength(away);

  // Modificadores de postura tática
  const postureModifier = (posture: SimulateOptions['homePosture']): { atk: number; def: number } => {
    if (posture === 'attack')    return { atk: 1.20, def: 0.85 };
    if (posture === 'defensive') return { atk: 0.80, def: 1.20 };
    return { atk: 1.0, def: 1.0 }; // balanced
  };

  const pressingModifier = (pressing: SimulateOptions['homePressing']): number => {
    if (pressing === 'high') return 1.12;
    if (pressing === 'low')  return 0.90;
    return 1.0;
  };

  const homeMod  = postureModifier(options.homePosture);
  const awayMod  = postureModifier(options.awayPosture);
  const homePress = pressingModifier(options.homePressing);
  const awayPress = pressingModifier(options.awayPressing);

  homeStrength.attack   *= homeMod.atk  * homePress;
  homeStrength.defense  *= homeMod.def;
  awayStrength.attack   *= awayMod.atk  * awayPress;
  awayStrength.defense  *= awayMod.def;

  // Vantagem de mando
  const homeAdvantage = options.isNeutralVenue ? 1.0 : 1.08;

  const events: MatchEvent[] = [];
  let homeGoals = 0;
  let awayGoals = 0;
  let homeShots = 0;
  let awayShots = 0;
  let homeShotsOnTarget = 0;
  let awayShotsOnTarget = 0;

  // Posse calculada por dominância de meio
  const totalMid = homeStrength.midfield * homeAdvantage + awayStrength.midfield;
  const homePossession = clamp(
    Math.round((homeStrength.midfield * homeAdvantage / totalMid) * 100),
    35,
    65,
  );

  // Probabilidade base de evento perigoso por minuto: ajustada pelas forças totais
  const totalAttack = homeStrength.attack + awayStrength.attack;
  const eventChancePerMinute = clamp(0.06 + totalAttack / 4000, 0.05, 0.14);

  for (let minute = (options.minuteStart ?? 1); minute <= (options.minuteEnd ?? 90); minute++) {
    if (rng() > eventChancePerMinute) continue;

    // Quem ataca? Pondera força ofensiva contra defensiva oposta
    const homeAtk = homeStrength.attack * homeAdvantage;
    const awayAtk = awayStrength.attack;
    const homeAttackWeight = homeAtk / (homeAtk + awayAtk);
    const isHomeAttack = rng() < homeAttackWeight;

    const attacker = isHomeAttack ? home : away;
    const defender = isHomeAttack ? away : home;
    const attackerStrength = isHomeAttack ? homeStrength : awayStrength;
    const defenderStrength = isHomeAttack ? awayStrength : homeStrength;

    // Tipo de evento: tiro perigoso, falta, escanteio
    const eventType = pickWeighted(rng, [
      { item: 'shot', weight: 6 },
      { item: 'foul', weight: 3 },
      { item: 'corner', weight: 2 },
    ]);

    if (eventType === 'foul') {
      const fouler = pickFouler(defender, rng);
      if (fouler && rng() < 0.18) {
        const isYellow = rng() < 0.85;
        events.push({
          minute,
          type: isYellow ? 'yellow_card' : 'red_card',
          side: isHomeAttack ? 'away' : 'home',
          playerId: fouler.id,
          playerName: fouler.name,
          description: `${fouler.name} recebe cartão ${isYellow ? 'amarelo' : 'vermelho'}.`,
        });
      }
      continue;
    }

    if (eventType === 'corner') {
      events.push({
        minute,
        type: 'corner',
        side: isHomeAttack ? 'home' : 'away',
        description: `Escanteio para ${attacker.name}.`,
      });
      // Pequena chance de escanteio virar gol
      if (rng() < 0.04) {
        const scorer = pickScorer(attacker, rng);
        if (scorer) {
          if (isHomeAttack) homeGoals++; else awayGoals++;
          if (isHomeAttack) homeShots++; else awayShots++;
          if (isHomeAttack) homeShotsOnTarget++; else awayShotsOnTarget++;
          events.push({
            minute,
            type: 'goal',
            side: isHomeAttack ? 'home' : 'away',
            playerId: scorer.id,
            playerName: scorer.name,
            description: `GOL DO ${attacker.shortName}! ${scorer.name} cabeceia para o fundo das redes.`,
          });
        }
      }
      continue;
    }

    // Tiro perigoso: calcula prob de gol
    if (isHomeAttack) homeShots++; else awayShots++;

    const goalProb = clamp(
      attackerStrength.attack /
        (attackerStrength.attack + defenderStrength.defense * 1.4 + defenderStrength.goalkeeping * 0.6),
      0.06,
      0.45,
    );

    const isOnTarget = rng() < 0.55;
    if (isOnTarget) {
      if (isHomeAttack) homeShotsOnTarget++; else awayShotsOnTarget++;
    }

    if (isOnTarget && rng() < goalProb) {
      const scorer = pickScorer(attacker, rng);
      if (scorer) {
        if (isHomeAttack) homeGoals++; else awayGoals++;
        events.push({
          minute,
          type: 'goal',
          side: isHomeAttack ? 'home' : 'away',
          playerId: scorer.id,
          playerName: scorer.name,
          description: `GOOOL! ${scorer.name} marca para o ${attacker.shortName}.`,
        });
      }
    } else if (isOnTarget) {
      events.push({
        minute,
        type: 'shot_on_target',
        side: isHomeAttack ? 'home' : 'away',
        description: `Defesaça do goleiro do ${defender.shortName}.`,
      });
    } else {
      events.push({
        minute,
        type: 'shot_off_target',
        side: isHomeAttack ? 'home' : 'away',
        description: `Finalização para fora.`,
      });
    }
  }

  const result: MatchResult = {
    homeGoals,
    awayGoals,
    homeShots,
    awayShots,
    homeShotsOnTarget,
    awayShotsOnTarget,
    homePossession,
    events,
  };

  // Decisão por pênaltis caso necessário
  if (options.decidePenalties && homeGoals === awayGoals) {
    const { homePens, awayPens } = simulatePenaltyShootout(home, away, rng);
    result.homePenalties = homePens;
    result.awayPenalties = awayPens;
    events.push({
      minute: 120,
      type: homePens > awayPens ? 'penalty_scored' : 'penalty_scored',
      side: homePens > awayPens ? 'home' : 'away',
      description: `Disputa de pênaltis: ${home.shortName} ${homePens} x ${awayPens} ${away.shortName}.`,
    });
  }

  return result;
}

export function simulatePenaltyShootout(
  home: Team,
  away: Team,
  rng: () => number,
): { homePens: number; awayPens: number } {
  let homePens = 0;
  let awayPens = 0;
  // 5 cobranças cada lado, depois alternada se empate
  const homePlayers = getStartingPlayers(home).filter((p) => p.position !== 'GK');
  const awayPlayers = getStartingPlayers(away).filter((p) => p.position !== 'GK');

  const rate = (player: Player | undefined) =>
    player ? clamp(0.55 + (player.technique - 50) / 200, 0.55, 0.92) : 0.7;

  for (let i = 0; i < 5; i++) {
    if (rng() < rate(homePlayers[i])) homePens++;
    if (rng() < rate(awayPlayers[i])) awayPens++;
  }
  let i = 5;
  while (homePens === awayPens) {
    const hp = homePlayers[i % homePlayers.length];
    const ap = awayPlayers[i % awayPlayers.length];
    if (rng() < rate(hp)) homePens++;
    if (rng() < rate(ap)) awayPens++;
    i++;
    if (i > 30) break; // segurança
  }
  return { homePens, awayPens };
}

import type { Player, Team, TrainingPlan } from '@/types';
import { clamp, createRng } from '@/utils/random';

/** Aplica lesão a um jogador: seta injuredUntil, atualiza histórico e proneness. */
export function applyInjury(player: Player, durationTurns: number, currentTurn: number, season: number): void {
  player.injuredUntil = currentTurn + durationTurns;
  const weeksOut = Math.round(durationTurns / 7);
  if (!player.injuryHistory) player.injuryHistory = [];
  player.injuryHistory.push({ season, weeksOut });
  // Proneness cresce com lesões longas: +5 por semana fora (cap 80)
  const proneDelta = Math.min(weeksOut * 5, 25);
  player.injuryProneness = Math.min(80, (player.injuryProneness ?? 0) + proneDelta);
}

// ============================================================
// Aplica efeito de treinamento semanal ao elenco
// ============================================================

interface TrainingEffect {
  attack: number;
  defense: number;
  pace: number;
  technique: number;
  stamina: number;
  fitnessChange: number;
  injuryRisk: number; // 0 a 1
}

const EFFECTS: Record<TrainingPlan['type'], TrainingEffect> = {
  attack:    { attack: 2,  defense: 0,  pace: 0,  technique: 1,  stamina: 0,  fitnessChange: -4,  injuryRisk: 0.01 },
  defense:   { attack: 0,  defense: 2,  pace: 0,  technique: 0,  stamina: 1,  fitnessChange: -4,  injuryRisk: 0.01 },
  fitness:   { attack: 0,  defense: 0,  pace: 1,  technique: 0,  stamina: 2,  fitnessChange: +8,  injuryRisk: 0.02 },
  technique: { attack: 1,  defense: 0,  pace: 0,  technique: 2,  stamina: 0,  fitnessChange: -3,  injuryRisk: 0.005 },
  tactics:   { attack: 1,  defense: 1,  pace: 0,  technique: 1,  stamina: 1,  fitnessChange: -2,  injuryRisk: 0.005 },
  rest:      { attack: 0,  defense: 0,  pace: 0,  technique: 0,  stamina: 0,  fitnessChange: +15, injuryRisk: 0 },
};

const INTENSITY_MULT: Record<TrainingPlan['intensity'], number> = {
  light:  0.5,
  normal: 1.0,
  heavy:  1.8,
};

const INTENSITY_FITNESS_MOD: Record<TrainingPlan['intensity'], number> = {
  light:  0.5,
  normal: 1.0,
  heavy:  1.5,
};

const INTENSITY_INJURY_MOD: Record<TrainingPlan['intensity'], number> = {
  light:  0.5,
  normal: 1.0,
  heavy:  3.0,
};

// Multiplicador de crescimento por idade
function growthMultiplier(age: number): number {
  if (age < 19) return 1.8;
  if (age < 22) return 1.4;
  if (age < 26) return 1.0;
  if (age < 29) return 0.5;
  if (age < 32) return 0.2;
  return 0.0; // sem crescimento após 32
}

function applyGain(current: number, base: number, mult: number, rng: () => number, ceiling = 99): number {
  if (base === 0) return current;
  const raw = base * mult + (rng() * 0.5 - 0.25); // pequena variância
  return clamp(Math.round(current + raw), 1, Math.min(99, ceiling));
}

function recalcOverall(p: Player): number {
  const weights =
    p.position === 'GK'
      ? { attack: 0.05, defense: 0.40, pace: 0.10, technique: 0.30, stamina: 0.15 }
      : p.position === 'DF'
      ? { attack: 0.10, defense: 0.40, pace: 0.15, technique: 0.15, stamina: 0.20 }
      : p.position === 'MF'
      ? { attack: 0.20, defense: 0.20, pace: 0.15, technique: 0.30, stamina: 0.15 }
      : { attack: 0.40, defense: 0.10, pace: 0.20, technique: 0.20, stamina: 0.10 };

  return clamp(
    Math.round(
      p.attack * weights.attack +
        p.defense * weights.defense +
        p.pace * weights.pace +
        p.technique * weights.technique +
        p.stamina * weights.stamina,
    ),
    1,
    99,
  );
}

// Pesos de atributos por posição (iguais ao recalcOverall)
const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  GK: { attack: 0.05, defense: 0.40, pace: 0.10, technique: 0.30, stamina: 0.15 },
  DF: { attack: 0.10, defense: 0.40, pace: 0.15, technique: 0.15, stamina: 0.20 },
  MF: { attack: 0.20, defense: 0.20, pace: 0.15, technique: 0.30, stamina: 0.15 },
  FW: { attack: 0.40, defense: 0.10, pace: 0.20, technique: 0.20, stamina: 0.10 },
};

/** Retorna a estimativa de ganho semanal de OVR para o jogador com o plano atual. */
export function calcWeeklyGrowth(player: Player, plan: TrainingPlan): number {
  const effect = EFFECTS[plan.type];
  const statMult = INTENSITY_MULT[plan.intensity];
  const growth = growthMultiplier(player.age);
  if (growth === 0) return 0;

  const w = POSITION_WEIGHTS[player.position] ?? POSITION_WEIGHTS['MF'];
  const rawGain =
    effect.attack    * w.attack +
    effect.defense   * w.defense +
    effect.pace      * w.pace +
    effect.technique * w.technique +
    effect.stamina   * w.stamina;

  return Math.round(rawGain * statMult * growth * 10) / 10;
}

export function applyWeeklyTraining(
  team: Team,
  plan: TrainingPlan,
  currentTurn: number,
  season = 1,
  unlockedSkills: string[] = [],
): { injuredPlayerIds: string[] } {
  const effect = EFFECTS[plan.type];
  const statMult = INTENSITY_MULT[plan.intensity];
  const fitMod = INTENSITY_FITNESS_MOD[plan.intensity];
  const injMod = INTENSITY_INJURY_MOD[plan.intensity];
  const injuredIds: string[] = [];
  const hasTalentCoach = unlockedSkills.includes('talent_coach');

  team.squad.forEach((player, idx) => {
    const rng = createRng(currentTurn * 1000 + player.id.charCodeAt(0) + idx);
    const baseGrowth = growthMultiplier(player.age);
    // talent_coach: +40% crescimento para jogadores ≤ 23 anos
    const talentBonus = hasTalentCoach && player.age <= 23 ? 1.4 : 1.0;
    const growth = baseGrowth * talentBonus;

    // Aplicar ganhos de atributo (somente se houver crescimento)
    if (growth > 0) {
      const pot = player.potential ?? 99;
      player.attack    = applyGain(player.attack,    effect.attack,    statMult * growth, rng, pot);
      player.defense   = applyGain(player.defense,   effect.defense,   statMult * growth, rng, pot);
      player.pace      = applyGain(player.pace,      effect.pace,      statMult * growth, rng, pot);
      player.technique = applyGain(player.technique, effect.technique, statMult * growth, rng, pot);
      player.stamina   = applyGain(player.stamina,   effect.stamina,   statMult * growth, rng, pot);
      player.overall   = recalcOverall(player);
    }

    // Atualizar fitness
    const fitChange = effect.fitnessChange * fitMod;
    player.fitness = clamp(Math.round(player.fitness + fitChange), 10, 100);

    // Risco de lesão: base do treino + bônus de histórico (proneness) + overplay
    const pronessBonus = (player.injuryProneness ?? 0) / 100 * 0.02; // até +2% por proneness
    const overplayBonus = player.fitness < 50 ? 0.015 : 0; // cansaço extremo = risco adicional
    const injRisk = (effect.injuryRisk + pronessBonus + overplayBonus) * injMod;
    if (injRisk > 0 && rng() < injRisk && !player.injuredUntil) {
      const duration = Math.ceil(rng() * 21) + 7; // 7-28 dias
      applyInjury(player, duration, currentTurn, season);
      injuredIds.push(player.id);
    }
  });

  return { injuredPlayerIds: injuredIds };
}

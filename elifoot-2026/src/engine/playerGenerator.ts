import { nanoid } from 'nanoid';
import type { Player, Position, TeamTier } from '@/types';
import { clamp, createRng } from '@/utils/random';

const FIRST_NAMES = [
  'João', 'Pedro', 'Lucas', 'Bruno', 'Gabriel', 'Felipe', 'Rafael', 'Matheus',
  'Gustavo', 'Vinícius', 'Rodrigo', 'Carlos', 'Daniel', 'Leandro', 'André',
  'Fernando', 'Diego', 'Eduardo', 'Marcos', 'Caio', 'Igor', 'Marcelo',
  'Renato', 'Tiago', 'Alex', 'Henrique', 'Fábio', 'Júlio', 'Roberto', 'Luiz',
  'Davi', 'Murilo', 'Yuri', 'Erick', 'Wesley', 'Patrick', 'Vitor', 'Arthur',
  'Samuel', 'Hugo', 'Otávio', 'Leonardo', 'Cauã', 'Heitor', 'Enzo',
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira',
  'Almeida', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Dias',
  'Barbosa', 'Cardoso', 'Mendes', 'Cruz', 'Castro', 'Moreira', 'Pinto',
  'Cavalcante', 'Andrade', 'Araújo', 'Vieira', 'Monteiro', 'Nascimento',
  'Borges', 'Cunha', 'Medeiros', 'Reis', 'Teixeira', 'Machado', 'Lopes',
  'Moura', 'Freitas', 'Macedo', 'Marques', 'Nunes',
];

const SUFFIXES = ['', '', '', '', 'Júnior', 'Filho', 'Neto'];

function generateName(rng: () => number): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  const suf = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
  return suf ? `${first} ${last} ${suf}` : `${first} ${last}`;
}

// ============================================================
// Gera um jogador para um time considerando tier e posição
// ============================================================

const TIER_BASE: Record<TeamTier, number> = {
  elite: 78,
  top: 72,
  mid: 66,
  low: 60,
};

interface GeneratePlayerInput {
  position: Position;
  tier: TeamTier;
  isStarter: boolean;
  rng: () => number;
}

export function generatePlayer({
  position,
  tier,
  isStarter,
  rng,
}: GeneratePlayerInput): Player {
  const base = TIER_BASE[tier];
  const variance = isStarter ? rng() * 8 - 2 : rng() * 12 - 8; // titular tende a ser melhor
  const overall = clamp(Math.round(base + variance), 45, 95);

  // Atributos por posição (média gravitando em torno de overall)
  const dist = (mod: number) =>
    clamp(Math.round(overall + mod + (rng() * 8 - 4)), 35, 99);

  let attack: number, defense: number, pace: number, technique: number, stamina: number;
  switch (position) {
    case 'GK':
      attack = dist(-30);
      defense = dist(+5); // representa habilidade do goleiro
      pace = dist(-15);
      technique = dist(0);
      stamina = dist(-5);
      break;
    case 'DF':
      attack = dist(-15);
      defense = dist(+8);
      pace = dist(0);
      technique = dist(-3);
      stamina = dist(+3);
      break;
    case 'MF':
      attack = dist(0);
      defense = dist(0);
      pace = dist(0);
      technique = dist(+5);
      stamina = dist(+5);
      break;
    case 'FW':
      attack = dist(+8);
      defense = dist(-15);
      pace = dist(+5);
      technique = dist(+3);
      stamina = dist(0);
      break;
  }

  const age = Math.floor(17 + rng() * 18); // 17 a 34
  const wage = Math.round(((overall - 50) ** 2) * 0.4 + 5);
  const marketValue = Math.round(wage * 36 * (overall / 70));

  // Potencial oculto: jovens têm mais margem de crescimento
  const potGap = age < 20 ? 20 + Math.floor(rng() * 15)
               : age < 24 ? 12 + Math.floor(rng() * 10)
               : age < 28 ? 5  + Math.floor(rng() * 8)
               : age < 32 ? 2  + Math.floor(rng() * 5)
               :             0  + Math.floor(rng() * 3);
  const potential = clamp(overall + potGap, overall, 95);

  return {
    id: nanoid(8),
    name: generateName(rng),
    age,
    nationality: 'BR',
    position,
    foot: rng() < 0.75 ? 'R' : rng() < 0.9 ? 'L' : 'B',
    attack,
    defense,
    pace,
    technique,
    stamina,
    overall,
    potential,
    morale: 70 + Math.floor(rng() * 20),
    fitness: 90 + Math.floor(rng() * 10),
    yellowCardsInComp: {},
    appearancesInComp: {},
    contractUntil: 2026 + Math.floor(rng() * 4),
    wageMonthly: wage,
    marketValue,
    stats: {
      appearances: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0,
    },
  };
}

// ============================================================
// Gera um jovem da base (16-18 anos, overall baixo, alto potencial)
// ============================================================

export function generateYouthPlayer(seed: number, baseSeason = 2026): Player {
  const rng = createRng(seed);
  const positions: Position[] = ['GK', 'DF', 'MF', 'FW'];
  const position = positions[Math.floor(rng() * 4)];
  const age = 16 + Math.floor(rng() * 3); // 16, 17 ou 18 anos

  const base = 42 + Math.floor(rng() * 16); // overall bruto 42-58
  const dist = (mod: number) =>
    clamp(Math.round(base + mod + (rng() * 10 - 5)), 25, 78);

  let attack: number, defense: number, pace: number, technique: number, stamina: number;
  switch (position) {
    case 'GK':
      attack = dist(-25); defense = dist(+5); pace = dist(-10); technique = dist(0); stamina = dist(-5);
      break;
    case 'DF':
      attack = dist(-12); defense = dist(+8); pace = dist(0); technique = dist(-3); stamina = dist(+3);
      break;
    case 'MF':
      attack = dist(0); defense = dist(0); pace = dist(0); technique = dist(+5); stamina = dist(+5);
      break;
    default: // FW
      attack = dist(+8); defense = dist(-15); pace = dist(+5); technique = dist(+3); stamina = dist(0);
  }

  const overall = clamp(base, 40, 65);
  const potential = clamp(base + 15 + Math.floor(rng() * 20), overall + 10, 90);
  const wage = 2 + Math.floor(rng() * 3);
  const marketValue = Math.round(wage * 24);

  return {
    id: nanoid(8),
    name: generateName(rng),
    age,
    nationality: 'BR',
    position,
    foot: rng() < 0.75 ? 'R' : rng() < 0.9 ? 'L' : 'B',
    attack,
    defense,
    pace,
    technique,
    stamina,
    overall,
    potential,
    morale: 80 + Math.floor(rng() * 15),
    fitness: 90 + Math.floor(rng() * 10),
    yellowCardsInComp: {},
    appearancesInComp: {},
    contractUntil: baseSeason + 1 + Math.ceil(rng() * 2),
    wageMonthly: wage,
    marketValue,
    stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 },
  };
}

// ============================================================
// Gera elenco completo: 25 jogadores típicos
// ============================================================

export interface SquadComposition {
  GK: number;
  DF: number;
  MF: number;
  FW: number;
}

export const DEFAULT_SQUAD: SquadComposition = { GK: 3, DF: 8, MF: 8, FW: 6 };

export function generateSquad(tier: TeamTier, seed: number): Player[] {
  const rng = createRng(seed);
  const players: Player[] = [];

  const make = (position: Position, count: number) => {
    for (let i = 0; i < count; i++) {
      // Os primeiros de cada posição são titulares
      const isStarter = i < (position === 'GK' ? 1 : position === 'DF' ? 4 : position === 'MF' ? 4 : 2);
      players.push(generatePlayer({ position, tier, isStarter, rng }));
    }
  };

  make('GK', DEFAULT_SQUAD.GK);
  make('DF', DEFAULT_SQUAD.DF);
  make('MF', DEFAULT_SQUAD.MF);
  make('FW', DEFAULT_SQUAD.FW);

  return players;
}

// ============================================================
// Define titulares e reservas de um elenco baseado na formação
// ============================================================

export function autoPickStartingEleven(
  squad: Player[],
  formation: '4-4-2' | '4-3-3' | '4-2-3-1' | '3-5-2' | '5-3-2' | '4-5-1' = '4-3-3',
): { starting: string[]; bench: string[] } {
  const positions: Record<string, { GK: number; DF: number; MF: number; FW: number }> = {
    '4-4-2': { GK: 1, DF: 4, MF: 4, FW: 2 },
    '4-3-3': { GK: 1, DF: 4, MF: 3, FW: 3 },
    '4-2-3-1': { GK: 1, DF: 4, MF: 5, FW: 1 },
    '3-5-2': { GK: 1, DF: 3, MF: 5, FW: 2 },
    '5-3-2': { GK: 1, DF: 5, MF: 3, FW: 2 },
    '4-5-1': { GK: 1, DF: 4, MF: 5, FW: 1 },
  };
  const need = positions[formation];

  const fit: Player[] = [];
  const usedIds = new Set<string>();

  const sorted = [...squad]
    .filter((p) => !p.injuredUntil || p.injuredUntil < 0)
    .sort((a, b) => b.overall - a.overall);

  (Object.keys(need) as Position[]).forEach((pos) => {
    const players = sorted.filter((p) => p.position === pos);
    for (let i = 0; i < need[pos] && i < players.length; i++) {
      fit.push(players[i]);
      usedIds.add(players[i].id);
    }
  });

  const bench = sorted.filter((p) => !usedIds.has(p.id)).slice(0, 7);

  return {
    starting: fit.map((p) => p.id),
    bench: bench.map((p) => p.id),
  };
}

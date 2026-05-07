import type { TeamTier } from '@/types';

export interface StadiumInfo {
  name: string;
  capacity: number;
}

// Capacidade base por tier (usada como fallback para times sem estádio nomeado)
export const TIER_BASE_CAPACITY: Record<TeamTier, number> = {
  elite: 60000,
  top:   45000,
  mid:   28000,
  low:   16000,
};

// Bônus de capacidade por nível de expansão de infraestrutura (stadium 0→3)
export const STADIUM_EXPANSION_BONUS: Record<0 | 1 | 2 | 3, number> = {
  0: 0,
  1: 5000,
  2: 12000,
  3: 22000,
};

// Estádios dos times reais (id do time → dados do estádio)
export const STADIUM_DATA: Record<string, StadiumInfo> = {
  // ── Brasileirão Série A ──────────────────────────────────────
  fla: { name: 'Maracanã',             capacity: 78838 },
  pal: { name: 'Allianz Parque',       capacity: 43713 },
  cor: { name: 'Neo Química Arena',    capacity: 49205 },
  sao: { name: 'MorumBIS',            capacity: 72000 },
  flu: { name: 'Maracanã',             capacity: 78838 },
  atm: { name: 'Arena MRV',           capacity: 46000 },
  bot: { name: 'Nilton Santos',        capacity: 46931 },
  cru: { name: 'Mineirão',             capacity: 62547 },
  gre: { name: 'Arena do Grêmio',      capacity: 55000 },
  int: { name: 'Beira-Rio',            capacity: 50287 },
  bah: { name: 'Arena Fonte Nova',     capacity: 47907 },
  for: { name: 'Arena Castelão',       capacity: 63903 },
  ath: { name: 'Ligga Arena',          capacity: 42372 },
  vas: { name: 'São Januário',         capacity: 21880 },
  rbb: { name: 'Nabi Abi Chedid',      capacity: 17500 },
  cri: { name: 'Heriberto Hülse',      capacity: 19800 },
  jvt: { name: 'Alfredo Jaconi',       capacity: 19908 },
  cui: { name: 'Arena Pantanal',       capacity: 40044 },
  gpa: { name: 'Estádio Hailé Pinheiro', capacity: 13500 },
  ava: { name: 'Ressacada',            capacity: 19906 },

  // ── Paulistão extras ────────────────────────────────────────
  san: { name: 'Vila Belmiro',         capacity: 20000 },
  spo: { name: 'Morumbi',              capacity: 66795 },

  // ── Premier League ──────────────────────────────────────────
  mci: { name: 'Etihad Stadium',       capacity: 55097 },
  liv: { name: 'Anfield',             capacity: 61015 },
  mun: { name: 'Old Trafford',         capacity: 74310 },
  ars: { name: 'Emirates Stadium',     capacity: 60704 },
  che: { name: 'Stamford Bridge',      capacity: 41663 },
  tot: { name: 'Tottenham Hotspur Stadium', capacity: 62850 },
  new: { name: "St. James' Park",      capacity: 52305 },
  avl: { name: 'Villa Park',           capacity: 42682 },
  whu: { name: 'London Stadium',       capacity: 62500 },
  bha: { name: 'Amex Stadium',         capacity: 31876 },
  eve: { name: 'Goodison Park',        capacity: 39414 },
  wol: { name: 'Molineux',             capacity: 32050 },
  cry: { name: "Selhurst Park",        capacity: 25456 },
  bre: { name: 'Gtech Community Stadium', capacity: 17250 },
  ful: { name: 'Craven Cottage',       capacity: 29600 },
  nfo: { name: 'City Ground',          capacity: 30445 },

  // ── La Liga ─────────────────────────────────────────────────
  rmd: { name: 'Estadio Santiago Bernabéu', capacity: 81044 },
  bcn: { name: 'Lluis Companys',       capacity: 86000 },
  atm_es: { name: 'Riyadh Air Metropolitano', capacity: 68456 },
  sev: { name: 'Ramón Sánchez-Pizjuán', capacity: 43883 },
  vil: { name: 'Estadio de La Cerámica', capacity: 23500 },
  atb: { name: 'San Mamés',            capacity: 53332 },
  rsc: { name: 'Estadio de San Sebastián', capacity: 39500 },

  // ── Serie A (IT) ────────────────────────────────────────────
  jve: { name: 'Juventus Stadium',     capacity: 41507 },
  inm: { name: 'Giuseppe Meazza',      capacity: 80018 },
  mil: { name: 'Giuseppe Meazza',      capacity: 80018 },
  nap: { name: 'Stadio Maradona',      capacity: 54726 },
  rom: { name: 'Stadio Olimpico',      capacity: 72698 },
  ata: { name: 'Stadio di Bergamo',    capacity: 26893 },
  laz: { name: 'Stadio Olimpico',      capacity: 72698 },

  // ── Bundesliga ──────────────────────────────────────────────
  bay: { name: 'Allianz Arena',        capacity: 75024 },
  bvb: { name: 'Signal Iduna Park',    capacity: 81365 },
  lev: { name: 'BayArena',             capacity: 30210 },
  rbl: { name: 'Red Bull Arena',       capacity: 47069 },

  // ── Ligue 1 ─────────────────────────────────────────────────
  psg: { name: 'Parc des Princes',     capacity: 47929 },
  mar: { name: 'Orange Vélodrome',     capacity: 67394 },
  mon: { name: 'Stade Louis II',       capacity: 18523 },
  lyo: { name: 'Groupama Stadium',     capacity: 59186 },

  // ── Sul-americanos (Libertadores extras) ────────────────────
  riv: { name: 'El Monumental',        capacity: 84567 },
  bok: { name: 'La Bombonera',         capacity: 49000 },
  rco: { name: 'El Monumental de Núñez', capacity: 64161 },
  ind: { name: 'Estadio Monumental',   capacity: 47638 },
  nac: { name: 'Estadio Nacional',     capacity: 47000 },
  ucb: { name: 'Estadio Hernando Siles', capacity: 41143 },

  // ── Europeus para Champions extras ──────────────────────────
  por: { name: 'Estádio do Dragão',    capacity: 50033 },
  ben: { name: 'Estádio da Luz',       capacity: 64642 },
};

/**
 * Retorna o estádio de um time. Usa o mapeamento nomeado ou gera um nome
 * genérico com capacidade baseada no tier.
 */
export function getStadiumInfo(teamId: string, teamShortName: string, tier: TeamTier): StadiumInfo {
  const known = STADIUM_DATA[teamId];
  if (known) return known;
  return {
    name: `Estádio ${teamShortName}`,
    capacity: TIER_BASE_CAPACITY[tier],
  };
}

/**
 * Calcula capacidade efetiva considerando o nível de expansão do estádio.
 */
export function effectiveCapacity(baseCapacity: number, stadiumLevel: 0 | 1 | 2 | 3): number {
  return baseCapacity + STADIUM_EXPANSION_BONUS[stadiumLevel];
}

import { nanoid } from 'nanoid';
import type { Scout, ScoutReport, ScoutRegion, Position, SaveGame, LoanOffer } from '@/types';
import { createRng, clamp } from '@/utils/random';

// ============================================================
// Nomes de scouts por região
// ============================================================

const SCOUT_NAMES: Record<ScoutRegion, string[]> = {
  brasil: ['Carlos Mendes', 'Rogério Farias', 'Tadeu Lima', 'Márcio Pinto', 'Jonas Borges'],
  sul_america: ['Diego Montoya', 'Alejandro Ríos', 'Rodrigo Vargas', 'Lucas Herrera'],
  europa: ['Pierre Leclerc', 'Stefan Müller', 'James Crawford', 'Marco Ferrini', 'Lars Johansen'],
  africa: ['Kwame Asante', 'Ibrahim Diallo', 'Chukwuemeka Eze', 'Abdoulaye Koné'],
  asia: ['Hiroshi Tanaka', 'Wei Zhang', 'Arjun Mehta', 'Yusuf Al-Rashid'],
  america_central: ['Luis Fuentes', 'Kevin Obando', 'Ramón Cruz'],
};

const REGION_LABEL: Record<ScoutRegion, string> = {
  brasil: 'Brasil',
  sul_america: 'América do Sul',
  europa: 'Europa',
  africa: 'África',
  asia: 'Ásia',
  america_central: 'América Central/Norte',
};

const REGION_WAGE: Record<ScoutRegion, number> = {
  brasil: 8,
  sul_america: 10,
  europa: 20,
  africa: 6,
  asia: 8,
  america_central: 7,
};

// OVR range por região (média dos jogadores que podem ser encontrados)
const REGION_OVR_RANGE: Record<ScoutRegion, [number, number]> = {
  brasil: [62, 84],
  sul_america: [60, 82],
  europa: [68, 88],
  africa: [58, 80],
  asia: [56, 76],
  america_central: [58, 78],
};

const POSITIONS: Position[] = ['GK', 'DF', 'MF', 'FW'];
const POS_WEIGHTS = [0.1, 0.35, 0.3, 0.25]; // GK rare, DF most common

const FIRST_NAMES_BR = ['Gabriel', 'Lucas', 'Matheus', 'Pedro', 'Rafael', 'Felipe', 'Bruno', 'Diego', 'Thiago', 'Gustavo', 'Caio', 'Victor', 'Igor', 'Vitor', 'Kauan'];
const LAST_NAMES_BR  = ['Silva', 'Santos', 'Costa', 'Ferreira', 'Alves', 'Souza', 'Lima', 'Barbosa', 'Rocha', 'Gomes', 'Martins', 'Ribeiro', 'Carvalho', 'Melo', 'Cardoso'];

const FIRST_NAMES_EU = ['Marco', 'Luca', 'Stefan', 'Pierre', 'James', 'Lars', 'Aleksei', 'Niklas', 'Antoine', 'Juan'];
const LAST_NAMES_EU  = ['Müller', 'García', 'Martin', 'Rossi', 'Smith', 'Johansson', 'Bernard', 'Costa', 'Schmidt', 'López'];

const FIRST_NAMES_AF = ['Kwame', 'Amadou', 'Ibrahim', 'Chukwu', 'Seydou', 'Moussa', 'Yusuf', 'Abdi'];
const LAST_NAMES_AF  = ['Diallo', 'Koné', 'Touré', 'Eze', 'Asante', 'Mbaye', 'Coulibaly', 'Traoré'];

function randomName(region: ScoutRegion, rng: () => number): string {
  let firsts = FIRST_NAMES_BR, lasts = LAST_NAMES_BR;
  if (region === 'europa') { firsts = FIRST_NAMES_EU; lasts = LAST_NAMES_EU; }
  if (region === 'africa')  { firsts = FIRST_NAMES_AF; lasts = LAST_NAMES_AF; }
  return `${firsts[Math.floor(rng() * firsts.length)]} ${lasts[Math.floor(rng() * lasts.length)]}`;
}

function randomPosition(rng: () => number): Position {
  const r = rng();
  let acc = 0;
  for (let i = 0; i < POSITIONS.length; i++) {
    acc += POS_WEIGHTS[i];
    if (r < acc) return POSITIONS[i];
  }
  return 'MF';
}

// ============================================================
// Criar scouts disponíveis para contratar
// ============================================================

export function generateAvailableScouts(seed: number): Scout[] {
  const rng = createRng(seed);
  const regions: ScoutRegion[] = ['brasil', 'sul_america', 'europa', 'africa', 'asia', 'america_central'];
  return regions.map((region) => {
    const quality = (Math.floor(rng() * 4) + 1) as Scout['quality'];
    const names = SCOUT_NAMES[region];
    return {
      id: `sc_${region}_${Math.floor(rng() * 0xFFFFFF).toString(16)}`,
      name: names[Math.floor(rng() * names.length)],
      quality,
      region,
      status: 'idle' as const,
      wageMontly: REGION_WAGE[region] * quality,
    };
  });
}

// ============================================================
// Gerar relatório de scouting
// ============================================================

export function generateScoutReport(scout: Scout, _season: number, turn: number): ScoutReport {
  const seed = turn * 1000 + scout.quality * 100 + scout.id.charCodeAt(0);
  const rng = createRng(seed);

  const [minOVR, maxOVR] = REGION_OVR_RANGE[scout.region];
  const realOVR = Math.floor(minOVR + rng() * (maxOVR - minOVR));
  const realPotential = clamp(realOVR + Math.floor(rng() * 15), realOVR, 99);

  // Erro de estimativa: quanto pior o scout, maior o erro
  const errorRange = (6 - scout.quality) * 3; // quality 1 → ±12, quality 5 → ±3
  const ovrError = Math.floor((rng() - 0.5) * 2 * errorRange);
  const estimatedOVR = clamp(realOVR + ovrError, 40, 99);

  // Potencial só revelado por scouts de qualidade 3+
  const estimatedPotential = scout.quality >= 3
    ? clamp(realPotential + Math.floor((rng() - 0.5) * 2 * (6 - scout.quality) * 2), estimatedOVR, 99)
    : null;

  const age = Math.floor(17 + rng() * 14); // 17 a 30
  const position = randomPosition(rng);
  const name = randomName(scout.region, rng);

  // Valor estimado: baseado no OVR estimado e na idade
  const ageFactor = age <= 23 ? 1.5 : age <= 27 ? 1.0 : 0.6;
  const estimatedValue = Math.floor(estimatedOVR * estimatedOVR * 0.08 * ageFactor) + 100;

  return {
    id: nanoid(8),
    scoutId: scout.id,
    discoveredAt: turn,
    read: false,
    name,
    age,
    position,
    estimatedOVR,
    estimatedPotential,
    estimatedValue,
    region: scout.region,
    realOVR,
    realPotential,
  };
}

// ============================================================
// Gerar oferta de empréstimo da IA
// ============================================================

export function generateLoanOffers(save: SaveGame): LoanOffer[] {
  const rng = createRng(save.season * 9999 + save.currentTurn);
  const offers: LoanOffer[] = [];

  // IA oferece 4-6 jogadores da qualidade média para empréstimo
  const aiTeams = save.teams.filter((t) => !t.isUserControlled && t.squad.length > 20);
  const pool = aiTeams.flatMap((t) =>
    t.squad
      .filter((p) => p.overall >= 65 && p.overall <= 82 && p.stats.appearances === 0)
      .map((p) => ({ player: p, team: t })),
  );

  const picked = pool.sort(() => rng() - 0.5).slice(0, 5);
  for (const { player, team } of picked) {
    offers.push({
      id: nanoid(8),
      playerId: player.id,
      fromTeamId: team.id,
      loanFeeMonthly: Math.floor(player.wageMonthly * 0.4),
      loanUntil: save.season + 1,
      status: 'available',
      offeredAt: save.currentTurn,
    });
  }
  return offers;
}

export { REGION_LABEL };

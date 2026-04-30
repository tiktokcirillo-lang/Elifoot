import type { Team, TeamTier } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';

interface ExtraSeed {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  primaryColor: string;
  secondaryColor: string;
  tier: TeamTier;
  reputation: number;
  budget: number;
  squadSeed: number;
}

// Times sul-americanos selecionados para Libertadores
export const LIBERTADORES_EXTRA_SEEDS: ExtraSeed[] = [
  { id: 'rvr', name: 'River Plate',    shortName: 'RIV', city: 'Buenos Aires', country: 'AR', primaryColor: '#ffffff', secondaryColor: '#e30613', tier: 'top',   reputation: 88, budget: 320000, squadSeed: 201 },
  { id: 'bjr', name: 'Boca Juniors',   shortName: 'BOC', city: 'Buenos Aires', country: 'AR', primaryColor: '#003da5', secondaryColor: '#ffd700', tier: 'top',   reputation: 88, budget: 320000, squadSeed: 202 },
  { id: 'ndo', name: 'Nacional',       shortName: 'NAC', city: 'Montevidéu',   country: 'UY', primaryColor: '#ffffff', secondaryColor: '#003da5', tier: 'mid',   reputation: 75, budget: 180000, squadSeed: 203 },
  { id: 'pna', name: 'Peñarol',        shortName: 'PEN', city: 'Montevidéu',   country: 'UY', primaryColor: '#ffd700', secondaryColor: '#000000', tier: 'mid',   reputation: 74, budget: 170000, squadSeed: 204 },
  { id: 'col', name: 'Colo-Colo',      shortName: 'CCO', city: 'Santiago',     country: 'CL', primaryColor: '#ffffff', secondaryColor: '#000000', tier: 'mid',   reputation: 72, budget: 160000, squadSeed: 205 },
  { id: 'lib', name: 'Libertad',       shortName: 'LIB', city: 'Asunción',     country: 'PY', primaryColor: '#ffffff', secondaryColor: '#000000', tier: 'mid',   reputation: 65, budget: 130000, squadSeed: 206 },
  { id: 'olm', name: 'Olimpia',        shortName: 'OLI', city: 'Asunción',     country: 'PY', primaryColor: '#ffffff', secondaryColor: '#000000', tier: 'mid',   reputation: 70, budget: 150000, squadSeed: 207 },
  { id: 'bsc', name: 'Barcelona SC',   shortName: 'BAR', city: 'Guayaquil',    country: 'EC', primaryColor: '#ffd700', secondaryColor: '#000000', tier: 'low',   reputation: 64, budget: 120000, squadSeed: 208 },
  { id: 'lqu', name: 'LDU Quito',      shortName: 'LDU', city: 'Quito',        country: 'EC', primaryColor: '#ffffff', secondaryColor: '#1c5b3d', tier: 'mid',   reputation: 68, budget: 140000, squadSeed: 209 },
  { id: 'ind', name: 'Independiente del Valle', shortName: 'IDV', city: 'Sangolquí', country: 'EC', primaryColor: '#000000', secondaryColor: '#ffd700', tier: 'mid', reputation: 70, budget: 150000, squadSeed: 210 },
  { id: 'unv', name: 'Universidad Católica', shortName: 'UCC', city: 'Santiago', country: 'CL', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 62, budget: 110000, squadSeed: 211 },
  { id: 'bsf', name: 'Bolívar',        shortName: 'BOL', city: 'La Paz',       country: 'BO', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 100000, squadSeed: 212 },
];

// Times europeus selecionados para Champions League
export const CHAMPIONS_EXTRA_SEEDS: ExtraSeed[] = [
  { id: 'rmd', name: 'Real Madrid',    shortName: 'RMA', city: 'Madri',     country: 'ES', primaryColor: '#ffffff', secondaryColor: '#ffd700', tier: 'elite', reputation: 99, budget: 1500000, squadSeed: 301 },
  { id: 'bcn', name: 'Barcelona',      shortName: 'BAR', city: 'Barcelona', country: 'ES', primaryColor: '#a50044', secondaryColor: '#003da5', tier: 'elite', reputation: 97, budget: 1300000, squadSeed: 302 },
  { id: 'mci', name: 'Manchester City',shortName: 'MCI', city: 'Manchester',country: 'EN', primaryColor: '#6cabdd', secondaryColor: '#ffffff', tier: 'elite', reputation: 98, budget: 1450000, squadSeed: 303 },
  { id: 'liv', name: 'Liverpool',      shortName: 'LIV', city: 'Liverpool', country: 'EN', primaryColor: '#c8102e', secondaryColor: '#ffd700', tier: 'elite', reputation: 95, budget: 1200000, squadSeed: 304 },
  { id: 'mun', name: 'Manchester United', shortName: 'MUN', city: 'Manchester', country: 'EN', primaryColor: '#da020e', secondaryColor: '#ffd700', tier: 'top',   reputation: 92, budget: 1100000, squadSeed: 305 },
  { id: 'ars', name: 'Arsenal',        shortName: 'ARS', city: 'Londres',   country: 'EN', primaryColor: '#ef0107', secondaryColor: '#ffffff', tier: 'top',   reputation: 90, budget: 1000000, squadSeed: 306 },
  { id: 'che', name: 'Chelsea',        shortName: 'CHE', city: 'Londres',   country: 'EN', primaryColor: '#034694', secondaryColor: '#ffffff', tier: 'top',   reputation: 89, budget: 980000, squadSeed: 307 },
  { id: 'psg', name: 'Paris SG',       shortName: 'PSG', city: 'Paris',     country: 'FR', primaryColor: '#004170', secondaryColor: '#e30613', tier: 'elite', reputation: 95, budget: 1300000, squadSeed: 308 },
  { id: 'bay', name: 'Bayern Munique', shortName: 'BAY', city: 'Munique',   country: 'DE', primaryColor: '#dc052d', secondaryColor: '#0066b2', tier: 'elite', reputation: 96, budget: 1250000, squadSeed: 309 },
  { id: 'bvb', name: 'Borussia Dortmund', shortName: 'BVB', city: 'Dortmund', country: 'DE', primaryColor: '#fde100', secondaryColor: '#000000', tier: 'top',   reputation: 86, budget: 750000, squadSeed: 310 },
  { id: 'jve', name: 'Juventus',       shortName: 'JUV', city: 'Turim',     country: 'IT', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'top',   reputation: 90, budget: 950000, squadSeed: 311 },
  { id: 'inm', name: 'Inter de Milão', shortName: 'INT', city: 'Milão',     country: 'IT', primaryColor: '#0068a8', secondaryColor: '#000000', tier: 'top',   reputation: 91, budget: 970000, squadSeed: 312 },
  { id: 'mil', name: 'Milan',          shortName: 'MIL', city: 'Milão',     country: 'IT', primaryColor: '#fb090b', secondaryColor: '#000000', tier: 'top',   reputation: 89, budget: 880000, squadSeed: 313 },
  { id: 'atm_es', name: 'Atlético de Madri', shortName: 'ATM', city: 'Madri', country: 'ES', primaryColor: '#cb3524', secondaryColor: '#ffffff', tier: 'top',   reputation: 88, budget: 850000, squadSeed: 314 },
  { id: 'por', name: 'Porto',          shortName: 'POR', city: 'Porto',     country: 'PT', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'top',   reputation: 80, budget: 450000, squadSeed: 315 },
  { id: 'ben', name: 'Benfica',        shortName: 'BEN', city: 'Lisboa',    country: 'PT', primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'top',   reputation: 82, budget: 480000, squadSeed: 316 },
];

export function buildExtraTeams(seeds: ExtraSeed[]): Team[] {
  return seeds.map((seed) => {
    const squad = generateSquad(seed.tier, seed.squadSeed);
    const { starting, bench } = autoPickStartingEleven(squad, '4-3-3');
    return {
      id: seed.id,
      name: seed.name,
      shortName: seed.shortName,
      city: seed.city,
      country: seed.country,
      primaryColor: seed.primaryColor,
      secondaryColor: seed.secondaryColor,
      tier: seed.tier,
      reputation: seed.reputation,
      budget: seed.budget,
      squad,
      formation: '4-3-3',
      starting11: starting,
      bench,
      isUserControlled: false,
    };
  });
}

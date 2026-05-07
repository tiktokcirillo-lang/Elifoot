import type { Team, TeamTier, Player } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';
import { buildPSGSquad } from '@/data/realSquads';

interface Ligue1Seed {
  id: string;
  name: string;
  shortName: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  tier: TeamTier;
  reputation: number;
  budget: number;
  squadSeed?: number;
}

const REAL_SQUAD_BUILDERS: Record<string, () => Player[]> = {
  psg: buildPSGSquad,
};

const SEEDS: Ligue1Seed[] = [
  { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', city: 'Paris',      primaryColor: '#004170', secondaryColor: '#e30613', tier: 'elite', reputation: 95, budget: 1300000 },
  { id: 'mar', name: 'Olympique Marseille', shortName: 'MAR', city: 'Marselha',   primaryColor: '#2aaae1', secondaryColor: '#ffffff', tier: 'top',   reputation: 82, budget: 580000, squadSeed: 1401 },
  { id: 'mon', name: 'AS Monaco',           shortName: 'MON', city: 'Mônaco',     primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'top',   reputation: 81, budget: 560000, squadSeed: 1402 },
  { id: 'lyo', name: 'Olympique Lyon',      shortName: 'LYO', city: 'Lyon',       primaryColor: '#003da5', secondaryColor: '#e30613', tier: 'top',   reputation: 80, budget: 540000, squadSeed: 1403 },
  { id: 'lil', name: 'Lille OSC',           shortName: 'LIL', city: 'Lille',      primaryColor: '#c8102e', secondaryColor: '#ffffff', tier: 'top',   reputation: 78, budget: 480000, squadSeed: 1404 },
  { id: 'nic', name: 'OGC Nice',            shortName: 'NIC', city: 'Nice',       primaryColor: '#000000', secondaryColor: '#e30613', tier: 'mid',   reputation: 73, budget: 380000, squadSeed: 1405 },
  { id: 'len', name: 'RC Lens',             shortName: 'LEN', city: 'Lens',       primaryColor: '#ffd700', secondaryColor: '#e30613', tier: 'mid',   reputation: 71, budget: 340000, squadSeed: 1406 },
  { id: 'ren', name: 'Stade Rennais',       shortName: 'REN', city: 'Rennes',     primaryColor: '#000000', secondaryColor: '#e30613', tier: 'mid',   reputation: 70, budget: 320000, squadSeed: 1407 },
  { id: 'rei', name: 'Stade de Reims',      shortName: 'REI', city: 'Reims',      primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'mid',   reputation: 65, budget: 250000, squadSeed: 1408 },
  { id: 'nan', name: 'FC Nantes',           shortName: 'NAN', city: 'Nantes',     primaryColor: '#ffd700', secondaryColor: '#1e7a38', tier: 'mid',   reputation: 67, budget: 265000, squadSeed: 1409 },
  { id: 'mtp', name: 'Montpellier HSC',     shortName: 'MTP', city: 'Montpellier',primaryColor: '#2466b2', secondaryColor: '#f68b1f', tier: 'mid',   reputation: 65, budget: 250000, squadSeed: 1410 },
  { id: 'str', name: 'RC Strasbourg',       shortName: 'STR', city: 'Estrasburgo',primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'mid',   reputation: 63, budget: 220000, squadSeed: 1411 },
  { id: 'brf', name: 'Stade Brestois',      shortName: 'BRF', city: 'Brest',      primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'mid',   reputation: 64, budget: 230000, squadSeed: 1412 },
  { id: 'tou', name: 'Toulouse FC',         shortName: 'TOU', city: 'Toulouse',   primaryColor: '#4169e1', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 190000, squadSeed: 1413 },
  { id: 'lor', name: 'FC Lorient',          shortName: 'LOR', city: 'Lorient',    primaryColor: '#000000', secondaryColor: '#e30613', tier: 'low',   reputation: 59, budget: 170000, squadSeed: 1414 },
  { id: 'met', name: 'FC Metz',             shortName: 'MET', city: 'Metz',       primaryColor: '#6b2f83', secondaryColor: '#e30613', tier: 'low',   reputation: 58, budget: 160000, squadSeed: 1415 },
  { id: 'cle', name: 'Clermont Foot',       shortName: 'CLE', city: 'Clermont',   primaryColor: '#e30613', secondaryColor: '#003da5', tier: 'low',   reputation: 56, budget: 150000, squadSeed: 1416 },
  { id: 'lhv', name: 'Le Havre AC',         shortName: 'LHV', city: 'Le Havre',   primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 55, budget: 140000, squadSeed: 1417 },
];

export const LIGUE1_TEAM_IDS = SEEDS.map((s) => s.id);

export function buildLigue1Teams(): Team[] {
  return SEEDS.map((seed) => {
    const squad = REAL_SQUAD_BUILDERS[seed.id]
      ? REAL_SQUAD_BUILDERS[seed.id]()
      : generateSquad(seed.tier, seed.squadSeed!);
    const { starting, bench } = autoPickStartingEleven(squad, '4-3-3');
    return {
      id: seed.id,
      name: seed.name,
      shortName: seed.shortName,
      city: seed.city,
      country: 'FR',
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

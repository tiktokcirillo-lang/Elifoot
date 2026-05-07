import type { Team, TeamTier, Player } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';
import {
  buildBayernSquad,
  buildDortmundSquad,
} from '@/data/realSquads';

interface BundesligaSeed {
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
  bay: buildBayernSquad,
  bvb: buildDortmundSquad,
};

const SEEDS: BundesligaSeed[] = [
  { id: 'bay', name: 'Bayern Munique',       shortName: 'BAY', city: 'Munique',    primaryColor: '#dc052d', secondaryColor: '#0066b2', tier: 'elite', reputation: 96, budget: 1250000 },
  { id: 'bvb', name: 'Borussia Dortmund',    shortName: 'BVB', city: 'Dortmund',   primaryColor: '#fde100', secondaryColor: '#000000', tier: 'top',   reputation: 86, budget: 750000 },
  { id: 'lev', name: 'Bayer Leverkusen',     shortName: 'LEV', city: 'Leverkusen', primaryColor: '#e32221', secondaryColor: '#000000', tier: 'top',   reputation: 85, budget: 700000, squadSeed: 1301 },
  { id: 'rbl', name: 'RB Leipzig',           shortName: 'RBL', city: 'Leipzig',    primaryColor: '#003da5', secondaryColor: '#e30613', tier: 'top',   reputation: 84, budget: 680000, squadSeed: 1302 },
  { id: 'sgf', name: 'Eintracht Frankfurt',  shortName: 'SGE', city: 'Frankfurt',  primaryColor: '#000000', secondaryColor: '#e30613', tier: 'top',   reputation: 78, budget: 480000, squadSeed: 1303 },
  { id: 'vfb', name: 'VfB Stuttgart',        shortName: 'VFB', city: 'Stuttgart',  primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'top',   reputation: 76, budget: 440000, squadSeed: 1304 },
  { id: 'bmg', name: 'B. Mönchengladbach',   shortName: 'BMG', city: 'Mönchengladbach', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'mid', reputation: 74, budget: 380000, squadSeed: 1305 },
  { id: 'scf', name: 'SC Freiburg',          shortName: 'SCF', city: 'Freiburg',   primaryColor: '#cc0000', secondaryColor: '#000000', tier: 'mid',   reputation: 72, budget: 350000, squadSeed: 1306 },
  { id: 'wob', name: 'Wolfsburg',            shortName: 'WOB', city: 'Wolfsburg',  primaryColor: '#005db8', secondaryColor: '#70b31d', tier: 'mid',   reputation: 70, budget: 330000, squadSeed: 1307 },
  { id: 'svw', name: 'Werder Bremen',        shortName: 'SVW', city: 'Bremen',     primaryColor: '#1e7a38', secondaryColor: '#ffffff', tier: 'mid',   reputation: 68, budget: 280000, squadSeed: 1308 },
  { id: 'tsh', name: 'Hoffenheim',           shortName: 'TSH', city: 'Sinsheim',   primaryColor: '#1262b2', secondaryColor: '#ffffff', tier: 'mid',   reputation: 68, budget: 290000, squadSeed: 1309 },
  { id: 'koe', name: 'FC Köln',              shortName: 'KOE', city: 'Colônia',    primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'mid',   reputation: 67, budget: 270000, squadSeed: 1310 },
  { id: 'ubn', name: 'Union Berlin',         shortName: 'UBN', city: 'Berlim',     primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'mid',   reputation: 65, budget: 250000, squadSeed: 1311 },
  { id: 'maz', name: 'Mainz 05',             shortName: 'MAZ', city: 'Mainz',      primaryColor: '#c8102e', secondaryColor: '#ffffff', tier: 'mid',   reputation: 66, budget: 260000, squadSeed: 1312 },
  { id: 'aug', name: 'FC Augsburg',          shortName: 'AUG', city: 'Augsburg',   primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 190000, squadSeed: 1313 },
  { id: 'boc', name: 'VfL Bochum',           shortName: 'BOC', city: 'Bochum',     primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 62, budget: 200000, squadSeed: 1314 },
  { id: 'hei', name: 'Heidenheim',           shortName: 'HEI', city: 'Heidenheim', primaryColor: '#e30613', secondaryColor: '#003da5', tier: 'low',   reputation: 58, budget: 160000, squadSeed: 1315 },
  { id: 'dar', name: 'Darmstadt',            shortName: 'DAR', city: 'Darmstadt',  primaryColor: '#003da5', secondaryColor: '#ffd700', tier: 'low',   reputation: 55, budget: 140000, squadSeed: 1316 },
];

export const BUNDESLIGA_TEAM_IDS = SEEDS.map((s) => s.id);

export function buildBundesligaTeams(): Team[] {
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
      country: 'DE',
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

import type { Team, TeamTier, Player } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';
import {
  buildManCitySquad,
  buildLiverpoolSquad,
  buildManUnitedSquad,
  buildArsenalSquad,
  buildChelseaSquad,
} from '@/data/realSquads';

interface PLSeed {
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
  mci: buildManCitySquad,
  liv: buildLiverpoolSquad,
  mun: buildManUnitedSquad,
  ars: buildArsenalSquad,
  che: buildChelseaSquad,
};

const SEEDS: PLSeed[] = [
  { id: 'mci', name: 'Manchester City',     shortName: 'MCI', city: 'Manchester',    primaryColor: '#6cabdd', secondaryColor: '#ffffff', tier: 'elite', reputation: 98, budget: 1450000 },
  { id: 'liv', name: 'Liverpool',            shortName: 'LIV', city: 'Liverpool',     primaryColor: '#c8102e', secondaryColor: '#ffd700', tier: 'elite', reputation: 95, budget: 1200000 },
  { id: 'mun', name: 'Manchester United',    shortName: 'MUN', city: 'Manchester',    primaryColor: '#da020e', secondaryColor: '#ffd700', tier: 'top',   reputation: 92, budget: 1100000 },
  { id: 'ars', name: 'Arsenal',              shortName: 'ARS', city: 'Londres',       primaryColor: '#ef0107', secondaryColor: '#ffffff', tier: 'top',   reputation: 90, budget: 1000000 },
  { id: 'che', name: 'Chelsea',              shortName: 'CHE', city: 'Londres',       primaryColor: '#034694', secondaryColor: '#ffffff', tier: 'top',   reputation: 89, budget: 980000 },
  { id: 'tot', name: 'Tottenham Hotspur',    shortName: 'TOT', city: 'Londres',       primaryColor: '#132257', secondaryColor: '#ffffff', tier: 'top',   reputation: 84, budget: 700000,  squadSeed: 1001 },
  { id: 'new', name: 'Newcastle United',     shortName: 'NEW', city: 'Newcastle',     primaryColor: '#241f20', secondaryColor: '#ffffff', tier: 'top',   reputation: 82, budget: 750000,  squadSeed: 1002 },
  { id: 'avl', name: 'Aston Villa',          shortName: 'AVL', city: 'Birmingham',    primaryColor: '#670e36', secondaryColor: '#95bfe5', tier: 'top',   reputation: 80, budget: 600000,  squadSeed: 1003 },
  { id: 'whu', name: 'West Ham United',      shortName: 'WHU', city: 'Londres',       primaryColor: '#7a263a', secondaryColor: '#1bb1e7', tier: 'mid',   reputation: 76, budget: 450000,  squadSeed: 1004 },
  { id: 'bha', name: 'Brighton',             shortName: 'BHA', city: 'Brighton',      primaryColor: '#0057b8', secondaryColor: '#ffd700', tier: 'mid',   reputation: 74, budget: 400000,  squadSeed: 1005 },
  { id: 'eve', name: 'Everton',              shortName: 'EVE', city: 'Liverpool',     primaryColor: '#003399', secondaryColor: '#ffffff', tier: 'mid',   reputation: 72, budget: 350000,  squadSeed: 1006 },
  { id: 'wol', name: 'Wolverhampton',        shortName: 'WOL', city: 'Wolverhampton', primaryColor: '#fdb913', secondaryColor: '#231f20', tier: 'mid',   reputation: 70, budget: 320000,  squadSeed: 1007 },
  { id: 'cry', name: 'Crystal Palace',       shortName: 'CRY', city: 'Londres',       primaryColor: '#1b458f', secondaryColor: '#c4122e', tier: 'mid',   reputation: 68, budget: 280000,  squadSeed: 1008 },
  { id: 'bre', name: 'Brentford',            shortName: 'BRE', city: 'Londres',       primaryColor: '#d20000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 66, budget: 260000,  squadSeed: 1009 },
  { id: 'ful', name: 'Fulham',               shortName: 'FUL', city: 'Londres',       primaryColor: '#ffffff', secondaryColor: '#000000', tier: 'mid',   reputation: 65, budget: 250000,  squadSeed: 1010 },
  { id: 'nfo', name: 'Nottingham Forest',    shortName: 'NFO', city: 'Nottingham',    primaryColor: '#dd0000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 67, budget: 270000,  squadSeed: 1011 },
  { id: 'lei', name: 'Leicester City',       shortName: 'LEI', city: 'Leicester',     primaryColor: '#003090', secondaryColor: '#fdbe11', tier: 'mid',   reputation: 73, budget: 380000,  squadSeed: 1012 },
  { id: 'sou', name: 'Southampton',          shortName: 'SOU', city: 'Southampton',   primaryColor: '#d71920', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 200000,  squadSeed: 1013 },
  { id: 'bur', name: 'Burnley',              shortName: 'BUR', city: 'Burnley',       primaryColor: '#6c1d45', secondaryColor: '#99d6ea', tier: 'low',   reputation: 58, budget: 160000,  squadSeed: 1014 },
  { id: 'lut', name: 'Luton Town',           shortName: 'LUT', city: 'Luton',         primaryColor: '#f78f1e', secondaryColor: '#003d83', tier: 'low',   reputation: 56, budget: 140000,  squadSeed: 1015 },
];

export const PREMIER_LEAGUE_TEAM_IDS = SEEDS.map((s) => s.id);

export function buildPremierLeagueTeams(): Team[] {
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
      country: 'EN',
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

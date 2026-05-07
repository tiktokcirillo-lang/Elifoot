import type { Team, TeamTier, Player } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';
import {
  buildJuventusSquad,
  buildInterSquad,
  buildMilanSquad,
} from '@/data/realSquads';

interface SerieASeed {
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
  jve: buildJuventusSquad,
  inm: buildInterSquad,
  mil: buildMilanSquad,
};

const SEEDS: SerieASeed[] = [
  { id: 'inm', name: 'Inter de Milão',    shortName: 'INT', city: 'Milão',        primaryColor: '#0068a8', secondaryColor: '#000000', tier: 'top',   reputation: 91, budget: 970000 },
  { id: 'jve', name: 'Juventus',          shortName: 'JUV', city: 'Turim',        primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'top',   reputation: 90, budget: 950000 },
  { id: 'mil', name: 'Milan',             shortName: 'MIL', city: 'Milão',        primaryColor: '#fb090b', secondaryColor: '#000000', tier: 'top',   reputation: 89, budget: 880000 },
  { id: 'nap', name: 'Napoli',            shortName: 'NAP', city: 'Nápoles',      primaryColor: '#12a0c8', secondaryColor: '#ffffff', tier: 'top',   reputation: 87, budget: 800000, squadSeed: 1201 },
  { id: 'rom', name: 'Roma',              shortName: 'ROM', city: 'Roma',         primaryColor: '#8b1c2b', secondaryColor: '#ffd700', tier: 'top',   reputation: 83, budget: 650000, squadSeed: 1202 },
  { id: 'ata', name: 'Atalanta',          shortName: 'ATA', city: 'Bérgamo',      primaryColor: '#003da5', secondaryColor: '#000000', tier: 'top',   reputation: 82, budget: 620000, squadSeed: 1203 },
  { id: 'laz', name: 'Lazio',             shortName: 'LAZ', city: 'Roma',         primaryColor: '#87ceeb', secondaryColor: '#ffffff', tier: 'top',   reputation: 80, budget: 550000, squadSeed: 1204 },
  { id: 'fio', name: 'Fiorentina',        shortName: 'FIO', city: 'Florença',     primaryColor: '#4169e1', secondaryColor: '#ffffff', tier: 'mid',   reputation: 75, budget: 400000, squadSeed: 1205 },
  { id: 'bol', name: 'Bologna',           shortName: 'BOL', city: 'Bolonha',      primaryColor: '#003da5', secondaryColor: '#e30613', tier: 'mid',   reputation: 72, budget: 350000, squadSeed: 1206 },
  { id: 'tor', name: 'Torino',            shortName: 'TOR', city: 'Turim',        primaryColor: '#8b0000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 70, budget: 320000, squadSeed: 1207 },
  { id: 'mnz', name: 'Monza',             shortName: 'MON', city: 'Monza',        primaryColor: '#c8102e', secondaryColor: '#ffffff', tier: 'mid',   reputation: 68, budget: 280000, squadSeed: 1208 },
  { id: 'sas', name: 'Sassuolo',          shortName: 'SAS', city: 'Sassuolo',     primaryColor: '#00692e', secondaryColor: '#000000', tier: 'mid',   reputation: 67, budget: 260000, squadSeed: 1209 },
  { id: 'udi', name: 'Udinese',           shortName: 'UDI', city: 'Udine',        primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 65, budget: 240000, squadSeed: 1210 },
  { id: 'cag', name: 'Cagliari',          shortName: 'CAG', city: 'Cagliari',     primaryColor: '#e30613', secondaryColor: '#003da5', tier: 'low',   reputation: 62, budget: 190000, squadSeed: 1211 },
  { id: 'gen', name: 'Genoa',             shortName: 'GEN', city: 'Gênova',       primaryColor: '#8b0000', secondaryColor: '#003da5', tier: 'low',   reputation: 61, budget: 185000, squadSeed: 1212 },
  { id: 'lec', name: 'Lecce',             shortName: 'LEC', city: 'Lecce',        primaryColor: '#ffd700', secondaryColor: '#e30613', tier: 'low',   reputation: 60, budget: 175000, squadSeed: 1213 },
  { id: 'emp', name: 'Empoli',            shortName: 'EMP', city: 'Empoli',       primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 180000, squadSeed: 1214 },
  { id: 'hev', name: 'Hellas Verona',     shortName: 'VER', city: 'Verona',       primaryColor: '#003da5', secondaryColor: '#ffd700', tier: 'low',   reputation: 58, budget: 155000, squadSeed: 1215 },
  { id: 'fro', name: 'Frosinone',         shortName: 'FRO', city: 'Frosinone',    primaryColor: '#ffd700', secondaryColor: '#003da5', tier: 'low',   reputation: 58, budget: 160000, squadSeed: 1216 },
  { id: 'sal', name: 'Salernitana',       shortName: 'SAL', city: 'Salerno',      primaryColor: '#8b0000', secondaryColor: '#ffd700', tier: 'low',   reputation: 55, budget: 140000, squadSeed: 1217 },
];

export const SERIE_A_TEAM_IDS = SEEDS.map((s) => s.id);

export function buildSerieATeams(): Team[] {
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
      country: 'IT',
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

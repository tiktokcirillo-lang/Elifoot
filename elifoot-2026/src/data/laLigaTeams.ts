import type { Team, TeamTier, Player } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';
import {
  buildRealMadridSquad,
  buildBarcelonaSquad,
  buildAtleticoMadridSquad,
} from '@/data/realSquads';

interface LaLigaSeed {
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
  rmd:    buildRealMadridSquad,
  bcn:    buildBarcelonaSquad,
  atm_es: buildAtleticoMadridSquad,
};

const SEEDS: LaLigaSeed[] = [
  { id: 'rmd',    name: 'Real Madrid',       shortName: 'RMA', city: 'Madri',      primaryColor: '#ffffff', secondaryColor: '#ffd700', tier: 'elite', reputation: 99, budget: 1500000 },
  { id: 'bcn',    name: 'Barcelona',          shortName: 'BAR', city: 'Barcelona',  primaryColor: '#a50044', secondaryColor: '#003da5', tier: 'elite', reputation: 97, budget: 1300000 },
  { id: 'atm_es', name: 'Atlético de Madri',  shortName: 'ATM', city: 'Madri',      primaryColor: '#cb3524', secondaryColor: '#ffffff', tier: 'top',   reputation: 88, budget: 850000 },
  { id: 'sev',    name: 'Sevilla',            shortName: 'SEV', city: 'Sevilha',    primaryColor: '#d70014', secondaryColor: '#ffffff', tier: 'top',   reputation: 82, budget: 600000, squadSeed: 1101 },
  { id: 'vil',    name: 'Villarreal',         shortName: 'VIL', city: 'Villarreal', primaryColor: '#ffd700', secondaryColor: '#004f9f', tier: 'top',   reputation: 78, budget: 480000, squadSeed: 1102 },
  { id: 'atb',    name: 'Athletic Bilbao',    shortName: 'ATH', city: 'Bilbao',     primaryColor: '#e63329', secondaryColor: '#000000', tier: 'top',   reputation: 76, budget: 420000, squadSeed: 1103 },
  { id: 'rsc',    name: 'Real Sociedad',      shortName: 'RSC', city: 'San Sebastián', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'mid', reputation: 75, budget: 400000, squadSeed: 1104 },
  { id: 'rbt',    name: 'Real Betis',         shortName: 'BET', city: 'Sevilha',    primaryColor: '#1e7a38', secondaryColor: '#ffffff', tier: 'mid',   reputation: 74, budget: 380000, squadSeed: 1105 },
  { id: 'gir',    name: 'Girona',             shortName: 'GIR', city: 'Girona',     primaryColor: '#cf1735', secondaryColor: '#ffd700', tier: 'mid',   reputation: 70, budget: 300000, squadSeed: 1106 },
  { id: 'val',    name: 'Valencia',           shortName: 'VAL', city: 'Valência',   primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 72, budget: 350000, squadSeed: 1107 },
  { id: 'cel',    name: 'Celta Vigo',         shortName: 'CEL', city: 'Vigo',       primaryColor: '#85b7c9', secondaryColor: '#ffffff', tier: 'mid',   reputation: 68, budget: 260000, squadSeed: 1108 },
  { id: 'osa',    name: 'Osasuna',            shortName: 'OSA', city: 'Pamplona',   primaryColor: '#d20021', secondaryColor: '#003da5', tier: 'mid',   reputation: 65, budget: 220000, squadSeed: 1109 },
  { id: 'mal',    name: 'Mallorca',           shortName: 'MAL', city: 'Palma',      primaryColor: '#e30613', secondaryColor: '#000000', tier: 'low',   reputation: 61, budget: 170000, squadSeed: 1110 },
  { id: 'ala',    name: 'Alavés',             shortName: 'ALA', city: 'Vitória',    primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 155000, squadSeed: 1111 },
  { id: 'ray',    name: 'Rayo Vallecano',     shortName: 'RAY', city: 'Madri',      primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 160000, squadSeed: 1112 },
  { id: 'get',    name: 'Getafe',             shortName: 'GET', city: 'Getafe',     primaryColor: '#0a4ea4', secondaryColor: '#ffffff', tier: 'low',   reputation: 62, budget: 180000, squadSeed: 1113 },
  { id: 'lpa',    name: 'Las Palmas',         shortName: 'LPA', city: 'Las Palmas', primaryColor: '#ffd700', secondaryColor: '#003da5', tier: 'low',   reputation: 59, budget: 150000, squadSeed: 1114 },
  { id: 'gra',    name: 'Granada',            shortName: 'GRA', city: 'Granada',    primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'low',   reputation: 57, budget: 135000, squadSeed: 1115 },
  { id: 'cad',    name: 'Cádiz',              shortName: 'CAD', city: 'Cádiz',      primaryColor: '#ffd700', secondaryColor: '#0040a0', tier: 'low',   reputation: 58, budget: 140000, squadSeed: 1116 },
  { id: 'alm',    name: 'Almería',            shortName: 'ALM', city: 'Almería',    primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'low',   reputation: 56, budget: 130000, squadSeed: 1117 },
];

export const LA_LIGA_TEAM_IDS = SEEDS.map((s) => s.id);

export function buildLaLigaTeams(): Team[] {
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
      country: 'ES',
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

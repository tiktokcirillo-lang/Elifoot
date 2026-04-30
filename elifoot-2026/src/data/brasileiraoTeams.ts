import type { Team, TeamTier } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';

interface TeamSeed {
  id: string;
  name: string;
  shortName: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  tier: TeamTier;
  reputation: number;
  budget: number;
  squadSeed: number;
}

// Os 20 do Brasileirão. Tier define força inicial do elenco.
const SEEDS: TeamSeed[] = [
  { id: 'fla', name: 'Flamengo',         shortName: 'FLA', city: 'Rio de Janeiro', primaryColor: '#e30613', secondaryColor: '#000000', tier: 'elite', reputation: 95, budget: 850000, squadSeed: 101 },
  { id: 'pal', name: 'Palmeiras',        shortName: 'PAL', city: 'São Paulo',      primaryColor: '#006437', secondaryColor: '#ffffff', tier: 'elite', reputation: 94, budget: 820000, squadSeed: 102 },
  { id: 'cor', name: 'Corinthians',      shortName: 'COR', city: 'São Paulo',      primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'top',   reputation: 90, budget: 600000, squadSeed: 103 },
  { id: 'sao', name: 'São Paulo',        shortName: 'SAO', city: 'São Paulo',      primaryColor: '#ed2939', secondaryColor: '#000000', tier: 'top',   reputation: 88, budget: 580000, squadSeed: 104 },
  { id: 'flu', name: 'Fluminense',       shortName: 'FLU', city: 'Rio de Janeiro', primaryColor: '#7a1f3d', secondaryColor: '#1c5b3d', tier: 'top',   reputation: 84, budget: 420000, squadSeed: 105 },
  { id: 'atm', name: 'Atlético Mineiro', shortName: 'CAM', city: 'Belo Horizonte', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'top',   reputation: 86, budget: 510000, squadSeed: 106 },
  { id: 'bot', name: 'Botafogo',         shortName: 'BOT', city: 'Rio de Janeiro', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'top',   reputation: 82, budget: 460000, squadSeed: 107 },
  { id: 'cru', name: 'Cruzeiro',         shortName: 'CRU', city: 'Belo Horizonte', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'top',   reputation: 80, budget: 380000, squadSeed: 108 },
  { id: 'gre', name: 'Grêmio',           shortName: 'GRE', city: 'Porto Alegre',   primaryColor: '#0d4ea2', secondaryColor: '#000000', tier: 'top',   reputation: 81, budget: 360000, squadSeed: 109 },
  { id: 'int', name: 'Internacional',    shortName: 'INT', city: 'Porto Alegre',   primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'top',   reputation: 80, budget: 350000, squadSeed: 110 },
  { id: 'bah', name: 'Bahia',            shortName: 'BAH', city: 'Salvador',       primaryColor: '#0d4ea2', secondaryColor: '#e30613', tier: 'mid',   reputation: 72, budget: 280000, squadSeed: 111 },
  { id: 'for', name: 'Fortaleza',        shortName: 'FOR', city: 'Fortaleza',      primaryColor: '#0d4ea2', secondaryColor: '#e30613', tier: 'mid',   reputation: 70, budget: 250000, squadSeed: 112 },
  { id: 'ath', name: 'Athletico-PR',     shortName: 'CAP', city: 'Curitiba',       primaryColor: '#e30613', secondaryColor: '#000000', tier: 'mid',   reputation: 73, budget: 270000, squadSeed: 113 },
  { id: 'vas', name: 'Vasco da Gama',    shortName: 'VAS', city: 'Rio de Janeiro', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 75, budget: 290000, squadSeed: 114 },
  { id: 'rbb', name: 'RB Bragantino',    shortName: 'BGT', city: 'Bragança Pta',   primaryColor: '#ffffff', secondaryColor: '#e30613', tier: 'mid',   reputation: 66, budget: 220000, squadSeed: 115 },
  { id: 'cri', name: 'Criciúma',         shortName: 'CRI', city: 'Criciúma',       primaryColor: '#ffd700', secondaryColor: '#000000', tier: 'low',   reputation: 58, budget: 140000, squadSeed: 116 },
  { id: 'jvt', name: 'Juventude',        shortName: 'JUV', city: 'Caxias do Sul',  primaryColor: '#0d4ea2', secondaryColor: '#1c5b3d', tier: 'low',   reputation: 56, budget: 130000, squadSeed: 117 },
  { id: 'cui', name: 'Cuiabá',           shortName: 'CUI', city: 'Cuiabá',         primaryColor: '#1c5b3d', secondaryColor: '#ffd700', tier: 'low',   reputation: 55, budget: 120000, squadSeed: 118 },
  { id: 'gpa', name: 'Goiás',            shortName: 'GOI', city: 'Goiânia',        primaryColor: '#1c5b3d', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 150000, squadSeed: 119 },
  { id: 'ava', name: 'Avaí',             shortName: 'AVA', city: 'Florianópolis',  primaryColor: '#0d4ea2', secondaryColor: '#ffffff', tier: 'low',   reputation: 54, budget: 110000, squadSeed: 120 },
];

export function buildBrasileiraoTeams(): Team[] {
  return SEEDS.map((seed) => {
    const squad = generateSquad(seed.tier, seed.squadSeed);
    const { starting, bench } = autoPickStartingEleven(squad, '4-3-3');
    return {
      id: seed.id,
      name: seed.name,
      shortName: seed.shortName,
      city: seed.city,
      country: 'BR',
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

export const BRASILEIRAO_TEAM_IDS = SEEDS.map((s) => s.id);

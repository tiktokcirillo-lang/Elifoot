import type { Team, TeamTier } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';
import {
  buildFlamengoSquad,
  buildPalmeirasSquad,
  buildCorinthiansSquad,
  buildSaoPauloSquad,
  buildFluminenseSquad,
  buildAtleticoMGSquad,
  buildBotafogoSquad,
  buildCruzeiroSquad,
  buildGremioSquad,
  buildInternacionalSquad,
  buildBahiaSquad,
  buildFortalezaSquad,
  buildAthleticoPRSquad,
  buildVascoSquad,
  buildBragantinoSquad,
  buildCriciumaSquad,
  buildJuventudeSquad,
  buildCuiabaSquad,
  buildGoiasSquad,
  buildAvaiSquad,
} from '@/data/realSquads';

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
  squadSeed?: number; // undefined = usa elenco real
}

// Os 20 do Brasileirão
const SEEDS: TeamSeed[] = [
  { id: 'fla', name: 'Flamengo',         shortName: 'FLA', city: 'Rio de Janeiro', primaryColor: '#e30613', secondaryColor: '#000000', tier: 'elite', reputation: 95, budget: 850000 },
  { id: 'pal', name: 'Palmeiras',        shortName: 'PAL', city: 'São Paulo',      primaryColor: '#006437', secondaryColor: '#ffffff', tier: 'elite', reputation: 94, budget: 820000 },
  { id: 'cor', name: 'Corinthians',      shortName: 'COR', city: 'São Paulo',      primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'top',   reputation: 90, budget: 600000 },
  { id: 'sao', name: 'São Paulo',        shortName: 'SAO', city: 'São Paulo',      primaryColor: '#ed2939', secondaryColor: '#000000', tier: 'top',   reputation: 88, budget: 580000 },
  { id: 'flu', name: 'Fluminense',       shortName: 'FLU', city: 'Rio de Janeiro', primaryColor: '#7a1f3d', secondaryColor: '#1c5b3d', tier: 'top',   reputation: 84, budget: 420000 },
  { id: 'atm', name: 'Atlético Mineiro', shortName: 'CAM', city: 'Belo Horizonte', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'top',   reputation: 86, budget: 510000 },
  { id: 'bot', name: 'Botafogo',         shortName: 'BOT', city: 'Rio de Janeiro', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'top',   reputation: 82, budget: 460000 },
  { id: 'cru', name: 'Cruzeiro',         shortName: 'CRU', city: 'Belo Horizonte', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'top',   reputation: 80, budget: 380000 },
  { id: 'gre', name: 'Grêmio',           shortName: 'GRE', city: 'Porto Alegre',   primaryColor: '#0d4ea2', secondaryColor: '#000000', tier: 'top',   reputation: 81, budget: 360000 },
  { id: 'int', name: 'Internacional',    shortName: 'INT', city: 'Porto Alegre',   primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'top',   reputation: 80, budget: 350000 },
  { id: 'bah', name: 'Bahia',            shortName: 'BAH', city: 'Salvador',       primaryColor: '#0d4ea2', secondaryColor: '#e30613', tier: 'mid',   reputation: 72, budget: 280000 },
  { id: 'for', name: 'Fortaleza',        shortName: 'FOR', city: 'Fortaleza',      primaryColor: '#0d4ea2', secondaryColor: '#e30613', tier: 'mid',   reputation: 70, budget: 250000 },
  { id: 'ath', name: 'Athletico-PR',     shortName: 'CAP', city: 'Curitiba',       primaryColor: '#e30613', secondaryColor: '#000000', tier: 'mid',   reputation: 73, budget: 270000 },
  { id: 'vas', name: 'Vasco da Gama',    shortName: 'VAS', city: 'Rio de Janeiro', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 75, budget: 290000 },
  { id: 'rbb', name: 'RB Bragantino',    shortName: 'BGT', city: 'Bragança Pta',   primaryColor: '#ffffff', secondaryColor: '#e30613', tier: 'mid',   reputation: 66, budget: 220000 },
  { id: 'cri', name: 'Criciúma',         shortName: 'CRI', city: 'Criciúma',       primaryColor: '#ffd700', secondaryColor: '#000000', tier: 'low',   reputation: 58, budget: 140000 },
  { id: 'jvt', name: 'Juventude',        shortName: 'JUV', city: 'Caxias do Sul',  primaryColor: '#0d4ea2', secondaryColor: '#1c5b3d', tier: 'low',   reputation: 56, budget: 130000 },
  { id: 'cui', name: 'Cuiabá',           shortName: 'CUI', city: 'Cuiabá',         primaryColor: '#1c5b3d', secondaryColor: '#ffd700', tier: 'low',   reputation: 55, budget: 120000 },
  { id: 'gpa', name: 'Goiás',            shortName: 'GOI', city: 'Goiânia',        primaryColor: '#1c5b3d', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 150000 },
  { id: 'ava', name: 'Avaí',             shortName: 'AVA', city: 'Florianópolis',  primaryColor: '#0d4ea2', secondaryColor: '#ffffff', tier: 'low',   reputation: 54, budget: 110000 },
];

// Mapa de builders de elencos reais por ID de time
const REAL_SQUAD_BUILDERS: Record<string, () => ReturnType<typeof buildFlamengoSquad>> = {
  fla: buildFlamengoSquad,
  pal: buildPalmeirasSquad,
  cor: buildCorinthiansSquad,
  sao: buildSaoPauloSquad,
  flu: buildFluminenseSquad,
  atm: buildAtleticoMGSquad,
  bot: buildBotafogoSquad,
  cru: buildCruzeiroSquad,
  gre: buildGremioSquad,
  int: buildInternacionalSquad,
  bah: buildBahiaSquad,
  for: buildFortalezaSquad,
  ath: buildAthleticoPRSquad,
  vas: buildVascoSquad,
  rbb: buildBragantinoSquad,
  cri: buildCriciumaSquad,
  jvt: buildJuventudeSquad,
  cui: buildCuiabaSquad,
  gpa: buildGoiasSquad,
  ava: buildAvaiSquad,
};

export function buildBrasileiraoTeams(): Team[] {
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

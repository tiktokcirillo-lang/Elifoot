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

// Times paulistas para o Campeonato Paulista (além dos BR: PAL, COR, SAO, RBB)
export const PAULISTAO_EXTRA_SEEDS: ExtraSeed[] = [
  { id: 'san', name: 'Santos',      shortName: 'SAN', city: 'Santos',   country: 'BR', primaryColor: '#ffffff', secondaryColor: '#000000', tier: 'top',  reputation: 80, budget: 360000, squadSeed: 401 },
  { id: 'pon', name: 'Ponte Preta', shortName: 'PON', city: 'Campinas', country: 'BR', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'low',  reputation: 57, budget: 130000, squadSeed: 402 },
  { id: 'gua', name: 'Guarani',     shortName: 'GUA', city: 'Campinas', country: 'BR', primaryColor: '#1c5b3d', secondaryColor: '#ffffff', tier: 'low',  reputation: 54, budget: 110000, squadSeed: 403 },
  { id: 'itu', name: 'Ituano',      shortName: 'ITU', city: 'Itu',      country: 'BR', primaryColor: '#e30613', secondaryColor: '#000000', tier: 'low',  reputation: 50, budget:  95000, squadSeed: 404 },
];

// Times sul-americanos para a Sul-Americana (diferentes dos da Libertadores)
export const SULAMERICANA_EXTRA_SEEDS: ExtraSeed[] = [
  { id: 'ied', name: 'Estudiantes',        shortName: 'EST', city: 'La Plata',      country: 'AR', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'mid', reputation: 72, budget: 160000, squadSeed: 501 },
  { id: 'rcl', name: 'Racing Club',        shortName: 'RAC', city: 'Buenos Aires',  country: 'AR', primaryColor: '#1c5b3d', secondaryColor: '#ffffff', tier: 'mid', reputation: 74, budget: 170000, squadSeed: 502 },
  { id: 'dpc', name: 'Deportivo Cali',     shortName: 'DCA', city: 'Cali',          country: 'CO', primaryColor: '#1c5b3d', secondaryColor: '#ffffff', tier: 'low', reputation: 62, budget: 110000, squadSeed: 503 },
  { id: 'mll', name: 'Millonarios',        shortName: 'MLL', city: 'Bogotá',        country: 'CO', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low', reputation: 65, budget: 120000, squadSeed: 504 },
  { id: 'scr', name: 'Sporting Cristal',   shortName: 'SCR', city: 'Lima',          country: 'PE', primaryColor: '#00a0e3', secondaryColor: '#ffffff', tier: 'low', reputation: 60, budget: 100000, squadSeed: 505 },
  { id: 'ali', name: 'Alianza Lima',       shortName: 'ALI', city: 'Lima',          country: 'PE', primaryColor: '#1a1a1a', secondaryColor: '#ffffff', tier: 'low', reputation: 61, budget: 105000, squadSeed: 506 },
  { id: 'eml', name: 'Emelec',             shortName: 'EME', city: 'Guayaquil',     country: 'EC', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low', reputation: 62, budget: 108000, squadSeed: 507 },
  { id: 'hur', name: 'Huracán',            shortName: 'HUR', city: 'Buenos Aires',  country: 'AR', primaryColor: '#ffffff', secondaryColor: '#e30613', tier: 'low', reputation: 63, budget: 112000, squadSeed: 508 },
  { id: 'cpo', name: 'Cerro Porteño',      shortName: 'CPO', city: 'Assunção',      country: 'PY', primaryColor: '#003da5', secondaryColor: '#e30613', tier: 'low', reputation: 64, budget: 115000, squadSeed: 509 },
  { id: 'dnj', name: 'Defensa y Justicia', shortName: 'DNJ', city: 'Buenos Aires',  country: 'AR', primaryColor: '#ffd700', secondaryColor: '#1c5b3d', tier: 'low', reputation: 66, budget: 125000, squadSeed: 510 },
];

// Representantes de confederações para o FIFA Mundial de Clubes
export const MUNDIAL_EXTRA_SEEDS: ExtraSeed[] = [
  { id: 'alh', name: 'Al-Hilal',           shortName: 'HIL', city: 'Riad',    country: 'SA', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'top', reputation: 82, budget: 800000, squadSeed: 601 },
  { id: 'ahl', name: 'Al-Ahly',            shortName: 'AHL', city: 'Cairo',   country: 'EG', primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'mid', reputation: 75, budget: 280000, squadSeed: 602 },
  { id: 'sel', name: 'Seattle Sounders',   shortName: 'SEA', city: 'Seattle', country: 'US', primaryColor: '#005695', secondaryColor: '#5d9741', tier: 'mid', reputation: 70, budget: 300000, squadSeed: 603 },
  { id: 'urw', name: 'Urawa Red Diamonds', shortName: 'URW', city: 'Saitama', country: 'JP', primaryColor: '#e30613', secondaryColor: '#000000', tier: 'mid', reputation: 68, budget: 250000, squadSeed: 604 },
];

// Seleções nacionais para a Copa do Mundo FIFA (a cada 4 temporadas)
export const COPA_MUNDO_SEEDS: ExtraSeed[] = [
  { id: 'nt_bra', name: 'Brasil',          shortName: 'BRA', city: 'Brasília',         country: 'BR', primaryColor: '#009c3b', secondaryColor: '#ffdf00', tier: 'elite', reputation: 95, budget: 0, squadSeed: 701 },
  { id: 'nt_arg', name: 'Argentina',       shortName: 'ARG', city: 'Buenos Aires',     country: 'AR', primaryColor: '#74acdf', secondaryColor: '#ffffff', tier: 'elite', reputation: 93, budget: 0, squadSeed: 702 },
  { id: 'nt_fra', name: 'França',          shortName: 'FRA', city: 'Paris',            country: 'FR', primaryColor: '#002395', secondaryColor: '#ffffff', tier: 'elite', reputation: 92, budget: 0, squadSeed: 703 },
  { id: 'nt_ger', name: 'Alemanha',        shortName: 'GER', city: 'Berlim',           country: 'DE', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'elite', reputation: 91, budget: 0, squadSeed: 704 },
  { id: 'nt_eng', name: 'Inglaterra',      shortName: 'ENG', city: 'Londres',          country: 'EN', primaryColor: '#ffffff', secondaryColor: '#003da5', tier: 'top',   reputation: 89, budget: 0, squadSeed: 705 },
  { id: 'nt_esp', name: 'Espanha',         shortName: 'ESP', city: 'Madri',            country: 'ES', primaryColor: '#c60b1e', secondaryColor: '#ffc400', tier: 'top',   reputation: 88, budget: 0, squadSeed: 706 },
  { id: 'nt_por', name: 'Portugal',        shortName: 'POR', city: 'Lisboa',           country: 'PT', primaryColor: '#006600', secondaryColor: '#e30613', tier: 'top',   reputation: 87, budget: 0, squadSeed: 707 },
  { id: 'nt_ned', name: 'Holanda',         shortName: 'NED', city: 'Amsterdã',         country: 'NL', primaryColor: '#ff6600', secondaryColor: '#003da5', tier: 'top',   reputation: 86, budget: 0, squadSeed: 708 },
  { id: 'nt_ita', name: 'Itália',          shortName: 'ITA', city: 'Roma',             country: 'IT', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'top',   reputation: 85, budget: 0, squadSeed: 709 },
  { id: 'nt_uru', name: 'Uruguai',         shortName: 'URU', city: 'Montevidéu',       country: 'UY', primaryColor: '#74acdf', secondaryColor: '#000000', tier: 'mid',   reputation: 80, budget: 0, squadSeed: 710 },
  { id: 'nt_col', name: 'Colômbia',        shortName: 'COL', city: 'Bogotá',           country: 'CO', primaryColor: '#fcd116', secondaryColor: '#003580', tier: 'mid',   reputation: 78, budget: 0, squadSeed: 711 },
  { id: 'nt_usa', name: 'Estados Unidos',  shortName: 'USA', city: 'Washington',       country: 'US', primaryColor: '#002868', secondaryColor: '#bf0a30', tier: 'mid',   reputation: 74, budget: 0, squadSeed: 712 },
  { id: 'nt_mex', name: 'México',          shortName: 'MEX', city: 'Cidade do México', country: 'MX', primaryColor: '#006847', secondaryColor: '#ffffff', tier: 'mid',   reputation: 73, budget: 0, squadSeed: 713 },
  { id: 'nt_jap', name: 'Japão',           shortName: 'JAP', city: 'Tóquio',           country: 'JP', primaryColor: '#003da5', secondaryColor: '#e30613', tier: 'mid',   reputation: 72, budget: 0, squadSeed: 714 },
  { id: 'nt_mar', name: 'Marrocos',        shortName: 'MAR', city: 'Rabat',            country: 'MA', primaryColor: '#c1272d', secondaryColor: '#006233', tier: 'mid',   reputation: 71, budget: 0, squadSeed: 715 },
  { id: 'nt_sen', name: 'Senegal',         shortName: 'SEN', city: 'Dacar',            country: 'SN', primaryColor: '#00853f', secondaryColor: '#ffd700', tier: 'mid',   reputation: 70, budget: 0, squadSeed: 716 },
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

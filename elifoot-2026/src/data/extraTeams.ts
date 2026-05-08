import type { Team, TeamTier, Player } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';
import {
  buildRealMadridSquad,
  buildBarcelonaSquad,
  buildManCitySquad,
  buildLiverpoolSquad,
  buildManUnitedSquad,
  buildArsenalSquad,
  buildChelseaSquad,
  buildPSGSquad,
  buildBayernSquad,
  buildDortmundSquad,
  buildJuventusSquad,
  buildInterSquad,
  buildMilanSquad,
  buildAtleticoMadridSquad,
  buildPortoSquad,
  buildBenficaSquad,
} from '@/data/realSquads';

const REAL_SQUAD_BUILDERS: Record<string, () => Player[]> = {
  rmd:    buildRealMadridSquad,
  bcn:    buildBarcelonaSquad,
  mci:    buildManCitySquad,
  liv:    buildLiverpoolSquad,
  mun:    buildManUnitedSquad,
  ars:    buildArsenalSquad,
  che:    buildChelseaSquad,
  psg:    buildPSGSquad,
  bay:    buildBayernSquad,
  bvb:    buildDortmundSquad,
  jve:    buildJuventusSquad,
  inm:    buildInterSquad,
  mil:    buildMilanSquad,
  atm_es: buildAtleticoMadridSquad,
  por:    buildPortoSquad,
  ben:    buildBenficaSquad,
};

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
// 12 extras + 4 BR = 16 times — 4 grupos de 4
export const PAULISTAO_EXTRA_SEEDS: ExtraSeed[] = [
  { id: 'san', name: 'Santos',           shortName: 'SAN', city: 'Santos',         country: 'BR', primaryColor: '#ffffff', secondaryColor: '#000000', tier: 'top',  reputation: 80, budget: 360000, squadSeed: 401 },
  { id: 'pon', name: 'Ponte Preta',      shortName: 'PON', city: 'Campinas',       country: 'BR', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'low',  reputation: 57, budget: 130000, squadSeed: 402 },
  { id: 'gua', name: 'Guarani',          shortName: 'GUA', city: 'Campinas',       country: 'BR', primaryColor: '#1c5b3d', secondaryColor: '#ffffff', tier: 'low',  reputation: 54, budget: 110000, squadSeed: 403 },
  { id: 'itu', name: 'Ituano',           shortName: 'ITU', city: 'Itu',            country: 'BR', primaryColor: '#e30613', secondaryColor: '#000000', tier: 'low',  reputation: 50, budget:  95000, squadSeed: 404 },
  { id: 'mir', name: 'Mirassol',         shortName: 'MIR', city: 'Mirassol',       country: 'BR', primaryColor: '#ffd700', secondaryColor: '#000000', tier: 'low',  reputation: 53, budget: 100000, squadSeed: 405 },
  { id: 'nov', name: 'Novorizontino',    shortName: 'NOV', city: 'Novo Horizonte', country: 'BR', primaryColor: '#000000', secondaryColor: '#e30613', tier: 'low',  reputation: 52, budget:  95000, squadSeed: 406 },
  { id: 'sbe', name: 'São Bernardo',     shortName: 'SBC', city: 'São Bernardo',   country: 'BR', primaryColor: '#0d4ea2', secondaryColor: '#ffffff', tier: 'low',  reputation: 51, budget:  90000, squadSeed: 407 },
  { id: 'ags', name: 'Água Santa',       shortName: 'AGS', city: 'Diadema',        country: 'BR', primaryColor: '#003da5', secondaryColor: '#ffd700', tier: 'low',  reputation: 49, budget:  85000, squadSeed: 408 },
  { id: 'ilm', name: 'Inter de Limeira', shortName: 'ILM', city: 'Limeira',        country: 'BR', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',  reputation: 48, budget:  80000, squadSeed: 409 },
  { id: 'psp', name: 'Portuguesa',       shortName: 'LUS', city: 'São Paulo',      country: 'BR', primaryColor: '#e30613', secondaryColor: '#1c5b3d', tier: 'low',  reputation: 55, budget: 110000, squadSeed: 410 },
  { id: 'bsp', name: 'Botafogo-SP',      shortName: 'BFC', city: 'Ribeirão Preto', country: 'BR', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'low',  reputation: 50, budget:  88000, squadSeed: 411 },
  { id: 'sad', name: 'Santo André',      shortName: 'AND', city: 'Santo André',    country: 'BR', primaryColor: '#000000', secondaryColor: '#e30613', tier: 'low',  reputation: 49, budget:  85000, squadSeed: 412 },
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

// Representantes de confederações para o FIFA Mundial de Clubes (32 times na vida real)
// No jogo simulamos 8 times — 1 vaga por confederação não coberta por BR/SA/EU + aleatorização por temporada
export const MUNDIAL_EXTRA_SEEDS: ExtraSeed[] = [
  // AFC (Ásia)
  { id: 'alh', name: 'Al-Hilal',             shortName: 'HIL', city: 'Riad',          country: 'SA', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'top', reputation: 83, budget: 850000, squadSeed: 601 },
  { id: 'urw', name: 'Urawa Red Diamonds',   shortName: 'URW', city: 'Saitama',       country: 'JP', primaryColor: '#e30613', secondaryColor: '#000000', tier: 'mid', reputation: 70, budget: 260000, squadSeed: 604 },
  { id: 'alns', name: 'Al-Nassr',            shortName: 'ANS', city: 'Riad',          country: 'SA', primaryColor: '#ffd700', secondaryColor: '#003da5', tier: 'top', reputation: 80, budget: 800000, squadSeed: 607 },
  { id: 'yhm',  name: 'Yokohama F. Marinos', shortName: 'YFM', city: 'Yokohama',      country: 'JP', primaryColor: '#003da5', secondaryColor: '#e30613', tier: 'mid', reputation: 68, budget: 240000, squadSeed: 608 },
  // CAF (África)
  { id: 'ahl', name: 'Al-Ahly',              shortName: 'AHL', city: 'Cairo',         country: 'EG', primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'mid', reputation: 76, budget: 290000, squadSeed: 602 },
  { id: 'sun', name: 'Mamelodi Sundowns',    shortName: 'SUN', city: 'Pretória',      country: 'ZA', primaryColor: '#ffd700', secondaryColor: '#003da5', tier: 'mid', reputation: 68, budget: 200000, squadSeed: 605 },
  { id: 'wyd', name: 'Wydad Casablanca',     shortName: 'WYD', city: 'Casablanca',    country: 'MA', primaryColor: '#e30613', secondaryColor: '#ffffff', tier: 'mid', reputation: 65, budget: 180000, squadSeed: 609 },
  // CONCACAF (América do Norte/Central)
  { id: 'sel', name: 'Seattle Sounders',     shortName: 'SEA', city: 'Seattle',       country: 'US', primaryColor: '#005695', secondaryColor: '#5d9741', tier: 'mid', reputation: 71, budget: 310000, squadSeed: 603 },
  { id: 'mty', name: 'Monterrey',            shortName: 'MTY', city: 'Monterrey',     country: 'MX', primaryColor: '#003da5', secondaryColor: '#e30613', tier: 'mid', reputation: 73, budget: 280000, squadSeed: 606 },
  { id: 'pch', name: 'Pachuca',              shortName: 'PAC', city: 'Pachuca',       country: 'MX', primaryColor: '#0d4ea2', secondaryColor: '#ffffff', tier: 'mid', reputation: 69, budget: 240000, squadSeed: 610 },
  // OFC (Oceania)
  { id: 'auc', name: 'Auckland City',        shortName: 'AKL', city: 'Auckland',      country: 'NZ', primaryColor: '#0d4ea2', secondaryColor: '#ffffff', tier: 'low', reputation: 55, budget: 100000, squadSeed: 611 },
];

// Seleções nacionais para a Copa do Mundo FIFA 2026 — 48 seleções
// UEFA (16): BRA, ARG, FRA, GER, ENG, ESP, POR, NED, ITA, CRO, BEL, SUI, DEN, AUT, SRB, POL
// CAF  (9):  MAR, SEN, NGA, EGY, CMR, CIV, GHA, ALG, TUN
// AFC  (8):  JAP, KOR, IRN, AUS, SAU, QAT, IDN, JOR
// CONMEBOL (6): BRA, ARG, URU, COL, CHI, ECU
// CONCACAF (6): USA, MEX, CAN, CRC, PAN, HON
// OFC  (1):  NZL
export const COPA_MUNDO_SEEDS: ExtraSeed[] = [
  // ── CONMEBOL ────────────────────────────────────────────────
  { id: 'nt_bra', name: 'Brasil',          shortName: 'BRA', city: 'Brasília',         country: 'BR', primaryColor: '#009c3b', secondaryColor: '#ffdf00', tier: 'elite', reputation: 95, budget: 0, squadSeed: 701 },
  { id: 'nt_arg', name: 'Argentina',       shortName: 'ARG', city: 'Buenos Aires',     country: 'AR', primaryColor: '#74acdf', secondaryColor: '#ffffff', tier: 'elite', reputation: 93, budget: 0, squadSeed: 702 },
  { id: 'nt_uru', name: 'Uruguai',         shortName: 'URU', city: 'Montevidéu',       country: 'UY', primaryColor: '#74acdf', secondaryColor: '#000000', tier: 'mid',   reputation: 80, budget: 0, squadSeed: 710 },
  { id: 'nt_col', name: 'Colômbia',        shortName: 'COL', city: 'Bogotá',           country: 'CO', primaryColor: '#fcd116', secondaryColor: '#003580', tier: 'mid',   reputation: 78, budget: 0, squadSeed: 711 },
  { id: 'nt_chi', name: 'Chile',           shortName: 'CHI', city: 'Santiago',         country: 'CL', primaryColor: '#d52b1e', secondaryColor: '#ffffff', tier: 'mid',   reputation: 72, budget: 0, squadSeed: 740 },
  { id: 'nt_ecu', name: 'Equador',         shortName: 'ECU', city: 'Quito',            country: 'EC', primaryColor: '#ffda00', secondaryColor: '#003580', tier: 'low',   reputation: 65, budget: 0, squadSeed: 741 },
  // ── UEFA ─────────────────────────────────────────────────────
  { id: 'nt_fra', name: 'França',          shortName: 'FRA', city: 'Paris',            country: 'FR', primaryColor: '#002395', secondaryColor: '#ffffff', tier: 'elite', reputation: 92, budget: 0, squadSeed: 703 },
  { id: 'nt_ger', name: 'Alemanha',        shortName: 'GER', city: 'Berlim',           country: 'DE', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'elite', reputation: 91, budget: 0, squadSeed: 704 },
  { id: 'nt_eng', name: 'Inglaterra',      shortName: 'ENG', city: 'Londres',          country: 'EN', primaryColor: '#ffffff', secondaryColor: '#003da5', tier: 'top',   reputation: 89, budget: 0, squadSeed: 705 },
  { id: 'nt_esp', name: 'Espanha',         shortName: 'ESP', city: 'Madri',            country: 'ES', primaryColor: '#c60b1e', secondaryColor: '#ffc400', tier: 'top',   reputation: 88, budget: 0, squadSeed: 706 },
  { id: 'nt_por', name: 'Portugal',        shortName: 'POR', city: 'Lisboa',           country: 'PT', primaryColor: '#006600', secondaryColor: '#e30613', tier: 'top',   reputation: 87, budget: 0, squadSeed: 707 },
  { id: 'nt_ned', name: 'Holanda',         shortName: 'NED', city: 'Amsterdã',         country: 'NL', primaryColor: '#ff6600', secondaryColor: '#003da5', tier: 'top',   reputation: 86, budget: 0, squadSeed: 708 },
  { id: 'nt_ita', name: 'Itália',          shortName: 'ITA', city: 'Roma',             country: 'IT', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'top',   reputation: 85, budget: 0, squadSeed: 709 },
  { id: 'nt_cro', name: 'Croácia',         shortName: 'CRO', city: 'Zagreb',           country: 'HR', primaryColor: '#ff0000', secondaryColor: '#ffffff', tier: 'top',   reputation: 83, budget: 0, squadSeed: 720 },
  { id: 'nt_bel', name: 'Bélgica',         shortName: 'BEL', city: 'Bruxelas',         country: 'BE', primaryColor: '#000000', secondaryColor: '#ed2939', tier: 'top',   reputation: 82, budget: 0, squadSeed: 721 },
  { id: 'nt_sui', name: 'Suíça',           shortName: 'SUI', city: 'Berna',            country: 'CH', primaryColor: '#ff0000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 77, budget: 0, squadSeed: 722 },
  { id: 'nt_den', name: 'Dinamarca',       shortName: 'DEN', city: 'Copenhague',       country: 'DK', primaryColor: '#c60c30', secondaryColor: '#ffffff', tier: 'mid',   reputation: 76, budget: 0, squadSeed: 723 },
  { id: 'nt_aut', name: 'Áustria',         shortName: 'AUT', city: 'Viena',            country: 'AT', primaryColor: '#ed2939', secondaryColor: '#ffffff', tier: 'mid',   reputation: 73, budget: 0, squadSeed: 724 },
  { id: 'nt_srb', name: 'Sérvia',          shortName: 'SRB', city: 'Belgrado',         country: 'RS', primaryColor: '#c6363c', secondaryColor: '#0c4076', tier: 'mid',   reputation: 72, budget: 0, squadSeed: 725 },
  { id: 'nt_pol', name: 'Polônia',         shortName: 'POL', city: 'Varsóvia',         country: 'PL', primaryColor: '#dc143c', secondaryColor: '#ffffff', tier: 'mid',   reputation: 71, budget: 0, squadSeed: 726 },
  // ── CONCACAF ─────────────────────────────────────────────────
  { id: 'nt_usa', name: 'Estados Unidos',  shortName: 'USA', city: 'Washington',       country: 'US', primaryColor: '#002868', secondaryColor: '#bf0a30', tier: 'mid',   reputation: 74, budget: 0, squadSeed: 712 },
  { id: 'nt_mex', name: 'México',          shortName: 'MEX', city: 'Cidade do México', country: 'MX', primaryColor: '#006847', secondaryColor: '#ffffff', tier: 'mid',   reputation: 73, budget: 0, squadSeed: 713 },
  { id: 'nt_can', name: 'Canadá',          shortName: 'CAN', city: 'Ottawa',           country: 'CA', primaryColor: '#ff0000', secondaryColor: '#ffffff', tier: 'mid',   reputation: 68, budget: 0, squadSeed: 742 },
  { id: 'nt_crc', name: 'Costa Rica',      shortName: 'CRC', city: 'San José',         country: 'CR', primaryColor: '#002B7F', secondaryColor: '#CE1126', tier: 'low',   reputation: 60, budget: 0, squadSeed: 743 },
  { id: 'nt_pan', name: 'Panamá',          shortName: 'PAN', city: 'Cidade do Panamá', country: 'PA', primaryColor: '#005293', secondaryColor: '#C30020', tier: 'low',   reputation: 58, budget: 0, squadSeed: 744 },
  { id: 'nt_hon', name: 'Honduras',        shortName: 'HON', city: 'Tegucigalpa',      country: 'HN', primaryColor: '#0073CF', secondaryColor: '#ffffff', tier: 'low',   reputation: 55, budget: 0, squadSeed: 745 },
  // ── AFC ──────────────────────────────────────────────────────
  { id: 'nt_jap', name: 'Japão',           shortName: 'JAP', city: 'Tóquio',           country: 'JP', primaryColor: '#003da5', secondaryColor: '#e30613', tier: 'mid',   reputation: 72, budget: 0, squadSeed: 714 },
  { id: 'nt_kor', name: 'Coreia do Sul',   shortName: 'KOR', city: 'Seul',             country: 'KR', primaryColor: '#c60c30', secondaryColor: '#003478', tier: 'mid',   reputation: 71, budget: 0, squadSeed: 730 },
  { id: 'nt_irn', name: 'Irã',             shortName: 'IRN', city: 'Teerã',            country: 'IR', primaryColor: '#239f40', secondaryColor: '#ffffff', tier: 'mid',   reputation: 68, budget: 0, squadSeed: 731 },
  { id: 'nt_aus', name: 'Austrália',       shortName: 'AUS', city: 'Sydney',           country: 'AU', primaryColor: '#ffcd00', secondaryColor: '#00843d', tier: 'mid',   reputation: 67, budget: 0, squadSeed: 732 },
  { id: 'nt_sau', name: 'Arábia Saudita',  shortName: 'SAU', city: 'Riade',            country: 'SA', primaryColor: '#007a3d', secondaryColor: '#ffffff', tier: 'low',   reputation: 63, budget: 0, squadSeed: 733 },
  { id: 'nt_qat', name: 'Catar',           shortName: 'QAT', city: 'Doha',             country: 'QA', primaryColor: '#8d1b3d', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 0, squadSeed: 734 },
  { id: 'nt_idn', name: 'Indonésia',       shortName: 'IDN', city: 'Jacarta',          country: 'ID', primaryColor: '#ce1126', secondaryColor: '#ffffff', tier: 'low',   reputation: 52, budget: 0, squadSeed: 735 },
  { id: 'nt_jor', name: 'Jordânia',        shortName: 'JOR', city: 'Amã',              country: 'JO', primaryColor: '#007a3d', secondaryColor: '#000000', tier: 'low',   reputation: 51, budget: 0, squadSeed: 736 },
  // ── CAF ──────────────────────────────────────────────────────
  { id: 'nt_mar', name: 'Marrocos',        shortName: 'MAR', city: 'Rabat',            country: 'MA', primaryColor: '#c1272d', secondaryColor: '#006233', tier: 'mid',   reputation: 71, budget: 0, squadSeed: 715 },
  { id: 'nt_sen', name: 'Senegal',         shortName: 'SEN', city: 'Dacar',            country: 'SN', primaryColor: '#00853f', secondaryColor: '#ffd700', tier: 'mid',   reputation: 70, budget: 0, squadSeed: 716 },
  { id: 'nt_nga', name: 'Nigéria',         shortName: 'NGA', city: 'Abuja',            country: 'NG', primaryColor: '#008751', secondaryColor: '#ffffff', tier: 'mid',   reputation: 69, budget: 0, squadSeed: 750 },
  { id: 'nt_egy', name: 'Egito',           shortName: 'EGY', city: 'Cairo',            country: 'EG', primaryColor: '#c8102e', secondaryColor: '#000000', tier: 'mid',   reputation: 67, budget: 0, squadSeed: 751 },
  { id: 'nt_cmr', name: 'Camarões',        shortName: 'CMR', city: 'Yaoundé',          country: 'CM', primaryColor: '#007a5e', secondaryColor: '#ce1126', tier: 'mid',   reputation: 65, budget: 0, squadSeed: 752 },
  { id: 'nt_civ', name: 'Costa do Marfim', shortName: 'CIV', city: 'Abidjan',          country: 'CI', primaryColor: '#f77f00', secondaryColor: '#009a44', tier: 'mid',   reputation: 64, budget: 0, squadSeed: 753 },
  { id: 'nt_gha', name: 'Gana',            shortName: 'GHA', city: 'Acra',             country: 'GH', primaryColor: '#006b3f', secondaryColor: '#fcd116', tier: 'low',   reputation: 63, budget: 0, squadSeed: 754 },
  { id: 'nt_alg', name: 'Argélia',         shortName: 'ALG', city: 'Argel',            country: 'DZ', primaryColor: '#006233', secondaryColor: '#ffffff', tier: 'low',   reputation: 62, budget: 0, squadSeed: 755 },
  { id: 'nt_tun', name: 'Tunísia',         shortName: 'TUN', city: 'Túnis',            country: 'TN', primaryColor: '#e70013', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 0, squadSeed: 756 },
  // ── Outros (para completar 48) ───────────────────────────────
  { id: 'nt_slo', name: 'Eslovênia',       shortName: 'SLO', city: 'Liubliana',        country: 'SI', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 58, budget: 0, squadSeed: 760 },
  { id: 'nt_sco', name: 'Escócia',         shortName: 'SCO', city: 'Glasgow',          country: 'GB', primaryColor: '#003da5', secondaryColor: '#ffffff', tier: 'low',   reputation: 62, budget: 0, squadSeed: 761 },
  { id: 'nt_tur', name: 'Turquia',         shortName: 'TUR', city: 'Ancara',           country: 'TR', primaryColor: '#e30a17', secondaryColor: '#ffffff', tier: 'mid',   reputation: 70, budget: 0, squadSeed: 762 },
  { id: 'nt_gre', name: 'Grécia',          shortName: 'GRE', city: 'Atenas',           country: 'GR', primaryColor: '#0d5eaf', secondaryColor: '#ffffff', tier: 'low',   reputation: 60, budget: 0, squadSeed: 763 },
  { id: 'nt_ven', name: 'Venezuela',       shortName: 'VEN', city: 'Caracas',          country: 'VE', primaryColor: '#cf142b', secondaryColor: '#003893', tier: 'low',   reputation: 55, budget: 0, squadSeed: 764 },
  { id: 'nt_per', name: 'Peru',            shortName: 'PER', city: 'Lima',             country: 'PE', primaryColor: '#d91023', secondaryColor: '#ffffff', tier: 'low',   reputation: 62, budget: 0, squadSeed: 765 },
  { id: 'nt_nzl', name: 'Nova Zelândia',   shortName: 'NZL', city: 'Wellington',       country: 'NZ', primaryColor: '#000000', secondaryColor: '#ffffff', tier: 'low',   reputation: 48, budget: 0, squadSeed: 766 },
  { id: 'nt_uzb', name: 'Uzbequistão',     shortName: 'UZB', city: 'Tashkent',         country: 'UZ', primaryColor: '#1eb53a', secondaryColor: '#0099b5', tier: 'low',   reputation: 50, budget: 0, squadSeed: 767 },
];

export function buildExtraTeams(seeds: ExtraSeed[]): Team[] {
  return seeds.map((seed) => {
    const squad = REAL_SQUAD_BUILDERS[seed.id]
      ? REAL_SQUAD_BUILDERS[seed.id]()
      : generateSquad(seed.tier, seed.squadSeed);
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

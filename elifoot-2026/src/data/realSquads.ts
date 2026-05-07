import { nanoid } from 'nanoid';
import type { Player, Position } from '@/types';

// ============================================================
// Elencos reais — temporada 2026 (atualizado maio/2026)
// ============================================================

function mkPlayer(
  name: string,
  age: number,
  pos: Position,
  atk: number,
  def: number,
  pac: number,
  tec: number,
  sta: number,
  pot: number,
  season = 2026,
): Player {
  const weights =
    pos === 'GK' ? { attack: 0.05, defense: 0.40, pace: 0.10, technique: 0.30, stamina: 0.15 }
    : pos === 'DF' ? { attack: 0.10, defense: 0.40, pace: 0.15, technique: 0.15, stamina: 0.20 }
    : pos === 'MF' ? { attack: 0.20, defense: 0.20, pace: 0.15, technique: 0.30, stamina: 0.15 }
    : { attack: 0.40, defense: 0.10, pace: 0.20, technique: 0.20, stamina: 0.10 };

  const overall = Math.min(99, Math.max(1, Math.round(
    atk * weights.attack + def * weights.defense +
    pac * weights.pace  + tec * weights.technique + sta * weights.stamina,
  )));

  return {
    id: nanoid(8),
    name,
    age,
    position: pos,
    foot: 'R',
    attack: atk, defense: def, pace: pac, technique: tec, stamina: sta,
    overall,
    potential: pot,
    morale: 75,
    fitness: 85,
    injuredUntil: undefined,
    yellowCardsInComp: {},
    appearancesInComp: {},
    contractUntil: season + 2,
    wageMonthly: Math.round(overall * 28),
    marketValue: Math.round(overall * 180),
    stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 },
  };
}

// ============================================================
// FLAMENGO
// ============================================================
export function buildFlamengoSquad(): Player[] {
  return [
    mkPlayer('Rossi',             30, 'GK', 28, 84, 55, 80, 75, 85),
    mkPlayer('Andrew',            27, 'GK', 22, 76, 52, 74, 72, 80),
    mkPlayer('Dyogo Alves',       22, 'GK', 20, 68, 50, 66, 66, 78),
    mkPlayer('Léo Pereira',       29, 'DF', 62, 83, 74, 73, 77, 83),
    mkPlayer('Léo Ortiz',         29, 'DF', 60, 82, 72, 74, 78, 84),
    mkPlayer('Danilo',            34, 'DF', 58, 78, 68, 72, 72, 78),
    mkPlayer('Vitão',             25, 'DF', 60, 76, 74, 70, 74, 82),
    mkPlayer('Varela',            33, 'DF', 67, 77, 75, 70, 73, 77),
    mkPlayer('Emerson Royal',     26, 'DF', 64, 75, 80, 72, 74, 80),
    mkPlayer('Alex Sandro',       34, 'DF', 64, 73, 72, 70, 70, 73),
    mkPlayer('Ayrton Lucas',      28, 'DF', 68, 74, 81, 76, 79, 80),
    mkPlayer('Erick Pulgar',      31, 'MF', 65, 79, 65, 76, 75, 77),
    mkPlayer('Lucas Paquetá',     28, 'MF', 82, 68, 78, 88, 78, 89),
    mkPlayer('Arrascaeta',        31, 'MF', 83, 65, 76, 88, 74, 86),
    mkPlayer('De la Cruz',        28, 'MF', 79, 70, 76, 86, 78, 87),
    mkPlayer('Jorge Carrascal',   29, 'MF', 76, 65, 74, 82, 74, 83),
    mkPlayer('Saúl',              31, 'MF', 68, 76, 70, 78, 76, 78),
    mkPlayer('Jorginho',          34, 'MF', 66, 72, 62, 80, 72, 74),
    mkPlayer('Pedro',             28, 'FW', 88, 52, 74, 84, 77, 88),
    mkPlayer('Everton Cebolinha', 29, 'FW', 83, 50, 88, 81, 77, 84),
    mkPlayer('Luiz Araújo',       28, 'FW', 82, 50, 85, 80, 75, 84),
    mkPlayer('Bruno Henrique',    35, 'FW', 80, 48, 84, 78, 68, 80),
    mkPlayer('Samuel Lino',       24, 'FW', 79, 50, 86, 77, 74, 84),
    mkPlayer('Gonzalo Plata',     26, 'FW', 80, 52, 87, 79, 75, 83),
  ];
}

// ============================================================
// PALMEIRAS
// ============================================================
export function buildPalmeirasSquad(): Player[] {
  return [
    mkPlayer('Carlos Miguel',     27, 'GK', 24, 82, 54, 78, 74, 84),
    mkPlayer('Marcelo Lomba',     38, 'GK', 20, 74, 48, 70, 70, 74),
    mkPlayer('Gustavo Gómez',     37, 'DF', 62, 84, 70, 76, 78, 84),
    mkPlayer('Murilo',            29, 'DF', 60, 82, 74, 74, 79, 84),
    mkPlayer('Bruno Fuchs',       26, 'DF', 58, 76, 72, 70, 74, 80),
    mkPlayer('Giay',              22, 'DF', 60, 72, 78, 70, 72, 83),
    mkPlayer('Piquerez',          28, 'DF', 68, 76, 80, 74, 78, 82),
    mkPlayer('Jefté',             23, 'DF', 62, 70, 78, 68, 72, 82),
    mkPlayer('Marlon Freitas',    30, 'MF', 70, 74, 72, 76, 78, 80),
    mkPlayer('Andreas Pereira',   29, 'MF', 78, 68, 74, 82, 76, 83),
    mkPlayer('Emiliano Martínez', 29, 'MF', 72, 72, 70, 76, 74, 78),
    mkPlayer('Mauricio',          26, 'MF', 76, 58, 78, 79, 74, 84),
    mkPlayer('Vitor Roque',       20, 'FW', 82, 50, 82, 78, 74, 90),
    mkPlayer('Paulinho',          24, 'FW', 82, 52, 80, 78, 76, 86),
    mkPlayer('Jhon Arias',        28, 'FW', 82, 52, 86, 80, 77, 85),
    mkPlayer('Ramón Sosa',        24, 'FW', 80, 50, 86, 78, 74, 85),
    mkPlayer('Felipe Anderson',   32, 'FW', 80, 52, 82, 80, 73, 80),
    mkPlayer('Flaco López',       26, 'FW', 84, 50, 75, 80, 76, 85),
  ];
}

// ============================================================
// CORINTHIANS
// ============================================================
export function buildCorinthiansSquad(): Player[] {
  return [
    mkPlayer('Hugo Souza',        25, 'GK', 22, 76, 52, 72, 70, 82),
    mkPlayer('Matheus Donelli',   24, 'GK', 20, 74, 50, 70, 68, 80),
    mkPlayer('Gabriel Paulista',  34, 'DF', 60, 80, 70, 72, 72, 80),
    mkPlayer('Gustavo Henrique',  33, 'DF', 58, 78, 68, 70, 70, 78),
    mkPlayer('André Ramalho',     31, 'DF', 60, 79, 70, 72, 74, 79),
    mkPlayer('Cacá',              26, 'DF', 60, 80, 72, 72, 77, 85),
    mkPlayer('Félix Torres',      29, 'DF', 60, 79, 70, 70, 76, 80),
    mkPlayer('Matheuzinho',       26, 'DF', 64, 72, 78, 70, 73, 82),
    mkPlayer('Matheus Bidu',      23, 'DF', 60, 68, 76, 66, 70, 80),
    mkPlayer('Angileri',          31, 'DF', 60, 70, 72, 68, 70, 72),
    mkPlayer('Rodrigo Garro',     28, 'MF', 78, 62, 72, 82, 73, 85),
    mkPlayer('Raniele',           27, 'MF', 62, 74, 70, 72, 76, 82),
    mkPlayer('Breno Bidon',       20, 'MF', 65, 68, 72, 74, 70, 85),
    mkPlayer('Charles',           28, 'MF', 68, 72, 70, 74, 77, 79),
    mkPlayer('Ryan',              27, 'MF', 70, 68, 74, 72, 76, 80),
    mkPlayer('Matheus Pereira',   28, 'MF', 76, 62, 74, 80, 72, 82),
    mkPlayer('Yuri Alberto',      24, 'FW', 83, 50, 78, 78, 75, 87),
    mkPlayer('Memphis Depay',     31, 'FW', 84, 52, 80, 83, 74, 84),
    mkPlayer('Vitinho',           26, 'FW', 76, 50, 84, 74, 72, 79),
    mkPlayer('Pedro Raul',        28, 'FW', 80, 50, 72, 74, 74, 81),
    mkPlayer('André Carrillo',    33, 'FW', 76, 52, 76, 74, 70, 76),
  ];
}

// ============================================================
// SÃO PAULO
// ============================================================
export function buildSaoPauloSquad(): Player[] {
  return [
    mkPlayer('Rafael',            36, 'GK', 24, 80, 50, 76, 72, 80),
    mkPlayer('Carlos Coronel',    30, 'GK', 22, 76, 50, 72, 70, 76),
    mkPlayer('Rafael Tolói',      35, 'DF', 58, 80, 70, 74, 72, 80),
    mkPlayer('Arboleda',          34, 'DF', 60, 82, 68, 72, 76, 82),
    mkPlayer('Alan Franco',       29, 'DF', 60, 80, 68, 70, 75, 80),
    mkPlayer('Matheus Dória',     32, 'DF', 58, 76, 68, 68, 72, 76),
    mkPlayer('Cédric Soares',     35, 'DF', 60, 72, 72, 68, 70, 72),
    mkPlayer('Wendell',           31, 'DF', 64, 72, 78, 70, 72, 74),
    mkPlayer('Enzo Díaz',         28, 'DF', 62, 70, 76, 70, 72, 76),
    mkPlayer('Pablo Maia',        23, 'MF', 65, 72, 70, 74, 74, 83),
    mkPlayer('Marcos Antônio',    25, 'MF', 68, 68, 72, 74, 74, 82),
    mkPlayer('Bobadilla',         31, 'MF', 68, 72, 68, 74, 76, 76),
    mkPlayer('Luciano',           32, 'MF', 76, 58, 72, 78, 73, 77),
    mkPlayer('Lucas Moura',       33, 'FW', 80, 52, 80, 82, 72, 81),
    mkPlayer('Calleri',           32, 'FW', 82, 52, 72, 78, 72, 82),
    mkPlayer('Ferreira',          29, 'FW', 78, 52, 80, 76, 73, 79),
    mkPlayer('André Silva',       30, 'FW', 80, 50, 74, 76, 74, 80),
    mkPlayer('Gonzalo Tapia',     27, 'FW', 76, 50, 82, 74, 72, 80),
  ];
}

// ============================================================
// FLUMINENSE
// ============================================================
export function buildFluminenseSquad(): Player[] {
  return [
    mkPlayer('Fábio',             44, 'GK', 20, 80, 45, 74, 68, 80),
    mkPlayer('Marcelo Pitaluga',  22, 'GK', 20, 72, 48, 68, 66, 80),
    mkPlayer('Jemmes',            23, 'DF', 56, 74, 72, 68, 70, 82),
    mkPlayer('Ignácio',           28, 'DF', 58, 78, 70, 70, 74, 80),
    mkPlayer('Juan P. Freytes',   22, 'DF', 56, 72, 70, 66, 68, 80),
    mkPlayer('Samuel Xavier',     33, 'DF', 64, 74, 76, 68, 72, 74),
    mkPlayer('Guga',              24, 'DF', 64, 72, 78, 68, 72, 82),
    mkPlayer('Guilherme Arana',   28, 'DF', 66, 74, 80, 72, 76, 80),
    mkPlayer('Renê',              32, 'DF', 60, 70, 74, 66, 70, 72),
    mkPlayer('Martinelli',        24, 'MF', 68, 66, 72, 74, 74, 84),
    mkPlayer('Facundo Bernal',    21, 'MF', 65, 62, 70, 72, 70, 84),
    mkPlayer('Nonato',            26, 'MF', 68, 66, 70, 72, 73, 79),
    mkPlayer('Ganso',             35, 'MF', 74, 58, 60, 84, 68, 79),
    mkPlayer('Lucho Acosta',      32, 'MF', 76, 60, 68, 82, 70, 78),
    mkPlayer('Lima',              24, 'MF', 70, 64, 74, 72, 74, 82),
    mkPlayer('Germán Cano',       38, 'FW', 82, 48, 68, 78, 70, 82),
    mkPlayer('Soteldo',           28, 'FW', 79, 50, 85, 79, 72, 81),
    mkPlayer('Kevin Serna',       25, 'FW', 78, 50, 84, 76, 73, 82),
    mkPlayer('Canobbio',          26, 'FW', 78, 50, 82, 76, 72, 80),
    mkPlayer('John Kennedy',      23, 'FW', 78, 50, 76, 74, 72, 84),
  ];
}

// ============================================================
// ATLÉTICO MINEIRO
// ============================================================
export function buildAtleticoMGSquad(): Player[] {
  return [
    mkPlayer('Gabriel Delfim',    27, 'GK', 22, 74, 50, 72, 68, 76),
    mkPlayer('Everson',           35, 'GK', 24, 80, 50, 76, 72, 80),
    mkPlayer('Iván Román',        27, 'DF', 58, 76, 72, 70, 72, 78),
    mkPlayer('Ruan Tressoldi',    26, 'DF', 60, 78, 72, 72, 74, 80),
    mkPlayer('Júnior Alonso',     34, 'DF', 58, 80, 68, 70, 72, 80),
    mkPlayer('Lyanco',            28, 'DF', 58, 78, 70, 70, 74, 79),
    mkPlayer('Vitor Hugo',        31, 'DF', 56, 76, 68, 68, 72, 76),
    mkPlayer('Natanael',          22, 'DF', 60, 68, 76, 66, 70, 82),
    mkPlayer('Ángelo Preciado',   26, 'DF', 62, 72, 78, 70, 72, 78),
    mkPlayer('Renan Lodi',        27, 'DF', 64, 72, 80, 72, 74, 78),
    mkPlayer('Alexsander',        22, 'MF', 65, 70, 72, 72, 72, 82),
    mkPlayer('Maycon',            29, 'MF', 66, 74, 70, 72, 76, 78),
    mkPlayer('Igor Gomes',        26, 'MF', 70, 66, 72, 74, 73, 80),
    mkPlayer('Reinier',           25, 'MF', 72, 60, 72, 78, 72, 80),
    mkPlayer('Gustavo Scarpa',    31, 'MF', 76, 62, 74, 80, 73, 79),
    mkPlayer('Bernard',           33, 'FW', 76, 58, 78, 80, 71, 76),
    mkPlayer('Hulk',              40, 'FW', 82, 50, 68, 78, 68, 82),
    mkPlayer('Mateo Cassierra',   26, 'FW', 80, 50, 82, 76, 74, 82),
    mkPlayer('Dudu',              36, 'FW', 78, 50, 76, 78, 70, 78),
    mkPlayer('Alan Minda',        25, 'FW', 76, 50, 82, 74, 72, 79),
  ];
}

// ============================================================
// BOTAFOGO
// ============================================================
export function buildBotafogoSquad(): Player[] {
  return [
    mkPlayer('John',              29, 'GK', 22, 79, 52, 74, 70, 80),
    mkPlayer('Roberto',           28, 'GK', 20, 74, 50, 70, 68, 76),
    mkPlayer('Lucas Perri',       24, 'GK', 20, 72, 48, 68, 66, 80),
    mkPlayer('Barboza',           29, 'DF', 58, 76, 68, 68, 72, 77),
    mkPlayer('Jair',              26, 'DF', 58, 74, 72, 68, 72, 78),
    mkPlayer('Lucas Halter',      25, 'DF', 58, 74, 70, 68, 70, 78),
    mkPlayer('Bastos',            30, 'DF', 56, 76, 68, 68, 70, 76),
    mkPlayer('Mateo Ponte',       22, 'DF', 62, 68, 78, 68, 70, 82),
    mkPlayer('Damián Suárez',     36, 'DF', 60, 72, 72, 68, 68, 72),
    mkPlayer('Hugo',              25, 'DF', 60, 68, 74, 66, 70, 78),
    mkPlayer('Fernando Marçal',   34, 'DF', 60, 70, 72, 66, 68, 70),
    mkPlayer('Gregore',           30, 'MF', 64, 76, 68, 70, 78, 78),
    mkPlayer('Patrick de Paula',  27, 'MF', 70, 70, 72, 74, 74, 78),
    mkPlayer('Allan',             31, 'MF', 62, 72, 66, 72, 72, 74),
    mkPlayer('Tchê Tchê',         31, 'MF', 68, 70, 70, 72, 74, 74),
    mkPlayer('Savarino',          27, 'FW', 80, 52, 84, 79, 75, 84),
    mkPlayer('Igor Jesus',        22, 'FW', 78, 50, 78, 74, 72, 86),
    mkPlayer('Tiquinho Soares',   34, 'FW', 81, 50, 72, 76, 70, 81),
    mkPlayer('Júnior Santos',     28, 'FW', 78, 50, 80, 75, 73, 79),
    mkPlayer('Carlos Eduardo',    25, 'FW', 76, 50, 78, 74, 72, 80),
  ];
}

// ============================================================
// CRUZEIRO
// ============================================================
export function buildCruzeiroSquad(): Player[] {
  return [
    mkPlayer('Cássio',            37, 'GK', 22, 80, 48, 74, 68, 80),
    mkPlayer('Matheus Cunha',     28, 'GK', 20, 74, 48, 70, 66, 76),
    mkPlayer('Fabrício Bruno',    28, 'DF', 60, 80, 72, 72, 76, 82),
    mkPlayer('Lucas Villalba',    26, 'DF', 58, 76, 74, 70, 72, 79),
    mkPlayer('João Marcelo',      20, 'DF', 56, 72, 70, 65, 70, 84),
    mkPlayer('William',           27, 'DF', 62, 76, 74, 68, 72, 79),
    mkPlayer('Fagner',            36, 'DF', 60, 72, 70, 68, 68, 72),
    mkPlayer('Kaiki Bruno',       22, 'DF', 60, 68, 76, 66, 68, 80),
    mkPlayer('Walace',            31, 'MF', 62, 74, 68, 70, 74, 74),
    mkPlayer('Lucas Silva',       32, 'MF', 62, 74, 66, 70, 74, 74),
    mkPlayer('Matheus Henrique',  26, 'MF', 70, 66, 70, 74, 73, 80),
    mkPlayer('Gerson',            28, 'MF', 72, 70, 72, 80, 76, 82),
    mkPlayer('Christian',         25, 'MF', 68, 64, 72, 76, 70, 78),
    mkPlayer('Matheus Pereira',   27, 'MF', 78, 60, 72, 82, 72, 83),
    mkPlayer('Luis Sinisterra',   25, 'FW', 80, 50, 86, 78, 74, 84),
    mkPlayer('Kaio Jorge',        23, 'FW', 78, 50, 78, 75, 72, 85),
    mkPlayer('Marquinhos',        24, 'FW', 76, 50, 80, 74, 72, 82),
    mkPlayer('Néiser Villarreal', 24, 'FW', 76, 50, 82, 74, 72, 80),
  ];
}

// ============================================================
// GRÊMIO
// ============================================================
export function buildGremioSquad(): Player[] {
  return [
    mkPlayer('Weverton',          38, 'GK', 25, 82, 52, 78, 73, 82),
    mkPlayer('Gabriel Grando',    24, 'GK', 20, 70, 48, 66, 66, 78),
    mkPlayer('Tiago Volpi',       34, 'GK', 20, 74, 48, 70, 68, 74),
    mkPlayer('Balbuena',          34, 'DF', 58, 80, 66, 70, 72, 80),
    mkPlayer('Wagner Leonardo',   27, 'DF', 58, 76, 72, 68, 72, 79),
    mkPlayer('Kannemann',         34, 'DF', 58, 80, 66, 68, 72, 80),
    mkPlayer('Rodrigo Ely',       31, 'DF', 58, 76, 68, 68, 72, 76),
    mkPlayer('Marcos Rocha',      37, 'DF', 60, 72, 72, 68, 68, 72),
    mkPlayer('João Pedro',        22, 'DF', 60, 70, 76, 66, 70, 82),
    mkPlayer('Marlon',            29, 'DF', 60, 70, 74, 66, 70, 74),
    mkPlayer('Caio Paulista',     28, 'DF', 62, 68, 78, 68, 72, 76),
    mkPlayer('Dodi',              31, 'MF', 66, 72, 68, 72, 75, 76),
    mkPlayer('Edenilson',         33, 'MF', 68, 68, 70, 72, 72, 72),
    mkPlayer('Arthur',            29, 'MF', 72, 68, 72, 80, 74, 80),
    mkPlayer('Villasanti',        28, 'MF', 65, 72, 68, 70, 76, 78),
    mkPlayer('Cuéllar',           34, 'MF', 62, 74, 66, 70, 72, 72),
    mkPlayer('Cristaldo',         25, 'MF', 74, 60, 74, 76, 72, 82),
    mkPlayer('Braithwaite',       34, 'FW', 78, 52, 76, 74, 70, 78),
    mkPlayer('Carlos Vinícius',   31, 'FW', 80, 50, 72, 74, 72, 80),
    mkPlayer('Cristian Pavón',    29, 'FW', 79, 50, 82, 76, 73, 79),
    mkPlayer('Amuzu',             25, 'FW', 76, 50, 86, 72, 72, 82),
  ];
}

// ============================================================
// INTERNACIONAL
// ============================================================
export function buildInternacionalSquad(): Player[] {
  return [
    mkPlayer('Sergio Rochet',     30, 'GK', 24, 80, 52, 76, 72, 80),
    mkPlayer('Anthoni',           25, 'GK', 20, 72, 48, 68, 66, 78),
    mkPlayer('Félix Torres',      29, 'DF', 60, 80, 70, 70, 76, 81),
    mkPlayer('Clayton Sampaio',   27, 'DF', 58, 74, 70, 68, 70, 76),
    mkPlayer('Juninho',           24, 'DF', 56, 70, 72, 66, 68, 78),
    mkPlayer('Gabriel Mercado',   35, 'DF', 58, 74, 66, 68, 68, 74),
    mkPlayer('Bruno Gomes',       25, 'DF', 60, 72, 76, 68, 70, 78),
    mkPlayer('Bernabei',          26, 'DF', 62, 70, 78, 70, 72, 78),
    mkPlayer('Matheus Bahia',     25, 'DF', 60, 70, 76, 68, 70, 76),
    mkPlayer('Rodrigo Villagra',  27, 'MF', 64, 72, 68, 72, 72, 76),
    mkPlayer('Thiago Maia',       27, 'MF', 62, 74, 68, 72, 74, 76),
    mkPlayer('Alan Patrick',      33, 'MF', 78, 62, 72, 82, 72, 82),
    mkPlayer('Bruno Tabata',      28, 'MF', 74, 60, 76, 78, 72, 78),
    mkPlayer('Richard',           26, 'MF', 66, 68, 72, 70, 70, 74),
    mkPlayer('Kayky',             22, 'FW', 76, 50, 84, 74, 72, 82),
    mkPlayer('Rafael Borré',      29, 'FW', 82, 50, 78, 76, 74, 82),
    mkPlayer('Johan Carbonero',   23, 'FW', 78, 50, 84, 74, 72, 82),
    mkPlayer('Vitinho',           28, 'FW', 76, 50, 82, 74, 72, 78),
    mkPlayer('Alerrandro',        26, 'FW', 76, 50, 74, 72, 72, 78),
  ];
}

// ============================================================
// BAHIA
// ============================================================
export function buildBahiaSquad(): Player[] {
  return [
    mkPlayer('Ronaldo',           32, 'GK', 22, 78, 50, 74, 70, 78),
    mkPlayer('Léo Vieira',        24, 'GK', 20, 70, 48, 66, 66, 76),
    mkPlayer('Kanu',              30, 'DF', 60, 80, 70, 72, 74, 80),
    mkPlayer('Gabriel Xavier',    24, 'DF', 58, 76, 72, 70, 72, 81),
    mkPlayer('David Duarte',      32, 'DF', 58, 76, 70, 68, 72, 76),
    mkPlayer('Ramos Mingo',       25, 'DF', 58, 74, 70, 68, 70, 78),
    mkPlayer('Gilberto',          32, 'DF', 60, 72, 74, 68, 70, 72),
    mkPlayer('Luciano Juba',      27, 'DF', 62, 68, 76, 68, 70, 74),
    mkPlayer('Nicolás Acevedo',   27, 'MF', 66, 72, 68, 74, 72, 76),
    mkPlayer('Jean Lucas',        27, 'MF', 66, 70, 70, 72, 72, 76),
    mkPlayer('Caio Alexandre',    26, 'MF', 66, 70, 72, 72, 72, 77),
    mkPlayer('Éverton Ribeiro',   36, 'MF', 76, 60, 70, 82, 68, 78),
    mkPlayer('Michel Araújo',     29, 'MF', 66, 66, 76, 74, 70, 76),
    mkPlayer('Erick Pulga',       24, 'FW', 80, 50, 86, 76, 74, 85),
    mkPlayer('Ademir',            30, 'FW', 78, 50, 84, 74, 72, 78),
    mkPlayer('Willian José',      32, 'FW', 78, 50, 72, 74, 72, 78),
    mkPlayer('Everaldo',          31, 'FW', 74, 50, 78, 72, 70, 74),
    mkPlayer('Kike Olivera',      27, 'FW', 74, 50, 76, 72, 70, 76),
  ];
}

// ============================================================
// ATHLETICO-PR
// ============================================================
export function buildAthleticoPRSquad(): Player[] {
  return [
    mkPlayer('Mycael',            22, 'GK', 20, 76, 50, 72, 68, 82),
    mkPlayer('Santos',            28, 'GK', 20, 72, 48, 68, 66, 74),
    mkPlayer('Carlos Terán',      24, 'DF', 58, 76, 72, 70, 72, 80),
    mkPlayer('Arthur Dias',       24, 'DF', 56, 74, 70, 68, 70, 78),
    mkPlayer('Juan Felipe',       29, 'DF', 58, 74, 68, 68, 70, 76),
    mkPlayer('Léo',               27, 'DF', 58, 74, 70, 68, 70, 76),
    mkPlayer('Lucas Esquivel',    24, 'DF', 60, 68, 76, 66, 68, 78),
    mkPlayer('Léo Derik',         22, 'DF', 58, 66, 74, 64, 66, 79),
    mkPlayer('Luiz Gustavo',      35, 'MF', 62, 74, 64, 72, 72, 72),
    mkPlayer('João Cruz',         25, 'MF', 64, 68, 70, 70, 70, 76),
    mkPlayer('Alejandro García',  25, 'MF', 64, 68, 72, 72, 70, 75),
    mkPlayer('Portilla',          27, 'MF', 66, 66, 72, 72, 70, 74),
    mkPlayer('Zapelli',           22, 'MF', 68, 60, 74, 76, 68, 80),
    mkPlayer('Steven Mendoza',    27, 'FW', 78, 50, 84, 74, 72, 80),
    mkPlayer('Kevin Viveros',     24, 'FW', 76, 50, 80, 72, 70, 80),
    mkPlayer('Julimar',           27, 'FW', 74, 50, 80, 72, 70, 76),
    mkPlayer('Isaac',             22, 'FW', 72, 50, 80, 70, 68, 80),
  ];
}

// ============================================================
// VASCO
// ============================================================
export function buildVascoSquad(): Player[] {
  return [
    mkPlayer('Léo Jardim',        29, 'GK', 22, 78, 50, 74, 70, 78),
    mkPlayer('Daniel Fuzato',     28, 'GK', 20, 74, 48, 70, 68, 74),
    mkPlayer('Alan Saldivia',     25, 'DF', 58, 74, 72, 70, 70, 78),
    mkPlayer('Robert Renan',      22, 'DF', 56, 72, 72, 68, 68, 82),
    mkPlayer('Carlos Cuesta',     27, 'DF', 58, 76, 70, 68, 70, 78),
    mkPlayer('Lucas Piton',       25, 'DF', 62, 70, 78, 70, 72, 79),
    mkPlayer('Puma Rodríguez',    28, 'DF', 60, 72, 76, 68, 70, 74),
    mkPlayer('Thiago Mendes',     33, 'MF', 62, 74, 66, 72, 72, 74),
    mkPlayer('Hugo Moura',        26, 'MF', 62, 70, 68, 70, 70, 74),
    mkPlayer('Jair',              27, 'MF', 66, 68, 72, 72, 70, 76),
    mkPlayer('Tchê Tchê',         31, 'MF', 66, 70, 70, 72, 72, 73),
    mkPlayer('Matheus França',    22, 'MF', 74, 60, 74, 80, 70, 84),
    mkPlayer('Johan Rojas',       24, 'FW', 78, 50, 86, 74, 72, 82),
    mkPlayer('Andrés Gómez',      24, 'FW', 74, 50, 78, 72, 70, 78),
    mkPlayer('Brenner',           25, 'FW', 78, 50, 78, 74, 72, 80),
    mkPlayer('David',             28, 'FW', 78, 50, 80, 74, 72, 78),
    mkPlayer('Adson',             27, 'FW', 74, 50, 78, 74, 70, 76),
    mkPlayer('Marino Hinestroza', 27, 'FW', 74, 50, 82, 72, 70, 76),
  ];
}

// ============================================================
// RB BRAGANTINO
// ============================================================
export function buildBragantinoSquad(): Player[] {
  return [
    mkPlayer('Cleiton',           28, 'GK', 22, 78, 50, 74, 70, 80),
    mkPlayer('Guzmán Rodríguez',  26, 'DF', 58, 74, 72, 68, 70, 78),
    mkPlayer('Eduardo Santos',    24, 'DF', 56, 72, 70, 66, 68, 78),
    mkPlayer('Alix Vinicius',     23, 'DF', 56, 70, 72, 66, 68, 80),
    mkPlayer('Pedro Henrique',    25, 'DF', 56, 72, 70, 66, 68, 76),
    mkPlayer('Andrés Hurtado',    24, 'DF', 58, 68, 76, 66, 68, 78),
    mkPlayer('Juninho Capixaba',  29, 'DF', 60, 68, 74, 66, 68, 72),
    mkPlayer('Fabinho',           27, 'MF', 64, 72, 68, 70, 72, 74),
    mkPlayer('Gabriel',           26, 'MF', 64, 68, 70, 70, 70, 74),
    mkPlayer('Eric Ramires',      24, 'MF', 64, 66, 72, 70, 70, 76),
    mkPlayer('Nacho Sosa',        25, 'MF', 66, 64, 74, 72, 70, 76),
    mkPlayer('Eduardo Sasha',     31, 'MF', 72, 64, 72, 74, 70, 74),
    mkPlayer('Isidro Pitta',      27, 'FW', 76, 50, 76, 72, 72, 78),
    mkPlayer('Fernando',          27, 'FW', 74, 50, 78, 72, 70, 76),
    mkPlayer('Vinicinho',         22, 'FW', 72, 50, 82, 70, 68, 80),
    mkPlayer('Lucas Barbosa',     26, 'FW', 74, 50, 78, 72, 70, 76),
  ];
}

// ============================================================
// FORTALEZA
// ============================================================
export function buildFortalezaSquad(): Player[] {
  return [
    mkPlayer('João Ricardo',      33, 'GK', 22, 78, 48, 74, 70, 78),
    mkPlayer('Brenno',            25, 'GK', 20, 72, 48, 68, 66, 78),
    mkPlayer('Emanuel Brítez',    30, 'DF', 58, 76, 68, 68, 72, 76),
    mkPlayer('Tomás Cardona',     26, 'DF', 56, 74, 70, 66, 70, 76),
    mkPlayer('Luan Freitas',      24, 'DF', 54, 70, 70, 64, 68, 76),
    mkPlayer('Maílton',           27, 'DF', 60, 68, 76, 66, 68, 74),
    mkPlayer('Gabriel Fuentes',   24, 'DF', 60, 70, 74, 66, 70, 76),
    mkPlayer('Diogo Barbosa',     31, 'DF', 60, 70, 72, 66, 68, 71),
    mkPlayer('Ronald',            26, 'MF', 64, 68, 70, 70, 70, 74),
    mkPlayer('Pierre',            33, 'MF', 62, 70, 66, 70, 70, 72),
    mkPlayer('Matheus Rossetto',  30, 'MF', 66, 68, 68, 70, 70, 72),
    mkPlayer('Tomás Pochettino',  25, 'MF', 72, 60, 70, 76, 68, 78),
    mkPlayer('Lucas Crispim',     30, 'MF', 70, 58, 72, 76, 68, 74),
    mkPlayer('Luiz Fernando',     29, 'FW', 74, 50, 78, 72, 70, 74),
    mkPlayer('Vitinho',           28, 'FW', 72, 50, 78, 70, 68, 72),
    mkPlayer('Juan Miritello',    26, 'FW', 72, 50, 72, 70, 70, 74),
  ];
}

// ============================================================
// SANTOS
// ============================================================
export function buildSantosSquad(): Player[] {
  return [
    mkPlayer('Gabriel Brazão',    24, 'GK', 22, 76, 50, 72, 68, 80),
    mkPlayer('Diógenes',          27, 'GK', 20, 72, 48, 68, 66, 74),
    mkPlayer('Lucas Veríssimo',   30, 'DF', 58, 80, 70, 72, 74, 80),
    mkPlayer('Luan Peres',        28, 'DF', 56, 76, 70, 68, 72, 78),
    mkPlayer('Zé Ivaldo',         27, 'DF', 56, 74, 70, 68, 70, 76),
    mkPlayer('Igor Vinícius',     28, 'DF', 60, 68, 76, 68, 70, 74),
    mkPlayer('Gonzalo Escobar',   28, 'DF', 58, 68, 72, 68, 68, 72),
    mkPlayer('João Schmidt',      26, 'MF', 62, 72, 68, 70, 72, 74),
    mkPlayer('Willian Arão',      34, 'MF', 60, 74, 64, 70, 70, 72),
    mkPlayer('Christian Oliva',   28, 'MF', 62, 72, 68, 70, 70, 74),
    mkPlayer('Zé Rafael',         34, 'MF', 66, 68, 66, 70, 68, 70),
    mkPlayer('Gabriel Menino',    24, 'MF', 68, 68, 74, 72, 70, 78),
    mkPlayer('Thaciano',          29, 'MF', 70, 64, 72, 74, 70, 74),
    mkPlayer('Neymar',            34, 'FW', 88, 48, 80, 92, 68, 90),
    mkPlayer('Gabigol',           29, 'FW', 86, 50, 78, 82, 72, 86),
    mkPlayer('Rony',              31, 'FW', 78, 50, 82, 74, 72, 78),
    mkPlayer('Benjamín Rollheiser',27, 'FW', 78, 50, 82, 74, 72, 78),
    mkPlayer('Álvaro Barreal',    26, 'FW', 76, 50, 80, 74, 70, 77),
  ];
}

// ============================================================
// REAL MADRID
// ============================================================
export function buildRealMadridSquad(): Player[] {
  return [
    mkPlayer('Courtois',          33, 'GK', 30, 90, 58, 88, 80, 90),
    mkPlayer('Andriy Lunin',      26, 'GK', 26, 84, 56, 80, 74, 84),
    mkPlayer('Trent A-Arnold',    27, 'DF', 76, 78, 82, 84, 80, 86),
    mkPlayer('Éder Militão',      28, 'DF', 62, 88, 80, 78, 80, 88),
    mkPlayer('Dean Huijsen',      21, 'DF', 58, 82, 80, 76, 76, 90),
    mkPlayer('Álvaro Carreras',   23, 'DF', 58, 76, 82, 74, 74, 85),
    mkPlayer('Antonio Rüdiger',   33, 'DF', 60, 84, 78, 74, 76, 84),
    mkPlayer('Ferland Mendy',     30, 'DF', 62, 78, 82, 74, 78, 79),
    mkPlayer('Tchouaméni',        26, 'MF', 72, 80, 76, 80, 80, 85),
    mkPlayer('Valverde',          27, 'MF', 80, 76, 82, 82, 84, 87),
    mkPlayer('Bellingham',        22, 'MF', 84, 74, 82, 86, 82, 94),
    mkPlayer('Camavinga',         23, 'MF', 72, 76, 80, 80, 78, 90),
    mkPlayer('Arda Güler',        20, 'MF', 76, 60, 74, 84, 72, 92),
    mkPlayer('Rodrygo',           25, 'FW', 84, 52, 88, 84, 78, 88),
    mkPlayer('Mbappé',            27, 'FW', 92, 52, 98, 90, 82, 96),
    mkPlayer('Vinícius Júnior',   25, 'FW', 90, 52, 96, 88, 80, 95),
    mkPlayer('Endrick',           19, 'FW', 78, 50, 82, 78, 74, 94),
  ];
}

// ============================================================
// BARCELONA
// ============================================================
export function buildBarcelonaSquad(): Player[] {
  return [
    mkPlayer('Joan García',       24, 'GK', 26, 84, 52, 80, 74, 88),
    mkPlayer('Szczęsny',          36, 'GK', 24, 82, 50, 78, 72, 82),
    mkPlayer('Jules Koundé',      28, 'DF', 64, 84, 82, 80, 80, 86),
    mkPlayer('Pau Cubarsí',       18, 'DF', 56, 80, 78, 76, 72, 95),
    mkPlayer('Ronald Araújo',     26, 'DF', 62, 86, 78, 78, 80, 88),
    mkPlayer('Alejandro Balde',   22, 'DF', 60, 78, 84, 78, 76, 88),
    mkPlayer('Frenkie de Jong',   29, 'MF', 74, 76, 76, 84, 80, 85),
    mkPlayer('Pedri',             23, 'MF', 80, 70, 78, 90, 78, 94),
    mkPlayer('Gavi',              22, 'MF', 72, 72, 76, 86, 82, 90),
    mkPlayer('Fermín López',      23, 'MF', 76, 66, 78, 82, 76, 88),
    mkPlayer('Lamine Yamal',      18, 'FW', 84, 50, 90, 90, 76, 98),
    mkPlayer('Dani Olmo',         27, 'MF', 80, 68, 80, 86, 78, 86),
    mkPlayer('Raphinha',          29, 'FW', 84, 52, 88, 84, 78, 86),
    mkPlayer('Lewandowski',       37, 'FW', 88, 50, 70, 84, 76, 88),
    mkPlayer('Ferran Torres',     25, 'FW', 80, 52, 84, 80, 74, 83),
    mkPlayer('Marcus Rashford',   28, 'FW', 82, 52, 88, 80, 78, 84),
  ];
}

// ============================================================
// MANCHESTER CITY
// ============================================================
export function buildManCitySquad(): Player[] {
  return [
    mkPlayer('Ederson',           33, 'GK', 26, 88, 62, 84, 80, 88),
    mkPlayer('Stefan Ortega',     33, 'GK', 22, 80, 52, 76, 72, 80),
    mkPlayer('Rico Lewis',        21, 'DF', 62, 78, 78, 76, 74, 88),
    mkPlayer('Rúben Dias',        28, 'DF', 62, 90, 76, 80, 82, 90),
    mkPlayer('Joško Gvardiol',    23, 'DF', 62, 84, 78, 78, 78, 90),
    mkPlayer('Manuel Akanji',     30, 'DF', 60, 84, 76, 76, 78, 84),
    mkPlayer('Nathan Aké',        31, 'DF', 60, 82, 76, 76, 76, 82),
    mkPlayer('Rodri',             30, 'MF', 72, 88, 74, 88, 84, 90),
    mkPlayer('Tijjani Reijnders', 27, 'MF', 78, 76, 76, 82, 80, 86),
    mkPlayer('Phil Foden',        26, 'MF', 86, 64, 84, 90, 80, 92),
    mkPlayer('Bernardo Silva',    31, 'MF', 80, 70, 80, 88, 80, 87),
    mkPlayer('İlkay Gündoğan',    36, 'MF', 76, 72, 70, 84, 76, 82),
    mkPlayer('Savinho',           22, 'FW', 82, 52, 92, 84, 76, 90),
    mkPlayer('Erling Haaland',    26, 'FW', 96, 52, 90, 80, 82, 97),
    mkPlayer('Omar Marmoush',     26, 'FW', 84, 52, 84, 80, 78, 87),
    mkPlayer('Jérémy Doku',       24, 'FW', 80, 50, 94, 78, 74, 88),
  ];
}

// ============================================================
// LIVERPOOL
// ============================================================
export function buildLiverpoolSquad(): Player[] {
  return [
    mkPlayer('Alisson Becker',    33, 'GK', 28, 90, 58, 84, 80, 90),
    mkPlayer('Mamardashvili',     25, 'GK', 24, 84, 52, 78, 74, 88),
    mkPlayer('Jeremie Frimpong',  25, 'DF', 64, 76, 90, 78, 80, 85),
    mkPlayer('Virgil van Dijk',   35, 'DF', 62, 90, 78, 82, 82, 90),
    mkPlayer('Ibrahima Konaté',   26, 'DF', 60, 88, 82, 76, 78, 88),
    mkPlayer('Milos Kerkez',      22, 'DF', 58, 76, 82, 74, 74, 87),
    mkPlayer('Andy Robertson',    32, 'DF', 64, 78, 82, 76, 80, 80),
    mkPlayer('Conor Bradley',     22, 'DF', 62, 74, 80, 74, 72, 85),
    mkPlayer('Ryan Gravenberch',  23, 'MF', 74, 78, 78, 82, 80, 90),
    mkPlayer('Alexis Mac Allister',27,'MF', 76, 76, 78, 84, 80, 86),
    mkPlayer('Dominik Szoboszlai',25, 'MF', 80, 70, 80, 84, 80, 88),
    mkPlayer('Florian Wirtz',     23, 'MF', 84, 64, 82, 90, 78, 95),
    mkPlayer('Mohamed Salah',     34, 'FW', 90, 52, 88, 88, 78, 91),
    mkPlayer('Alexander Isak',    27, 'FW', 90, 52, 88, 84, 78, 92),
    mkPlayer('Cody Gakpo',        26, 'FW', 82, 52, 84, 80, 76, 85),
    mkPlayer('Hugo Ekitike',      23, 'FW', 80, 50, 86, 78, 74, 88),
  ];
}

// ============================================================
// PARIS SAINT-GERMAIN
// ============================================================
export function buildPSGSquad(): Player[] {
  return [
    mkPlayer('Lucas Chevalier',   26, 'GK', 24, 84, 52, 80, 74, 88),
    mkPlayer('Matvey Safonov',    26, 'GK', 22, 80, 50, 74, 70, 82),
    mkPlayer('Marquinhos',        31, 'DF', 62, 88, 78, 82, 80, 88),
    mkPlayer('Lucas Beraldo',     22, 'DF', 58, 80, 76, 74, 72, 88),
    mkPlayer('Zabarnyi',          24, 'DF', 58, 82, 76, 74, 74, 86),
    mkPlayer('Willian Pacho',     26, 'DF', 60, 82, 74, 74, 74, 85),
    mkPlayer('Achraf Hakimi',     27, 'DF', 74, 78, 90, 82, 82, 88),
    mkPlayer('Nuno Mendes',       24, 'DF', 60, 76, 86, 78, 78, 87),
    mkPlayer('Vitinha',           26, 'MF', 72, 78, 78, 86, 80, 88),
    mkPlayer('João Neves',        21, 'MF', 70, 76, 78, 82, 78, 92),
    mkPlayer('Warren Zaïre-Emery',21, 'MF', 74, 72, 80, 82, 78, 92),
    mkPlayer('Fabián Ruiz',       29, 'MF', 78, 72, 74, 84, 78, 84),
    mkPlayer('Kvaratskhelia',     24, 'FW', 88, 52, 88, 90, 78, 93),
    mkPlayer('Dembélé',           29, 'FW', 86, 52, 92, 86, 78, 87),
    mkPlayer('Bradley Barcola',   23, 'FW', 82, 52, 90, 80, 76, 89),
    mkPlayer('Gonçalo Ramos',     24, 'FW', 84, 52, 78, 80, 76, 87),
  ];
}

// ============================================================
// BAYERN MUNIQUE
// ============================================================
export function buildBayernSquad(): Player[] {
  return [
    mkPlayer('Manuel Neuer',      40, 'GK', 28, 86, 56, 86, 78, 86),
    mkPlayer('Jonas Urbig',       23, 'GK', 22, 78, 52, 74, 70, 84),
    mkPlayer('Joshua Kimmich',    31, 'DF', 72, 80, 78, 82, 82, 85),
    mkPlayer('Dayot Upamecano',   27, 'DF', 60, 84, 82, 76, 78, 87),
    mkPlayer('Kim Min-jae',       30, 'DF', 60, 86, 78, 76, 80, 87),
    mkPlayer('Alphonso Davies',   26, 'DF', 62, 78, 94, 78, 82, 88),
    mkPlayer('Josip Stanišić',    26, 'DF', 60, 76, 78, 72, 74, 80),
    mkPlayer('Raphaël Guerreiro', 31, 'DF', 64, 74, 80, 76, 76, 79),
    mkPlayer('Aleksandar Pavlović',21,'MF', 70, 76, 76, 80, 78, 88),
    mkPlayer('João Palhinha',     30, 'MF', 62, 84, 72, 76, 80, 84),
    mkPlayer('Jamal Musiala',     23, 'MF', 84, 64, 84, 90, 80, 95),
    mkPlayer('Michael Olise',     24, 'MF', 82, 60, 86, 86, 76, 90),
    mkPlayer('Kingsley Coman',    30, 'FW', 82, 52, 90, 82, 76, 83),
    mkPlayer('Harry Kane',        33, 'FW', 94, 52, 80, 88, 80, 94),
    mkPlayer('Leroy Sané',        30, 'FW', 82, 52, 90, 84, 76, 84),
    mkPlayer('Luis Díaz',         28, 'FW', 82, 52, 88, 82, 78, 86),
  ];
}

// ============================================================
// BORUSSIA DORTMUND
// ============================================================
export function buildDortmundSquad(): Player[] {
  return [
    mkPlayer('Gregor Kobel',      28, 'GK', 24, 84, 54, 80, 76, 86),
    mkPlayer('Alexander Meyer',   33, 'GK', 22, 76, 50, 72, 70, 76),
    mkPlayer('Julian Ryerson',    28, 'DF', 60, 74, 80, 72, 74, 78),
    mkPlayer('Waldemar Anton',    29, 'DF', 58, 80, 76, 72, 76, 80),
    mkPlayer('Nico Schlotterbeck',26, 'DF', 58, 82, 76, 74, 76, 84),
    mkPlayer('Ramy Bensebaini',   30, 'DF', 60, 76, 78, 72, 74, 78),
    mkPlayer('Niklas Süle',       30, 'DF', 58, 82, 74, 72, 76, 82),
    mkPlayer('Yan Couto',         23, 'DF', 60, 72, 82, 72, 72, 84),
    mkPlayer('Pascal Groß',       34, 'MF', 72, 72, 72, 78, 76, 76),
    mkPlayer('Felix Nmecha',      25, 'MF', 72, 72, 74, 76, 76, 82),
    mkPlayer('Marcel Sabitzer',   32, 'MF', 76, 70, 74, 78, 76, 78),
    mkPlayer('Julian Brandt',     30, 'MF', 80, 64, 78, 84, 76, 83),
    mkPlayer('Karim Adeyemi',     24, 'FW', 82, 52, 92, 78, 76, 86),
    mkPlayer('Jamie Bynoe-Gittens',21,'FW', 78, 52, 88, 80, 74, 88),
    mkPlayer('Serhou Guirassy',   29, 'FW', 86, 52, 78, 78, 78, 86),
    mkPlayer('Maximilian Beier',  23, 'FW', 78, 52, 82, 76, 74, 84),
  ];
}

// ============================================================
// JUVENTUS
// ============================================================
export function buildJuventusSquad(): Player[] {
  return [
    mkPlayer('Michele Di Gregorio',27,'GK', 24, 82, 52, 78, 72, 84),
    mkPlayer('Mattia Perin',      33, 'GK', 22, 76, 50, 72, 68, 76),
    mkPlayer('Andrea Cambiaso',   25, 'DF', 64, 78, 80, 76, 78, 86),
    mkPlayer('Gleison Bremer',    28, 'DF', 60, 86, 78, 76, 80, 87),
    mkPlayer('Pierre Kalulu',     25, 'DF', 60, 82, 80, 76, 76, 86),
    mkPlayer('Juan Cabal',        24, 'DF', 60, 74, 80, 72, 74, 84),
    mkPlayer('Federico Gatti',    27, 'DF', 58, 80, 76, 72, 76, 82),
    mkPlayer('Manuel Locatelli',  28, 'MF', 68, 80, 72, 80, 78, 82),
    mkPlayer('Khéphren Thuram',   24, 'MF', 70, 74, 78, 78, 78, 86),
    mkPlayer('Teun Koopmeiners',  27, 'MF', 78, 72, 74, 82, 78, 84),
    mkPlayer('Douglas Luiz',      27, 'MF', 74, 70, 72, 78, 76, 82),
    mkPlayer('Kenan Yıldız',      20, 'MF', 76, 60, 76, 82, 72, 92),
    mkPlayer('Francisco Conceição',23,'FW', 80, 52, 88, 82, 76, 88),
    mkPlayer('Nicolás González',  27, 'FW', 78, 52, 82, 78, 74, 82),
    mkPlayer('Dušan Vlahović',    26, 'FW', 88, 52, 78, 80, 78, 90),
    mkPlayer('Randal Kolo Muani', 26, 'FW', 82, 52, 84, 76, 76, 84),
  ];
}

// ============================================================
// MANCHESTER UNITED
// ============================================================
export function buildManUnitedSquad(): Player[] {
  return [
    mkPlayer('André Onana',       29, 'GK', 26, 84, 56, 80, 76, 84),
    mkPlayer('Altay Bayındır',    27, 'GK', 22, 78, 50, 74, 70, 80),
    mkPlayer('Diogo Dalot',       27, 'DF', 62, 76, 82, 76, 76, 82),
    mkPlayer('Leny Yoro',         20, 'DF', 58, 82, 80, 74, 72, 92),
    mkPlayer('Matthijs de Ligt',  26, 'DF', 60, 84, 78, 78, 78, 86),
    mkPlayer('Patrick Dorgu',     21, 'DF', 58, 70, 82, 72, 70, 86),
    mkPlayer('Lisandro Martínez', 28, 'DF', 60, 82, 76, 76, 78, 84),
    mkPlayer('Noussair Mazraoui', 27, 'DF', 62, 74, 80, 74, 74, 80),
    mkPlayer('Luke Shaw',         30, 'DF', 62, 74, 78, 74, 74, 78),
    mkPlayer('Manuel Ugarte',     24, 'MF', 62, 82, 74, 74, 78, 83),
    mkPlayer('Bruno Fernandes',   32, 'MF', 82, 66, 76, 86, 78, 85),
    mkPlayer('Kobbie Mainoo',     20, 'MF', 72, 70, 74, 80, 74, 91),
    mkPlayer('Amad Diallo',       23, 'FW', 78, 52, 84, 80, 74, 87),
    mkPlayer('Matheus Cunha',     27, 'FW', 82, 52, 84, 82, 76, 86),
    mkPlayer('Alejandro Garnacho',22,'FW', 82, 52, 88, 82, 74, 90),
    mkPlayer('Rasmus Højlund',    23, 'FW', 84, 52, 82, 78, 76, 88),
  ];
}

// ============================================================
// ARSENAL
// ============================================================
export function buildArsenalSquad(): Player[] {
  return [
    mkPlayer('David Raya',        30, 'GK', 26, 86, 54, 82, 76, 86),
    mkPlayer('Tommy Setford',     20, 'GK', 20, 72, 50, 68, 66, 82),
    mkPlayer('Ben White',         28, 'DF', 64, 82, 80, 78, 80, 84),
    mkPlayer('William Saliba',    24, 'DF', 60, 88, 80, 78, 78, 92),
    mkPlayer('Gabriel Magalhães', 28, 'DF', 62, 86, 76, 76, 78, 87),
    mkPlayer('Riccardo Calafiori',23,'DF', 60, 78, 78, 76, 74, 87),
    mkPlayer('Jurrien Timber',    24, 'DF', 62, 80, 80, 78, 76, 88),
    mkPlayer('Myles Lewis-Skelly',19,'DF', 58, 72, 78, 72, 70, 88),
    mkPlayer('Declan Rice',       27, 'MF', 68, 86, 76, 82, 82, 90),
    mkPlayer('Martín Zubimendi',  26, 'MF', 68, 82, 74, 80, 78, 85),
    mkPlayer('Martin Ødegaard',   27, 'MF', 82, 68, 76, 90, 78, 90),
    mkPlayer('Mikel Merino',      29, 'MF', 74, 74, 74, 80, 78, 82),
    mkPlayer('Bukayo Saka',       24, 'FW', 86, 60, 88, 88, 80, 93),
    mkPlayer('Viktor Gyökeres',   28, 'FW', 90, 52, 82, 82, 80, 91),
    mkPlayer('Gabriel Martinelli',24,'FW', 84, 52, 90, 82, 78, 90),
    mkPlayer('Kai Havertz',       26, 'FW', 80, 58, 80, 82, 76, 85),
  ];
}

// ============================================================
// CHELSEA
// ============================================================
export function buildChelseaSquad(): Player[] {
  return [
    mkPlayer('Mike Penders',      22, 'GK', 22, 78, 52, 74, 68, 84),
    mkPlayer('Robert Sánchez',    28, 'GK', 24, 80, 52, 76, 72, 80),
    mkPlayer('Reece James',       26, 'DF', 66, 78, 80, 78, 78, 84),
    mkPlayer('Wesley Fofana',     24, 'DF', 58, 82, 80, 74, 74, 87),
    mkPlayer('Levi Colwill',      23, 'DF', 58, 80, 78, 76, 74, 88),
    mkPlayer('Marc Cucurella',    27, 'DF', 62, 76, 80, 76, 76, 80),
    mkPlayer('Malo Gusto',        23, 'DF', 62, 72, 82, 74, 72, 84),
    mkPlayer('Moisés Caicedo',    24, 'MF', 66, 82, 76, 76, 80, 86),
    mkPlayer('Enzo Fernández',    25, 'MF', 76, 72, 76, 82, 78, 85),
    mkPlayer('Cole Palmer',       23, 'MF', 82, 60, 78, 88, 76, 93),
    mkPlayer('Xavi Simons',       23, 'MF', 80, 60, 82, 86, 76, 91),
    mkPlayer('Roméo Lavia',       21, 'MF', 64, 78, 76, 76, 74, 88),
    mkPlayer('Liam Delap',        22, 'FW', 82, 52, 82, 78, 76, 88),
    mkPlayer('Pedro Neto',        25, 'FW', 80, 52, 88, 84, 76, 87),
    mkPlayer('Nicolas Jackson',   24, 'FW', 82, 52, 82, 76, 74, 84),
    mkPlayer('Estevão Willian',   18, 'FW', 78, 50, 88, 84, 72, 96),
  ];
}

// ============================================================
// INTER DE MILÃO
// ============================================================
export function buildInterSquad(): Player[] {
  return [
    mkPlayer('Yann Sommer',       38, 'GK', 26, 86, 54, 82, 78, 86),
    mkPlayer('Josep Martínez',    27, 'GK', 24, 80, 52, 76, 72, 82),
    mkPlayer('Benjamin Pavard',   29, 'DF', 64, 82, 78, 78, 78, 84),
    mkPlayer('Alessandro Bastoni',26,'DF', 62, 84, 76, 80, 78, 88),
    mkPlayer('Yann Bisseck',      24, 'DF', 58, 78, 76, 72, 74, 85),
    mkPlayer('Stefan de Vrij',    34, 'DF', 58, 80, 72, 74, 74, 80),
    mkPlayer('Denzel Dumfries',   29, 'DF', 68, 76, 86, 76, 80, 82),
    mkPlayer('Federico Dimarco',  27, 'DF', 68, 76, 82, 78, 78, 84),
    mkPlayer('Carlos Augusto',    26, 'DF', 62, 76, 78, 72, 74, 82),
    mkPlayer('Nicolò Barella',    28, 'MF', 80, 78, 80, 86, 84, 89),
    mkPlayer('Hakan Çalhanoğlu',  32, 'MF', 80, 76, 72, 88, 78, 86),
    mkPlayer('Davide Frattesi',   26, 'MF', 76, 70, 78, 78, 78, 84),
    mkPlayer('Piotr Zieliński',   32, 'MF', 76, 68, 72, 82, 74, 80),
    mkPlayer('Lautaro Martínez',  28, 'FW', 92, 52, 82, 86, 80, 93),
    mkPlayer('Marcus Thuram',     28, 'FW', 86, 52, 86, 80, 78, 87),
    mkPlayer('Mehdi Taremi',      33, 'FW', 82, 52, 74, 78, 74, 82),
  ];
}

// ============================================================
// MILAN
// ============================================================
export function buildMilanSquad(): Player[] {
  return [
    mkPlayer('Mike Maignan',      30, 'GK', 28, 88, 56, 84, 80, 90),
    mkPlayer('Pietro Terracciano',35, 'GK', 22, 78, 50, 74, 70, 78),
    mkPlayer('Z. Athekame',       23, 'DF', 58, 74, 82, 72, 72, 82),
    mkPlayer('Fikayo Tomori',     27, 'DF', 60, 84, 82, 76, 78, 86),
    mkPlayer('Strahinja Pavlović',24, 'DF', 58, 82, 76, 74, 76, 86),
    mkPlayer('Pervis Estupiñán', 28, 'DF', 60, 76, 84, 74, 76, 80),
    mkPlayer('Matteo Gabbia',     28, 'DF', 58, 80, 74, 72, 74, 80),
    mkPlayer('Youssouf Fofana',   26, 'MF', 66, 82, 76, 78, 78, 84),
    mkPlayer('Ardon Jashari',     23, 'MF', 68, 76, 76, 78, 76, 84),
    mkPlayer('Luka Modrić',       41, 'MF', 74, 68, 68, 86, 72, 84),
    mkPlayer('Christian Pulisic', 27, 'MF', 82, 62, 84, 84, 78, 84),
    mkPlayer('Adrien Rabiot',     31, 'MF', 74, 72, 72, 80, 76, 78),
    mkPlayer('Rafael Leão',       26, 'FW', 86, 52, 90, 84, 76, 90),
    mkPlayer('Christopher Nkunku',28,'FW', 86, 52, 84, 84, 76, 87),
    mkPlayer('Santiago Giménez',  24, 'FW', 84, 52, 78, 80, 76, 88),
    mkPlayer('Samuel Chukwueze',  26, 'FW', 78, 52, 84, 78, 72, 82),
  ];
}

// ============================================================
// ATLÉTICO DE MADRI
// ============================================================
export function buildAtleticoMadridSquad(): Player[] {
  return [
    mkPlayer('Jan Oblak',         33, 'GK', 28, 90, 58, 86, 80, 90),
    mkPlayer('Juan Musso',        31, 'GK', 24, 80, 52, 76, 72, 80),
    mkPlayer('Nahuel Molina',     27, 'DF', 64, 76, 82, 76, 78, 82),
    mkPlayer('Robin Le Normand',  28, 'DF', 60, 82, 76, 76, 78, 84),
    mkPlayer('Dávid Hancko',      27, 'DF', 60, 80, 78, 76, 76, 84),
    mkPlayer('Matteo Ruggeri',    24, 'DF', 58, 74, 78, 72, 72, 82),
    mkPlayer('José Giménez',      31, 'DF', 58, 82, 74, 74, 76, 82),
    mkPlayer('Javi Galán',        30, 'DF', 60, 72, 78, 72, 72, 76),
    mkPlayer('Marcos Llorente',   31, 'MF', 74, 76, 78, 80, 80, 82),
    mkPlayer('Pablo Barrios',     23, 'MF', 68, 74, 76, 78, 76, 84),
    mkPlayer('Koke',              34, 'MF', 72, 72, 68, 82, 74, 78),
    mkPlayer('Álex Baena',        25, 'MF', 78, 64, 82, 82, 76, 84),
    mkPlayer('Johnny Cardoso',    24, 'MF', 66, 76, 72, 74, 74, 82),
    mkPlayer('Julián Álvarez',    25, 'FW', 88, 60, 82, 86, 80, 92),
    mkPlayer('Antoine Griezmann', 35, 'FW', 88, 62, 78, 88, 76, 88),
    mkPlayer('Alexander Sørloth', 29, 'FW', 82, 52, 76, 74, 76, 82),
  ];
}

// ============================================================
// PORTO
// ============================================================
export function buildPortoSquad(): Player[] {
  return [
    mkPlayer('Diogo Costa',       26, 'GK', 26, 86, 54, 80, 76, 88),
    mkPlayer('Cláudio Ramos',     31, 'GK', 22, 76, 50, 72, 68, 76),
    mkPlayer('Alberto Costa',     22, 'DF', 58, 72, 78, 70, 70, 82),
    mkPlayer('Jan Bednarek',      30, 'DF', 58, 80, 74, 72, 74, 80),
    mkPlayer('Jakub Kiwior',      25, 'DF', 58, 78, 74, 72, 72, 80),
    mkPlayer('Francisco Moura',   26, 'DF', 60, 70, 78, 70, 70, 76),
    mkPlayer('Zaidu',             28, 'DF', 60, 70, 76, 68, 70, 74),
    mkPlayer('Martim Fernandes',  20, 'DF', 58, 68, 76, 68, 68, 82),
    mkPlayer('Alan Varela',       24, 'MF', 68, 78, 72, 76, 76, 82),
    mkPlayer('Victor Froholdt',   26, 'MF', 64, 74, 72, 74, 72, 76),
    mkPlayer('Pablo Rosario',     30, 'MF', 64, 72, 70, 72, 72, 74),
    mkPlayer('Rodrigo Mora',      21, 'MF', 72, 62, 74, 78, 70, 86),
    mkPlayer('Pepê',              27, 'MF', 76, 62, 82, 78, 74, 80),
    mkPlayer('Gabriel Veiga',     24, 'MF', 76, 62, 76, 80, 72, 82),
    mkPlayer('Borja Sainz',       25, 'FW', 80, 52, 82, 76, 74, 82),
    mkPlayer('Samu Omorodion',    22, 'FW', 82, 50, 82, 74, 74, 86),
  ];
}

// ============================================================
// BENFICA
// ============================================================
export function buildBenficaSquad(): Player[] {
  return [
    mkPlayer('Anatoliy Trubin',   24, 'GK', 24, 84, 54, 80, 74, 88),
    mkPlayer('Samuel Soares',     24, 'GK', 20, 74, 50, 70, 66, 78),
    mkPlayer('António Silva',     22, 'DF', 58, 82, 76, 78, 74, 90),
    mkPlayer('Nicolás Otamendi',  38, 'DF', 60, 84, 70, 76, 74, 84),
    mkPlayer('Tomás Araújo',      25, 'DF', 58, 78, 74, 72, 72, 82),
    mkPlayer('Alexander Bah',     27, 'DF', 60, 72, 82, 70, 70, 78),
    mkPlayer('Amar Dedić',        24, 'DF', 60, 74, 80, 72, 72, 80),
    mkPlayer('Samuel Dahl',       25, 'DF', 58, 70, 78, 70, 70, 78),
    mkPlayer('Enzo Barrenechea',  25, 'MF', 68, 74, 74, 76, 74, 80),
    mkPlayer('Fredrik Aursnes',   30, 'MF', 66, 74, 76, 74, 74, 76),
    mkPlayer('Leandro Barreiro',  26, 'MF', 66, 74, 72, 74, 72, 76),
    mkPlayer('Richard Ríos',      25, 'MF', 74, 70, 76, 80, 76, 84),
    mkPlayer('Vangelis Pavlidis', 29, 'FW', 84, 52, 78, 78, 74, 84),
    mkPlayer('Dodi Lukébakio',    29, 'FW', 82, 52, 88, 80, 74, 82),
    mkPlayer('A. Schjelderup',    22, 'FW', 78, 52, 82, 78, 72, 86),
    mkPlayer('Rafa Silva',        32, 'FW', 80, 52, 80, 80, 72, 80),
  ];
}

// ============================================================
// CRICIÚMA
// ============================================================
export function buildCriciumaSquad(): Player[] {
  return [
    mkPlayer('Alisson',            31, 'GK', 20, 72, 48, 68, 66, 72),
    mkPlayer('Airton',             28, 'GK', 18, 68, 46, 64, 62, 68),
    mkPlayer('Luciano Castán',     35, 'DF', 54, 76, 68, 68, 70, 76),
    mkPlayer('Rodrigo',            29, 'DF', 54, 74, 68, 66, 70, 74),
    mkPlayer('Bruno Alves',        38, 'DF', 54, 74, 64, 66, 68, 74),
    mkPlayer('Octávio Henrique',   27, 'DF', 52, 70, 68, 64, 68, 72),
    mkPlayer('Marcinho',           31, 'DF', 58, 68, 74, 66, 68, 70),
    mkPlayer('Marcelo Hermes',     30, 'DF', 56, 68, 72, 64, 66, 68),
    mkPlayer('Léo Mana',           26, 'DF', 56, 66, 74, 64, 66, 70),
    mkPlayer('Jean Irmer',         29, 'MF', 60, 70, 66, 68, 68, 70),
    mkPlayer('Sandry',             23, 'MF', 60, 66, 68, 68, 66, 74),
    mkPlayer('Gui Lobo',           25, 'MF', 60, 66, 68, 68, 66, 70),
    mkPlayer('Rómulo Otero',       31, 'MF', 68, 60, 70, 74, 66, 72),
    mkPlayer('Jhonata Robert',     29, 'MF', 64, 60, 70, 70, 64, 70),
    mkPlayer('Eliel',              25, 'FW', 68, 48, 78, 68, 64, 72),
    mkPlayer('Romarinho',          33, 'FW', 70, 48, 74, 68, 62, 70),
    mkPlayer('Waguininho',         27, 'FW', 68, 48, 76, 66, 64, 70),
    mkPlayer('Diego Gonçalves',    27, 'FW', 68, 48, 74, 66, 64, 70),
  ];
}

// ============================================================
// JUVENTUDE
// ============================================================
export function buildJuventudeSquad(): Player[] {
  return [
    mkPlayer('Jandrei',            30, 'GK', 20, 74, 50, 70, 68, 74),
    mkPlayer('Pedro Rocha',        26, 'GK', 18, 68, 48, 64, 64, 70),
    mkPlayer('Titi',               36, 'DF', 54, 76, 66, 66, 68, 76),
    mkPlayer('Messias',            30, 'DF', 54, 74, 68, 66, 68, 74),
    mkPlayer('Rodrigo Sam',        30, 'DF', 52, 72, 66, 64, 68, 72),
    mkPlayer('Schaffer',           28, 'DF', 52, 70, 66, 64, 66, 70),
    mkPlayer('Raí Ramos',          28, 'DF', 58, 68, 74, 66, 68, 70),
    mkPlayer('Diogo Barbosa',      30, 'DF', 56, 68, 72, 64, 68, 70),
    mkPlayer('Wadson',             26, 'DF', 54, 66, 72, 62, 64, 70),
    mkPlayer('Lucas Mineiro',      30, 'MF', 62, 70, 68, 68, 72, 72),
    mkPlayer('Luan Martins',       27, 'MF', 60, 68, 68, 68, 68, 70),
    mkPlayer('Mandaca',            29, 'MF', 62, 68, 68, 68, 70, 70),
    mkPlayer('Pablo Roberto',      28, 'MF', 62, 66, 68, 68, 68, 70),
    mkPlayer('Iba Ly',             26, 'MF', 58, 68, 70, 66, 66, 70),
    mkPlayer('Alan Kardec',        38, 'FW', 72, 48, 66, 68, 62, 72),
    mkPlayer('Fábio Lima',         29, 'FW', 68, 48, 74, 66, 64, 70),
    mkPlayer('Allanzinho',         24, 'FW', 66, 48, 76, 64, 62, 72),
    mkPlayer('Manuel Castro',      24, 'FW', 66, 48, 74, 64, 62, 70),
  ];
}

// ============================================================
// CUIABÁ
// ============================================================
export function buildCuiabaSquad(): Player[] {
  return [
    mkPlayer('João Carlos',        32, 'GK', 20, 72, 48, 68, 66, 72),
    mkPlayer('Marcelo Carné',      28, 'GK', 18, 66, 46, 62, 62, 66),
    mkPlayer('Vitor Mendes',       28, 'DF', 54, 74, 68, 66, 70, 74),
    mkPlayer('João Basso',         28, 'DF', 54, 72, 68, 64, 68, 72),
    mkPlayer('Alan Empereur',      30, 'DF', 54, 72, 66, 64, 68, 72),
    mkPlayer('Nino Paraíba',       33, 'DF', 56, 68, 72, 64, 66, 68),
    mkPlayer('Marlon',             30, 'DF', 54, 66, 70, 62, 66, 66),
    mkPlayer('Calebe',             28, 'MF', 62, 68, 68, 68, 70, 72),
    mkPlayer('Pepê',               26, 'MF', 62, 66, 70, 68, 68, 70),
    mkPlayer('Raul',               24, 'MF', 60, 66, 68, 66, 66, 72),
    mkPlayer('Yamil Asad',         31, 'MF', 68, 58, 70, 72, 66, 70),
    mkPlayer('Hernandes',          27, 'MF', 64, 60, 68, 68, 66, 68),
    mkPlayer('Luiz Otávio',        24, 'MF', 60, 66, 68, 66, 66, 70),
    mkPlayer('Eliel',              25, 'FW', 68, 48, 76, 66, 64, 70),
    mkPlayer('Mateus Santos',      25, 'FW', 66, 48, 72, 64, 62, 68),
    mkPlayer('Victor Barbara',     25, 'FW', 66, 48, 72, 64, 62, 68),
    mkPlayer('Vinicius Peixoto',   26, 'FW', 66, 48, 74, 64, 62, 68),
    mkPlayer('Gabriel Mineiro',    22, 'FW', 64, 48, 74, 62, 60, 72),
  ];
}

// ============================================================
// GOIÁS (usado no lugar de gpa)
// ============================================================
export function buildGoiasSquad(): Player[] {
  return [
    mkPlayer('Tadeu',              31, 'GK', 20, 74, 50, 70, 68, 74),
    mkPlayer('Thiago Rodrigues',   28, 'GK', 18, 68, 46, 64, 62, 68),
    mkPlayer('Lucas Ribeiro',      27, 'DF', 54, 74, 68, 66, 68, 74),
    mkPlayer('Ramon Menezes',      28, 'DF', 54, 72, 68, 64, 68, 72),
    mkPlayer('Luiz Felipe',        27, 'DF', 52, 72, 68, 64, 66, 72),
    mkPlayer('Luisão',             30, 'DF', 54, 74, 66, 66, 68, 74),
    mkPlayer('Rodrigo Soares',     28, 'DF', 56, 66, 72, 64, 66, 68),
    mkPlayer('Diego Caito',        24, 'DF', 56, 64, 72, 62, 64, 70),
    mkPlayer('Nicolas',            24, 'DF', 54, 64, 70, 62, 62, 68),
    mkPlayer('Filipe Machado',     30, 'MF', 62, 68, 68, 68, 70, 70),
    mkPlayer('Juninho',            31, 'MF', 62, 68, 68, 68, 68, 68),
    mkPlayer('Baldória',           27, 'MF', 60, 66, 68, 66, 66, 68),
    mkPlayer('Lucas Lima',         34, 'MF', 68, 58, 66, 74, 66, 70),
    mkPlayer('Lourenço',           22, 'MF', 66, 58, 70, 70, 64, 76),
    mkPlayer('Anselmo Ramon',      36, 'FW', 72, 50, 68, 68, 62, 72),
    mkPlayer('Bruno Sávio',        28, 'FW', 70, 48, 76, 68, 66, 72),
    mkPlayer('Pedrinho',           25, 'FW', 68, 48, 74, 66, 64, 72),
    mkPlayer('Esli García',        26, 'FW', 68, 48, 74, 66, 64, 70),
  ];
}

// ============================================================
// AVAÍ
// ============================================================
export function buildAvaiSquad(): Player[] {
  return [
    mkPlayer('Igor Bohn',          30, 'GK', 20, 72, 48, 68, 66, 72),
    mkPlayer('Otávio',             24, 'GK', 18, 66, 46, 62, 62, 70),
    mkPlayer('Allyson',            28, 'DF', 52, 72, 68, 64, 68, 72),
    mkPlayer('Nicolás Cabral',     26, 'DF', 52, 70, 68, 62, 66, 70),
    mkPlayer('Bruno Baldini',      27, 'DF', 52, 70, 66, 62, 66, 70),
    mkPlayer('Gabriel Simples',    25, 'DF', 52, 68, 68, 62, 64, 70),
    mkPlayer('Wallison',           26, 'DF', 56, 66, 72, 62, 64, 68),
    mkPlayer('Jefferson Maciel',   28, 'DF', 54, 64, 70, 60, 64, 66),
    mkPlayer('Mateus Quaresma',    24, 'DF', 54, 64, 70, 62, 62, 68),
    mkPlayer('Zé Ricardo',         37, 'MF', 60, 68, 64, 68, 68, 68),
    mkPlayer('Jamerson',           25, 'MF', 58, 66, 68, 66, 66, 70),
    mkPlayer('Del Piage',          26, 'MF', 60, 64, 66, 66, 64, 68),
    mkPlayer('Hyan',               24, 'MF', 62, 60, 70, 68, 64, 72),
    mkPlayer('Jean Lucas',         28, 'MF', 64, 62, 68, 68, 66, 70),
    mkPlayer('Daniel Penha',       25, 'MF', 64, 60, 70, 68, 64, 70),
    mkPlayer('Rafael Bilu',        27, 'FW', 66, 48, 74, 64, 62, 68),
    mkPlayer('Felipe Avenatti',    29, 'FW', 68, 48, 70, 64, 62, 68),
    mkPlayer('Isaías',             25, 'FW', 66, 48, 74, 62, 62, 70),
  ];
}

// ============================================================
// AL-NASSR
// ============================================================
export function buildAlNassrSquad(): Player[] {
  return [
    mkPlayer('Bento',             26, 'GK', 24, 82, 52, 78, 74, 84),
    mkPlayer('Nawaf Al-Aqidi',    22, 'GK', 20, 68, 48, 62, 62, 74),
    mkPlayer('Sultan Al-Ghannam', 26, 'DF', 58, 70, 72, 66, 68, 72),
    mkPlayer('Aymeric Laporte',   32, 'DF', 60, 82, 72, 76, 74, 82),
    mkPlayer('Mohamed Simakan',   25, 'DF', 60, 80, 78, 74, 74, 82),
    mkPlayer('Alex Telles',       34, 'DF', 62, 72, 74, 72, 70, 72),
    mkPlayer('Ali Lajami',        28, 'DF', 56, 70, 70, 64, 66, 70),
    mkPlayer('Marcelo Brozović',  34, 'MF', 68, 76, 68, 80, 74, 78),
    mkPlayer('Otávio',            30, 'MF', 72, 72, 74, 78, 74, 77),
    mkPlayer('Seko Fofana',       30, 'MF', 70, 74, 74, 76, 74, 76),
    mkPlayer('Angelo Gabriel',    21, 'FW', 76, 52, 84, 78, 72, 86),
    mkPlayer('Sadio Mané',        34, 'FW', 84, 56, 86, 82, 76, 84),
    mkPlayer('Cristiano Ronaldo', 41, 'FW', 90, 50, 76, 86, 72, 90),
    mkPlayer('Anderson Talisca',  33, 'FW', 82, 52, 74, 82, 72, 82),
    mkPlayer('Wesley',            22, 'FW', 74, 52, 84, 72, 72, 84),
  ];
}

import { nanoid } from 'nanoid';
import type { Player, Position } from '@/types';

// ============================================================
// Elencos reais dos principais clubes brasileiros (temporada 2026)
// Atributos baseados no desempenho real dos atletas
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
    // Goleiros
    mkPlayer('Rossi',              30, 'GK', 28, 84, 55, 80, 75, 85),
    mkPlayer('Dyogo Alves',        22, 'GK', 20, 70, 50, 66, 68, 78),
    // Defensores
    mkPlayer('Varela',             32, 'DF', 67, 77, 75, 70, 73, 78),
    mkPlayer('Léo Ortiz',          30, 'DF', 60, 82, 72, 74, 78, 84),
    mkPlayer('Léo Pereira',        31, 'DF', 62, 83, 74, 73, 77, 83),
    mkPlayer('Ayrton Lucas',       29, 'DF', 68, 74, 81, 76, 79, 80),
    mkPlayer('Wesley',             21, 'DF', 64, 70, 82, 68, 72, 83),
    // Meias
    mkPlayer('De la Cruz',         29, 'MF', 79, 70, 76, 86, 78, 87),
    mkPlayer('Gerson',             28, 'MF', 76, 74, 72, 84, 80, 85),
    mkPlayer('Erick Pulgar',       32, 'MF', 65, 79, 65, 76, 75, 77),
    mkPlayer('Lorran',             20, 'MF', 70, 58, 76, 74, 70, 87),
    mkPlayer('Allan',              33, 'MF', 58, 76, 64, 72, 74, 74),
    mkPlayer('Matheus Gonçalves',  22, 'MF', 72, 60, 75, 74, 72, 84),
    // Atacantes
    mkPlayer('Pedro',              29, 'FW', 88, 52, 74, 84, 77, 88),
    mkPlayer('Everton Cebolinha',  29, 'FW', 83, 50, 88, 81, 77, 84),
    mkPlayer('Bruno Henrique',     34, 'FW', 81, 48, 84, 79, 68, 81),
    mkPlayer('Plata',              27, 'FW', 80, 52, 87, 79, 75, 83),
    mkPlayer('Michael',            29, 'FW', 79, 50, 86, 77, 74, 80),
  ];
}

// ============================================================
// PALMEIRAS
// ============================================================
export function buildPalmeirasSquad(): Player[] {
  return [
    mkPlayer('Weverton',       38, 'GK', 25, 82, 52, 78, 73, 82),
    mkPlayer('Marcelo Lomba',  38, 'GK', 20, 74, 48, 70, 70, 74),
    mkPlayer('Marcos Rocha',   37, 'DF', 62, 74, 74, 68, 72, 74),
    mkPlayer('Gustavo Gómez',  32, 'DF', 62, 85, 71, 76, 80, 85),
    mkPlayer('Murilo',         29, 'DF', 60, 82, 74, 74, 79, 84),
    mkPlayer('Piquerez',       29, 'DF', 68, 76, 80, 74, 78, 82),
    mkPlayer('Vitor Reis',     18, 'DF', 55, 74, 70, 66, 70, 88),
    mkPlayer('Aníbal Moreno',  28, 'MF', 72, 78, 72, 78, 80, 83),
    mkPlayer('Richard Ríos',   25, 'MF', 74, 70, 76, 80, 78, 88),
    mkPlayer('Raphael Veiga',  31, 'MF', 82, 65, 74, 85, 77, 85),
    mkPlayer('Mauricio',       26, 'MF', 76, 58, 78, 79, 74, 84),
    mkPlayer('Gabriel Menino', 24, 'MF', 68, 72, 74, 72, 76, 82),
    mkPlayer('Flaco López',    28, 'FW', 84, 50, 75, 80, 76, 85),
    mkPlayer('Rony',           31, 'FW', 80, 50, 87, 78, 76, 80),
    mkPlayer('Lázaro',         24, 'FW', 78, 50, 84, 76, 73, 82),
    mkPlayer('Felipe Anderson', 32, 'FW', 80, 52, 82, 80, 73, 80),
    mkPlayer('Paulinho',       24, 'FW', 82, 52, 80, 78, 76, 86),
  ];
}

// ============================================================
// CORINTHIANS
// ============================================================
export function buildCorinthiansSquad(): Player[] {
  return [
    mkPlayer('Matheus Donelli', 23, 'GK', 22, 76, 52, 72, 70, 82),
    mkPlayer('Hugo Souza',      24, 'GK', 22, 74, 50, 70, 68, 80),
    mkPlayer('Fagner',          36, 'DF', 64, 74, 72, 68, 70, 74),
    mkPlayer('Cacá',            26, 'DF', 60, 80, 72, 72, 77, 85),
    mkPlayer('Félix Torres',    29, 'DF', 60, 80, 70, 70, 76, 81),
    mkPlayer('Matheuzinho',     25, 'DF', 64, 72, 78, 70, 73, 82),
    mkPlayer('Hugo Dourado',    24, 'DF', 62, 72, 76, 68, 74, 82),
    mkPlayer('Raniele',         26, 'MF', 62, 74, 70, 72, 76, 82),
    mkPlayer('Charles',         29, 'MF', 68, 72, 70, 74, 77, 79),
    mkPlayer('Garro',           28, 'MF', 78, 62, 72, 82, 73, 85),
    mkPlayer('Igor Coronado',   31, 'MF', 77, 60, 70, 82, 73, 79),
    mkPlayer('Ryan',            26, 'MF', 70, 68, 74, 72, 76, 80),
    mkPlayer('Memphis Depay',   32, 'FW', 84, 52, 80, 83, 74, 84),
    mkPlayer('Yuri Alberto',    25, 'FW', 83, 50, 78, 78, 75, 87),
    mkPlayer('Romero',          33, 'FW', 79, 52, 81, 76, 70, 79),
    mkPlayer('Talles Magno',    23, 'FW', 77, 50, 82, 75, 72, 84),
  ];
}

// ============================================================
// SÃO PAULO
// ============================================================
export function buildSaoPauloSquad(): Player[] {
  return [
    mkPlayer('Rafael',         35, 'GK', 24, 80, 50, 76, 72, 80),
    mkPlayer('Jandrei',        32, 'GK', 20, 74, 48, 70, 68, 74),
    mkPlayer('Arboleda',       32, 'DF', 60, 82, 68, 72, 76, 82),
    mkPlayer('Ruan',           25, 'DF', 58, 78, 72, 70, 74, 83),
    mkPlayer('Alan Franco',    31, 'DF', 60, 80, 68, 70, 75, 80),
    mkPlayer('Welington',      25, 'DF', 66, 72, 80, 70, 74, 83),
    mkPlayer('Michel Araújo',  27, 'DF', 64, 72, 78, 70, 73, 78),
    mkPlayer('Alisson',        33, 'MF', 68, 70, 66, 77, 74, 77),
    mkPlayer('Bobadilla',      31, 'MF', 68, 72, 68, 74, 76, 76),
    mkPlayer('Luciano',        32, 'MF', 76, 58, 72, 78, 73, 77),
    mkPlayer('Oscar',          33, 'MF', 78, 62, 68, 84, 72, 79),
    mkPlayer('Marcos Antônio', 25, 'MF', 68, 68, 72, 74, 74, 82),
    mkPlayer('Lucas Moura',    33, 'FW', 80, 52, 80, 82, 72, 81),
    mkPlayer('Calleri',        34, 'FW', 82, 52, 72, 78, 72, 82),
    mkPlayer('Ferreira',       29, 'FW', 78, 52, 80, 76, 73, 79),
    mkPlayer('André Silva',    30, 'FW', 80, 50, 74, 76, 74, 80),
  ];
}

// ============================================================
// FLUMINENSE
// ============================================================
export function buildFluminenseSquad(): Player[] {
  return [
    mkPlayer('Fábio',          44, 'GK', 20, 80, 45, 74, 68, 80),
    mkPlayer('Marcelo Pitaluga',22,'GK', 20, 72, 48, 68, 66, 80),
    mkPlayer('Samuel Xavier',  33, 'DF', 64, 74, 76, 68, 72, 74),
    mkPlayer('Nino',           28, 'DF', 58, 80, 70, 72, 76, 82),
    mkPlayer('Thiago Santos',  36, 'DF', 58, 78, 64, 68, 73, 78),
    mkPlayer('Diogo Barbosa',  30, 'DF', 62, 72, 76, 68, 73, 74),
    mkPlayer('Guga',           24, 'DF', 64, 72, 78, 68, 72, 82),
    mkPlayer('Martinelli',     24, 'MF', 68, 66, 72, 74, 74, 84),
    mkPlayer('Ganso',          35, 'MF', 74, 58, 60, 84, 68, 79),
    mkPlayer('Lima',           24, 'MF', 70, 64, 74, 72, 74, 82),
    mkPlayer('Nonato',         26, 'MF', 68, 66, 70, 72, 73, 79),
    mkPlayer('Facundo Bernal', 21, 'MF', 65, 62, 70, 72, 70, 84),
    mkPlayer('Jhon Arias',     29, 'FW', 82, 52, 86, 80, 77, 85),
    mkPlayer('Keno',           34, 'FW', 78, 50, 84, 76, 70, 78),
    mkPlayer('Germán Cano',    38, 'FW', 82, 48, 68, 78, 70, 82),
    mkPlayer('Kevin Serna',    25, 'FW', 78, 50, 84, 76, 73, 82),
  ];
}

// ============================================================
// ATLÉTICO MINEIRO
// ============================================================
export function buildAtleticoMGSquad(): Player[] {
  return [
    mkPlayer('Everson',         35, 'GK', 24, 81, 50, 76, 72, 81),
    mkPlayer('Paulo Cézar',     28, 'GK', 20, 72, 48, 68, 66, 75),
    mkPlayer('Guilherme Arana', 28, 'DF', 68, 76, 82, 74, 78, 82),
    mkPlayer('Júnior Alonso',   34, 'DF', 58, 81, 68, 70, 74, 81),
    mkPlayer('Rubens',          25, 'DF', 62, 74, 80, 70, 73, 82),
    mkPlayer('Lyanco',          28, 'DF', 58, 78, 70, 70, 74, 79),
    mkPlayer('Igor Rabello',    28, 'DF', 56, 78, 68, 68, 74, 79),
    mkPlayer('Fausto Vera',     27, 'MF', 68, 74, 70, 74, 77, 81),
    mkPlayer('Battaglia',       34, 'MF', 65, 76, 64, 74, 74, 76),
    mkPlayer('Bernard',         33, 'MF', 76, 58, 78, 80, 71, 76),
    mkPlayer('Igor Gomes',      26, 'MF', 70, 66, 72, 74, 73, 80),
    mkPlayer('Otávio',          30, 'MF', 76, 64, 72, 80, 74, 80),
    mkPlayer('Paulinho',        24, 'FW', 83, 52, 80, 79, 76, 88),
    mkPlayer('Deyverson',       34, 'FW', 78, 50, 74, 74, 70, 78),
    mkPlayer('Hulk',            40, 'FW', 82, 50, 68, 78, 68, 82),
    mkPlayer('Rômulo',          24, 'FW', 76, 50, 80, 74, 72, 83),
  ];
}

// ============================================================
// BOTAFOGO
// ============================================================
export function buildBotafogoSquad(): Player[] {
  return [
    mkPlayer('John',            29, 'GK', 22, 79, 52, 74, 70, 80),
    mkPlayer('Gatito Fernández',36, 'GK', 20, 76, 48, 72, 68, 76),
    mkPlayer('Cuiabano',        24, 'DF', 62, 72, 80, 68, 72, 82),
    mkPlayer('Adryelson',       27, 'DF', 58, 78, 70, 68, 73, 80),
    mkPlayer('Barboza',         29, 'DF', 58, 76, 68, 68, 72, 77),
    mkPlayer('Marçal',          34, 'DF', 62, 72, 74, 68, 70, 72),
    mkPlayer('Pablo',           33, 'DF', 56, 78, 66, 68, 72, 78),
    mkPlayer('Gregore',         30, 'MF', 64, 76, 68, 70, 78, 78),
    mkPlayer('Marlon Freitas',  30, 'MF', 68, 72, 70, 74, 76, 78),
    mkPlayer('Tchê Tchê',       31, 'MF', 68, 70, 70, 72, 74, 74),
    mkPlayer('Savarino',        27, 'FW', 80, 52, 84, 79, 75, 84),
    mkPlayer('Luiz Henrique',   25, 'FW', 80, 52, 86, 78, 74, 86),
    mkPlayer('Tiquinho Soares', 34, 'FW', 81, 50, 72, 76, 70, 81),
    mkPlayer('Júnior Santos',   28, 'FW', 78, 50, 80, 75, 73, 79),
    mkPlayer('Igor Jesus',      22, 'FW', 78, 50, 78, 74, 72, 86),
    mkPlayer('Matheus Nascimento', 23, 'FW', 76, 50, 78, 73, 71, 84),
  ];
}

// ============================================================
// CRUZEIRO
// ============================================================
export function buildCruzeiroSquad(): Player[] {
  return [
    mkPlayer('Cássio',          37, 'GK', 22, 80, 48, 74, 68, 80),
    mkPlayer('Anderson',        28, 'GK', 20, 72, 48, 68, 66, 75),
    mkPlayer('William',         27, 'DF', 62, 76, 74, 68, 72, 79),
    mkPlayer('João Marcelo',    20, 'DF', 56, 72, 70, 65, 70, 84),
    mkPlayer('Zé Ivaldo',       27, 'DF', 58, 78, 68, 68, 73, 79),
    mkPlayer('Marlon',          28, 'DF', 62, 74, 76, 68, 72, 77),
    mkPlayer('Kaiki',           22, 'DF', 60, 70, 76, 66, 70, 81),
    mkPlayer('Lucas Silva',     32, 'MF', 62, 74, 66, 70, 74, 74),
    mkPlayer('Ramiro',          32, 'MF', 68, 68, 68, 72, 72, 72),
    mkPlayer('Matheus Henrique',26, 'MF', 70, 66, 70, 74, 73, 80),
    mkPlayer('Barreal',         26, 'MF', 72, 60, 74, 76, 71, 79),
    mkPlayer('Eduardo',         26, 'MF', 68, 64, 72, 72, 72, 78),
    mkPlayer('Kaio Jorge',      23, 'FW', 78, 50, 78, 75, 72, 85),
    mkPlayer('Arthur Gomes',    26, 'FW', 76, 50, 80, 74, 72, 78),
    mkPlayer('Lautaro Díaz',    25, 'FW', 76, 50, 78, 74, 72, 80),
    mkPlayer('Gabriel Veron',   23, 'FW', 75, 50, 80, 73, 70, 82),
  ];
}

// ============================================================
// GRÊMIO
// ============================================================
export function buildGremioSquad(): Player[] {
  return [
    mkPlayer('Marchesín',       36, 'GK', 22, 79, 48, 74, 70, 79),
    mkPlayer('Gabriel Grando',  24, 'GK', 20, 70, 48, 66, 66, 78),
    mkPlayer('João Pedro',      22, 'DF', 60, 72, 76, 66, 70, 82),
    mkPlayer('Rodrigo Ely',     31, 'DF', 58, 78, 68, 68, 73, 78),
    mkPlayer('Kannemann',       34, 'DF', 58, 80, 66, 68, 72, 80),
    mkPlayer('Reinaldo',        37, 'DF', 64, 70, 74, 66, 68, 70),
    mkPlayer('Mayk',            24, 'DF', 62, 70, 78, 66, 70, 80),
    mkPlayer('Dodi',            30, 'MF', 66, 72, 68, 72, 75, 76),
    mkPlayer('Villasanti',      28, 'MF', 65, 72, 68, 70, 76, 78),
    mkPlayer('Pepê',            28, 'MF', 74, 60, 80, 76, 74, 80),
    mkPlayer('Cristaldo',       25, 'MF', 74, 60, 74, 76, 72, 82),
    mkPlayer('Edenilson',       33, 'MF', 68, 68, 70, 72, 72, 72),
    mkPlayer('Soteldo',         28, 'FW', 79, 50, 85, 79, 72, 81),
    mkPlayer('Diego Costa',     35, 'FW', 78, 50, 70, 74, 68, 78),
    mkPlayer('Braithwaite',     34, 'FW', 78, 52, 76, 74, 70, 78),
    mkPlayer('Aravena',         21, 'FW', 73, 50, 78, 72, 70, 84),
  ];
}

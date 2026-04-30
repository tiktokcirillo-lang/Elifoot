// ============================================================
// Domain types — núcleo do jogo
// ============================================================

export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export type Foot = 'L' | 'R' | 'B';

export interface Player {
  id: string;
  name: string;
  age: number;
  position: Position;
  foot: Foot;
  // Atributos 1 a 99
  attack: number;
  defense: number;
  pace: number;
  technique: number;
  stamina: number;
  // Derivado
  overall: number;
  // Estado
  morale: number; // 0 a 100
  fitness: number; // 0 a 100
  injuredUntil?: number; // turno em que volta
  yellowCardsInComp: Record<string, number>; // por competição
  contractUntil: number; // ano
  wageMonthly: number; // em milhares
  marketValue: number; // em milhares
  // Estatísticas de temporada
  stats: PlayerSeasonStats;
}

export interface PlayerSeasonStats {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

// ------------------------------------------------------------

export type TeamTier = 'elite' | 'top' | 'mid' | 'low';

export interface Team {
  id: string;
  name: string;
  shortName: string; // 3 letras tipo FLA, PAL
  city: string;
  country: string;
  primaryColor: string;
  secondaryColor: string;
  tier: TeamTier;
  reputation: number; // 0 a 100, afeta IA de mercado
  budget: number; // em milhares
  squad: Player[];
  formation: Formation;
  starting11: string[]; // ids dos jogadores titulares
  bench: string[]; // ids da reserva
  isUserControlled: boolean;
}

export type Formation =
  | '4-4-2'
  | '4-3-3'
  | '4-2-3-1'
  | '3-5-2'
  | '5-3-2'
  | '4-5-1';

// ------------------------------------------------------------

export interface MatchEvent {
  minute: number;
  type:
    | 'goal'
    | 'yellow_card'
    | 'red_card'
    | 'substitution'
    | 'injury'
    | 'penalty_scored'
    | 'penalty_missed'
    | 'shot_on_target'
    | 'shot_off_target'
    | 'corner'
    | 'foul';
  side: 'home' | 'away';
  playerId?: string;
  playerName?: string;
  description: string;
}

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossession: number; // 0 a 100
  events: MatchEvent[];
  // Penalties caso aplicável
  homePenalties?: number;
  awayPenalties?: number;
}

export interface Fixture {
  id: string;
  competitionId: string;
  round: number; // rodada / fase
  stage: string; // ex: 'group', 'r16', 'qf', 'sf', 'final', 'regular'
  homeTeamId: string;
  awayTeamId: string;
  scheduledTurn: number; // turno do calendário
  played: boolean;
  result?: MatchResult;
  isTwoLeg?: boolean;
  legNumber?: 1 | 2;
  pairId?: string; // agrupa mata-mata ida e volta
}

// ------------------------------------------------------------

export type CompetitionFormat =
  | 'round_robin' // pontos corridos (Brasileirão)
  | 'groups_knockout' // grupos + mata-mata (Libertadores, Mundial, Copa do Mundo)
  | 'pure_knockout' // mata-mata puro (Copa do Brasil)
  | 'groups_then_knockout_paulista' // formato Paulistão
  | 'swiss_knockout'; // formato suíço (Champions atual)

export interface CompetitionStanding {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  group?: string;
}

export interface Competition {
  id: string;
  name: string;
  shortName: string;
  format: CompetitionFormat;
  season: number;
  teamIds: string[];
  fixtures: Fixture[];
  standings: CompetitionStanding[];
  groups?: Record<string, string[]>; // groupName -> teamIds
  knockoutBracket?: KnockoutPair[];
  currentRound: number;
  totalRounds: number;
  finished: boolean;
  championId?: string;
}

export interface KnockoutPair {
  id: string;
  stage: 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third_place';
  team1Id?: string;
  team2Id?: string;
  leg1ResultId?: string; // fixture id ida
  leg2ResultId?: string; // fixture id volta
  winnerId?: string;
}

// ------------------------------------------------------------

export interface NewsItem {
  id: string;
  turn: number;
  type: 'match' | 'transfer' | 'injury' | 'achievement' | 'finance' | 'general';
  title: string;
  body: string;
  read: boolean;
}

// ------------------------------------------------------------

export interface SaveGame {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  managerName: string;
  controlledTeamId: string;
  season: number;
  currentTurn: number; // turno absoluto (dia do calendário do jogo)
  teams: Team[];
  competitions: Competition[];
  news: NewsItem[];
  // Calendário
  seasonStartTurn: number;
  seasonEndTurn: number;
}

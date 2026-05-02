// ============================================================
// Domain types — núcleo do jogo
// ============================================================

export type Position = 'GK' | 'DF' | 'MF' | 'FW';

// ============================================================
// Mercado de transferências
// ============================================================

export interface TransferBid {
  id: string;
  fromTeamId: string;
  amount: number; // em milhares
  turn: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface TransferListing {
  id: string;
  playerId: string;
  fromTeamId: string;
  askingPrice: number; // em milhares
  turn: number;
  status: 'open' | 'sold' | 'withdrawn';
  bids: TransferBid[];
}

// ============================================================
// Treinamento
// ============================================================

export type TrainingType = 'attack' | 'defense' | 'fitness' | 'technique' | 'tactics' | 'rest';
export type TrainingIntensity = 'light' | 'normal' | 'heavy';

export interface TrainingPlan {
  type: TrainingType;
  intensity: TrainingIntensity;
}

// ============================================================
// Tática
// ============================================================

export type TacticalPosture = 'attack' | 'balanced' | 'defensive';
export type PressingLevel = 'high' | 'medium' | 'low';

export interface TacticalSetup {
  posture: TacticalPosture;
  pressing: PressingLevel;
  penaltyTakerId: string | null;
  cornerTakerId: string | null;
}

// ============================================================
// Financeiro
// ============================================================

export type FinanceType =
  | 'sponsor'
  | 'ticket'
  | 'tv_rights'
  | 'wages'
  | 'transfer_in'
  | 'transfer_out';

export interface FinanceRecord {
  id: string;
  turn: number;
  type: FinanceType;
  amount: number; // positivo = receita, negativo = despesa (em milhares)
  description: string;
}

// ============================================================
// Objetivos da diretoria
// ============================================================

export type ObjectiveType =
  | 'league_title'
  | 'league_position'
  | 'avoid_relegation'
  | 'cup_win'
  | 'qualify_libertadores';

export interface BoardObjective {
  id: string;
  type: ObjectiveType;
  description: string;
  targetValue?: number; // ex: top 4 → 4
  status: 'pending' | 'achieved' | 'failed';
}

// ============================================================
// Multitemporada
// ============================================================

export interface SeasonRecord {
  season: number;
  teamName: string;
  leaguePosition: number;
  objectivesAchieved: number;
  objectivesTotal: number;
  titles: string[]; // nomes das competições vencidas
  budget: number; // saldo final da temporada
}

export interface HallOfFameEntry {
  season: number;
  competitionName: string;
  championName: string;
}

export interface AwardWinner {
  playerName: string;
  teamName: string;
  overall: number;
  age?: number;
  goals?: number;
  position?: string;
  totalVotes?: number;
  firstPlaceVotes?: number;
}

export interface SeasonAward {
  season: number;
  artilheiro?: { playerName: string; teamName: string; goals: number };
  boladeOuro?: AwardWinner;
  revelacao?: AwardWinner; // Troféu Kopa (sub-21)
  melhorGoleiro?: AwardWinner; // Troféu Yashin
  melhorTecnico?: { managerName: string; teamName: string; titulos: number };
  topVoters?: { playerName: string; teamName: string; points: number }[]; // top 5 da votação
}

// ============================================================
// Patrocinadores
// ============================================================

export interface SponsorOffer {
  id: string;
  brandId: string;
  brandName: string;
  valuePerSeason: number; // em milhares por temporada
  seasons: number; // duração do contrato em temporadas
  offeredAt: number; // turno da oferta
  expiresAt: number; // turno de expiração da oferta pendente
  status: 'pending' | 'active' | 'expired' | 'rejected';
  activeSince?: number; // temporada de início
  activeUntil?: number; // última temporada do contrato (inclusivo)
}

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
  potential?: number; // teto secreto de crescimento (1-99)
  // Estado
  morale: number; // 0 a 100
  fitness: number; // 0 a 100
  injuredUntil?: number; // turno em que volta
  yellowCardsInComp: Record<string, number>; // por competição
  appearancesInComp: Record<string, number>; // jogos disputados por competição (para regra dos 12 jogos)
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
  singleLegKnockout?: boolean; // true = mata-mata em jogo único (Mundial, Copa do Mundo)
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

// ============================================================
// Carreira do técnico
// ============================================================

export type ManagerSkillCategory = 'scouting' | 'motivation' | 'tactics' | 'youth' | 'finance';

export interface ManagerSkillDef {
  id: string;
  name: string;
  description: string;
  category: ManagerSkillCategory;
  cost: number; // XP necessário para desbloquear
}

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
  // Mercado de transferências
  transferMarket: TransferListing[];
  // Treinamento
  trainingPlan: TrainingPlan;
  // Tática
  tacticalSetup: TacticalSetup;
  // Financeiro
  financeHistory: FinanceRecord[];
  boardObjectives: BoardObjective[];
  // Multitemporada
  seasonRecords: SeasonRecord[];
  hallOfFame: HallOfFameEntry[];
  seasonAwards: SeasonAward[];
  seasonOver: boolean;
  // Base (academia juvenil)
  youthPlayers: Player[];
  // Estabilidade do técnico
  managerWarnings: number; // avisos consecutivos por falha em objetivos críticos
  dismissed?: boolean;
  // Patrocínios
  sponsorOffers: SponsorOffer[];
  // Carreira do técnico
  managerReputation: number;    // 0 a 10000
  managerXP: number;            // XP total acumulado (pode gastar em habilidades)
  managerXPSpent: number;       // XP já gasto
  unlockedSkills: string[];     // ids das habilidades desbloqueadas
  boardConfidence: number;      // 0 a 100 (confiança da diretoria)
  careerClubs: string[];        // nomes dos times que já treinou
}

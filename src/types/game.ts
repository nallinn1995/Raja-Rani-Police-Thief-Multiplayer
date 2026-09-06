export enum PlayType {
  OFFLINE = "OFFLINE",
  ONLINE = "ONLINE",
}

export enum GameMode {
  CLASSIC_POINTS = "CLASSIC_POINTS",
  DETECTIVE_CHALLENGE = "DETECTIVE_CHALLENGE",
  MODERN_MODE = "MODERN_MODE",
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  role?: string | null;
  rank?: number;
  correctCatches?: number;
  wrongGuesses?: number;
  policeTurnsCompleted?: number;
  detectiveScore?: number;
  accuracy?: number;
  title?: string;
  avatar?: string;
  thiefEscaped?: number;
  thiefCaught?: number;
  detectiveWins?: number;
  fastestCatch?: number;
  isOnline?: boolean;
  isSpeaking?: boolean;
  userId?: string;
}

export interface Room {
  id: string;
  name: string;
  totalRounds: number;
  currentRound: number;
  gameState: 'waiting' | 'role-assignment' | 'classic-card-selection' | 'police-reveal' | 'guessing' | 'results' | 'finished' | 'detective-briefing' | 'detective-investigating' | 'detective-results' | 'detective-finished' | `modern-${string}` | string;
  players: Player[];
  policeId?: string | null;
  cardsState?: { id: string; selectedBy: string | null }[];
  guessingEndTime?: number;
  gameMode?: GameMode | string;
  maxPlayers?: number;
  winCondition?: 'rounds' | 'target_score' | string;
  targetScore?: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: string;
}

export interface RoundSummaryLog {
  roundNumber: number;
  policeName: string;
  actualThief: string;
  policeSelected: string;
  isCorrect: boolean;
  guessTime: number;
}

export interface RoundResult {
  isCorrect: boolean;
  police?: Player | { id: string; name: string };
  thief: Player;
  guessedPlayer: Player;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  gameMode?: GameMode | string;
  winCondition?: 'rounds' | 'target_score' | string;
  targetScore?: number;
  isGameOver?: boolean;
  guessTime?: number;
  roundSummaries?: RoundSummaryLog[];
}
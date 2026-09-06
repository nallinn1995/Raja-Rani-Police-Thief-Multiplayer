export interface SuspectCardData {
  cardId: string;
  characterId: string;
  name: string;
  avatar: string;
  expression: string;
  speechBubble: string;
  imageName?: string;
  gifName?: string;
  occupation?: string;
  personality?: string;
  speechBubbles?: string[];
}

export interface DetectivePlayerGuess {
  playerId: string;
  username: string;
  selectedCardId: string;
  guessTime: number; // e.g. 2.31s
}

export interface DetectiveRoundResultPlayer {
  id: string;
  name: string;
  avatar?: string;
  selectedCardId: string;
  isCorrect: boolean;
  guessTime: number;
  accuracy: number;
  currentStreak: number;
  badge: string;
  badgeIcon: string;
  rank: number;
}

export interface DetectiveRoundResult {
  roundNumber: number;
  totalRounds: number;
  actualThiefCardId: string;
  actualThiefName: string;
  cards: SuspectCardData[];
  players: DetectiveRoundResultPlayer[];
  timerCountdown?: number;
}

export interface DetectiveMatchAward {
  title: string;
  player: string;
  detail: string;
  icon: string;
  code: string;
}

export interface DetectiveFinalRankingPlayer {
  id: string;
  userId?: string;
  name: string;
  avatar?: string;
  rank: number;
  isChampion: boolean;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  avgGuessTime: number;
  fastestGuess: number;
  longestStreak: number;
  title?: string;
}

export interface DetectiveMatchResult {
  roomCode: string;
  totalRounds: number;
  duration: number;
  champion: DetectiveFinalRankingPlayer;
  leaderboard: DetectiveFinalRankingPlayer[];
  awards: DetectiveMatchAward[];
}

export interface DetectiveChallengeStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalCorrectGuesses: number;
  totalWrongGuesses: number;
  overallAccuracy: number;
  fastestGuessTime: number;
  slowestGuessTime: number;
  averageGuessTime: number;
  currentWinStreak: number;
  longestWinStreak: number;
  longestStreak: number;
  highestAccuracy: number;
  title: string;
  level: number;
  xp: number;
}

// ==========================================
// DOOR OF MYSTERY TYPES
// ==========================================

export type DetectiveDoorOutcome = "SAFE" | "BOMB" | "THIEF" | "CLUE" | "LIFE";
export type DetectivePlayerStatus = "INVESTIGATING" | "CAUGHT" | "ELIMINATED" | "TIMEOUT";

export interface DetectiveDoorResultPayload {
  doorId: number;
  result: DetectiveDoorOutcome;
  clue?: string | null;
  livesRemaining: number;
  attempts: number;
  safeDoorsFound: number;
  bombsTriggered: number;
  status: DetectivePlayerStatus;
  investigationTimeMs?: number | null;
}

export interface DetectivePlayerPublicState {
  id: string;
  name: string;
  avatar?: string;
  lives: number;
  attempts: number;
  bombsTriggered: number;
  safeDoorsFound: number;
  status: DetectivePlayerStatus;
  investigationTimeMs?: number | null;
}

export interface DetectivePublicGameState {
  roomCode: string;
  status: "ACTIVE" | "FINISHED";
  startedAt: number;
  endsAt: number;
  remainingSeconds: number;
  totalDoors: number;
  totalBombs: number;
  totalSafe?: number;
  totalClues?: number;
  totalLife?: number;
  players: DetectivePlayerPublicState[];
}

export interface DetectiveLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  status: DetectivePlayerStatus;
  finalScore: number;
  investigationTimeSec: number | null;
  accuracyPercent: number;
  livesRemaining: number;
  attempts: number;
  bombsTriggered: number;
  safeDoorsFound: number;
  breakdown: {
    accuracyScore: number;
    timeScore: number;
    livesScore: number;
    efficiencyScore: number;
  };
}

export interface DetectiveGameFinishedPayload {
  roomCode: string;
  leaderboard: DetectiveLeaderboardEntry[];
  champion?: {
    id: string;
    name: string;
    finalScore: number;
    status: DetectivePlayerStatus;
  } | null;
  secretLayout: {
    thiefDoor: number;
    bombDoors: number[];
  };
}

export interface DetectiveReconnectSyncPayload {
  publicState: DetectivePublicGameState;
  myState?: {
    id: string;
    lives: number;
    attempts: number;
    safeDoorsFound: number;
    bombsTriggered: number;
    status: DetectivePlayerStatus;
    investigationTimeMs?: number | null;
    clue?: string | null;
    revealedDoors: {
      doorId: number;
      result: DetectiveDoorOutcome;
    }[];
  } | null;
}

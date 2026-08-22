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

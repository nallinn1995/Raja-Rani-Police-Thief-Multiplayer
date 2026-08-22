export type ModernRole = 'Raja' | 'Rani' | 'Police' | 'Thief' | 'Mantri' | 'Villager';

export interface ModernRoleDetails {
  role: ModernRole;
  title: string;
  emoji: string;
  image: string;
  baseScore: number;
  description: string;
  color: string;
  borderColor: string;
  glowColor: string;
}

export const MODERN_ROLES_CONFIG: Record<ModernRole, ModernRoleDetails> = {
  Raja: {
    role: 'Raja',
    title: 'Raja (King)',
    emoji: '👑',
    image: '/assets/images/raja.png',
    baseScore: 1000,
    description: 'Find your Queen during the Royal Phase to earn +100 bonus.',
    color: 'from-amber-600 to-yellow-800',
    borderColor: 'border-yellow-400',
    glowColor: 'rgba(250, 204, 21, 0.4)',
  },
  Rani: {
    role: 'Rani',
    title: 'Rani (Queen)',
    emoji: '👸',
    image: '/assets/images/rani.png',
    baseScore: 800,
    description: 'Find your King during the Royal Phase to earn +100 bonus.',
    color: 'from-purple-600 to-pink-800',
    borderColor: 'border-pink-400',
    glowColor: 'rgba(244, 114, 182, 0.4)',
  },
  Police: {
    role: 'Police',
    title: 'Police Inspector',
    emoji: '👮',
    image: '/assets/images/police.png',
    baseScore: 500,
    description: 'Identify the Thief during Investigation Phase to earn 500 + 100 bonus.',
    color: 'from-blue-600 to-slate-800',
    borderColor: 'border-blue-400',
    glowColor: 'rgba(96, 165, 250, 0.4)',
  },
  Thief: {
    role: 'Thief',
    title: 'Master Thief',
    emoji: '🕵️',
    image: '/assets/images/thief.png',
    baseScore: 0,
    description: 'Secretly loot 100 points from kingdom members and escape detection.',
    color: 'from-emerald-700 to-teal-900',
    borderColor: 'border-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.4)',
  },
  Mantri: {
    role: 'Mantri',
    title: 'Royal Minister',
    emoji: '🏛️',
    image: '/assets/images/mantri.png',
    baseScore: 700,
    description: 'Secretly protect one kingdom member with Royal Shield to prevent loot.',
    color: 'from-indigo-600 to-purple-800',
    borderColor: 'border-indigo-400',
    glowColor: 'rgba(129, 140, 248, 0.4)',
  },
  Villager: {
    role: 'Villager',
    title: 'Kingdom Witness',
    emoji: '👨',
    image: '/assets/images/villager.png',
    baseScore: 400,
    description: 'Judge the Police investigation (Agree / Disagree) to earn +100 bonus.',
    color: 'from-amber-700 to-orange-900',
    borderColor: 'border-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.4)',
  },
};

export interface ModernPlayerState {
  id: string;
  userId?: string;
  name: string;
  isHost: boolean;
  score: number;
  initialScore: number;
  role: ModernRole | null;
  isRoleRevealed: boolean;
  stolenLoot: number;
  isShielded: boolean;
  hasSubmittedAction: boolean;
  isOnline: boolean;
  avatar?: string;
}

export type ModernPhase =
  | 'rules'
  | 'mantri-shield'
  | 'loot-animation'
  | 'royal-phase'
  | 'investigation-phase'
  | 'witness-phase'
  | 'result-phase'
  | 'finished';

export interface ModernRoundResultData {
  rajaResult: {
    targetId: string | null;
    targetName: string | null;
    isCorrect: boolean;
    bonusEarned: number;
  };
  raniResult: {
    targetId: string | null;
    targetName: string | null;
    isCorrect: boolean;
    bonusEarned: number;
  };
  policeResult: {
    policeId: string;
    policeName: string;
    guessedId: string | null;
    guessedName: string | null;
    thiefId: string;
    thiefName: string;
    isCorrect: boolean;
    catchBonus: number;
  };
  villagerResult: {
    villagerId: string;
    villagerName: string;
    choice: 'agree' | 'disagree' | null;
    isBonusEarned: boolean;
    bonusType: 'witness' | 'insight' | 'none';
    bonusPoints: number;
  };
  mantriResult: {
    mantriId: string;
    mantriName: string;
    protectedTargetRole: ModernRole | null;
    protectedTargetName: string | null;
    isShieldSuccessful: boolean;
    supportBonus: number;
    protectedThief?: boolean;
  };
  thiefResult: {
    thiefId: string;
    thiefName: string;
    escaped: boolean;
    stolenTotal: number;
    finalThiefScore: number;
  };
  currentRound?: number;
  totalRounds?: number;
  winCondition?: string;
  targetScore?: number;
  isGameOver?: boolean;
  scores: Array<{
    playerId: string;
    name: string;
    role: ModernRole;
    baseScore: number;
    lootedPoints: number;
    preventedLoot: number;
    bonusPoints: number;
    totalBonusPoints?: number;
    penaltyPoints: number;
    roundScore?: number;
    cumulativeScore?: number;
    finalScore: number;
    roundHistory?: Array<{
      round: number;
      roundScore: number;
      bonusPoints: number;
    }>;
    awards: string[];
    rank?: number;
  }>;
  winner: {
    playerId: string;
    name: string;
    role: ModernRole;
    score: number;
  };
}

export interface ModernPlayerStatsData {
  userId: string;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestScore: number;
  currentWinStreak: number;
  longestWinStreak: number;
  timesRaja: number;
  timesRani: number;
  timesPolice: number;
  timesThief: number;
  timesMantri: number;
  timesVillager: number;
  correctRajaGuesses: number;
  correctRaniGuesses: number;
  policeCatches: number;
  policeWrongGuesses: number;
  thiefEscapes: number;
  villagerWitnessBonuses: number;
  villagerInsightBonuses: number;
  mantriShieldSuccesses: number;
  averageMatchDuration: number;
  favoriteRole: ModernRole | string;
  mostPlayedRole: ModernRole | string;
  recentMatches: Array<{
    matchId: string;
    roomCode: string;
    role: ModernRole;
    finalScore: number;
    rank: number;
    won: boolean;
    createdAt: string;
  }>;
}

export interface ModernAchievementData {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

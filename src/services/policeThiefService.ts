const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface PoliceThiefProfileData {
  user: {
    id: string;
    username: string;
    avatar: string;
    title: string;
    level: number;
    xp: number;
    createdAt: string;
    lastPlayedAt: string;
  };
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    detectiveWins: number;
    totalCorrectCatches: number;
    totalWrongGuesses: number;
    policeAccuracy: number;
    timesPlayedAsPolice: number;
    fastestCorrectCatch: number;
    averageGuessTime: number;
    currentDetectiveWinStreak: number;
    longestDetectiveWinStreak: number;
    timesPlayedAsThief: number;
    thiefEscaped: number;
    thiefCaught: number;
    escapeRate: number;
    currentEscapeStreak: number;
    longestEscapeStreak: number;
    records?: {
      highestAccuracyInMatch: number;
      mostCatchesInMatch: number;
      mostEscapesInMatch: number;
      fastestCatchSeconds: number;
    };
  };
  achievements: Array<{
    _id: string;
    code: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
  titles: Array<{
    _id: string;
    title: string;
    category: string;
    unlockedAt: string;
  }>;
  recentMatches: Array<{
    _id: string;
    roomCode: string;
    date: string;
    matchResult: "win" | "loss";
    rolePlayed: string;
    scoreEarned: number;
    rank: number;
    correctCatches: number;
    wrongGuesses: number;
    policeAccuracy: number;
    thiefEscaped: number;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  title: string;
  metrics: {
    detectiveWins: number;
    correctCatches: number;
    wrongGuesses: number;
    accuracy: number;
    policeTurns: number;
    thiefEscaped: number;
    escapeRate: number;
    fastestCatch: number;
    longestStreak: number;
  };
}

export interface AdminDashboardData {
  metrics: {
    totalMatches: number;
    activePlayers: number;
    avgAccuracy: number;
    avgMatchDuration: number;
  };
  recentMatches: Array<any>;
  topLeaderboard: Array<LeaderboardEntry>;
  recentAchievements: Array<any>;
  matchesPerDay: Array<{ date: string; count: number }>;
}

export const policeThiefService = {
  async recordRound(roundData: any) {
    const resp = await fetch(`${API_BASE_URL}/api/police-thief/round`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roundData),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || "Failed to record round");
    }
    return resp.json();
  },

  async recordMatch(matchData: any) {
    const resp = await fetch(`${API_BASE_URL}/api/police-thief/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(matchData),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || "Failed to record match");
    }
    return resp.json();
  },

  async getProfile(userId: string): Promise<PoliceThiefProfileData> {
    const resp = await fetch(`${API_BASE_URL}/api/police-thief/profile/${encodeURIComponent(userId)}`);
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || "Failed to fetch profile");
    }
    return resp.json();
  },

  async getLeaderboard(category = "top_detective", limit = 50): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const resp = await fetch(`${API_BASE_URL}/api/police-thief/leaderboard?category=${encodeURIComponent(category)}&limit=${limit}`);
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || "Failed to fetch leaderboard");
    }
    return resp.json();
  },

  async getAdminDashboard(token: string): Promise<AdminDashboardData> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/police-thief/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || "Failed to fetch admin dashboard");
    }
    return resp.json();
  },
};

export default policeThiefService;

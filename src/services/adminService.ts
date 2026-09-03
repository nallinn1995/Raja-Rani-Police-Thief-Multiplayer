const API_BASE = import.meta.env.VITE_SERVER_URL || "";

export interface AdminUser {
  _id: string;
  username: string;
  role: "user" | "admin";
  isGuest: boolean;
  isBanned?: boolean;
  createdAt: string;
  level?: number;
  xp?: number;
  title?: string;
  avatar?: string;
  country?: string;
  description?: string;
  totalGames?: number;
  offlineGamesPlayed?: number;
  totalWins?: number;
  password?: string;
}

export interface ModernAdminDashboardData {
  metrics: {
    totalMatches: number;
    totalPlayers: number;
    avgScorePerPlayer: number;
    rolesCount: {
      raja: number;
      rani: number;
      mantri: number;
      police: number;
      thief: number;
      villager: number;
    };
  };
  recentMatches: Array<{
    _id: string;
    roomCode: string;
    winnerName: string;
    totalRounds: number;
    duration: number;
    createdAt: string;
  }>;
  topLeaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    level: number;
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    highestScore: number;
    currentWinStreak: number;
    longestWinStreak: number;
    roleStats: {
      raja: number;
      rani: number;
      mantri: number;
      police: number;
      thief: number;
      villager: number;
    };
  }>;
}

export interface OverviewStats {
  totalUsers: number;
  totalRegisteredUsers?: number;
  totalGuestPlayers?: number;
  totalPlayers?: number;
  totalGuestMatches?: number;
  totalGuestGamesStarted?: number;
  totalAdmins: number;
  totalBanned: number;
  totalMatches: number;
  totalOnlineGames?: number;
  totalOfflineGames?: number;
  totalRegisteredOfflineGames?: number;
  totalGuestOfflineGames?: number;
  classicMatchesCount?: number;
  policeThiefMatchesCount?: number;
  modernMatchesCount?: number;
  totalStatsRecords: number;
  totalDcStatsRecords?: number;
  totalModernStatsRecords?: number;
  activeRoomsCount: number;
  classicRoomsCount?: number;
  policeThiefRoomsCount?: number;
  modernRoomsCount?: number;
  totalPlayersInRooms: number;
  connectedSockets: number;
  uptimeSeconds: number;
  serverMemory?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  registeredUsersCount?: number;
  systemConfig: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    announcement: string;
    maxPlayersPerRoom: number;
    pointsRules: Record<string, number>;
  };
}

export interface GuestSessionRecord {
  _id: string;
  guestDeviceId: string;
  username: string;
  firstSeenAt: string;
  lastSeenAt: string;
  gamesPlayed: number;
  matchesCompleted: number;
  lastPlayedMode: string;
  lastPlayedAt?: string;
}

export interface ActiveRoom {
  roomCode: string;
  mode: string;
  gameState: string;
  rounds: number;
  currentRound: number;
  playersCount: number;
  players: Array<{
    id: string;
    name: string;
    score: number;
    isHost: boolean;
    isReady: boolean;
    socketId?: string;
  }>;
  createdAt: string;
}

export interface PlayerStatsRecord {
  _id: string;
  userId: string;
  username: string;
  level: number;
  xp: number;
  title: string;
  avatar: string;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalScore: number;
  currentWinStreak: number;
  longestWinStreak: number;
  roleStats?: {
    raja?: { timesAssigned: number; totalPoints: number };
    rani?: { timesAssigned: number; totalPoints: number };
    police?: { timesAssigned: number; correctCatches: number; wrongGuesses: number };
    thief?: { timesAssigned: number; escaped: number; caught: number };
  };
  detectiveStats?: {
    gamesPlayed?: number;
    gamesWon?: number;
    overallAccuracy?: number;
    xp?: number;
    level?: number;
    title?: string;
  } | null;
  modernStats?: {
    gamesPlayed?: number;
    gamesWon?: number;
    totalScore?: number;
    highestScore?: number;
    currentWinStreak?: number;
    longestWinStreak?: number;
    timesRaja?: number;
    timesRani?: number;
    timesPolice?: number;
    timesThief?: number;
    timesMantri?: number;
    timesVillager?: number;
  } | null;
  updatedAt: string;
}

export interface MatchRecord {
  _id: string;
  roomCode: string;
  gameMode: string;
  totalRounds?: number;
  duration?: number;
  winnerUsername: string;
  details?: string;
  players: Array<{
    userId?: string;
    username?: string;
    name?: string;
    score?: number;
    rank?: number;
    isWinner?: boolean;
  }>;
  createdAt: string;
}

class AdminService {
  private tokenKey = "raja_rani_admin_token";

  setAdminToken(token: string) {
    sessionStorage.setItem(this.tokenKey, token);
  }

  getAdminToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  logout() {
    sessionStorage.removeItem(this.tokenKey);
  }

  isAdminLoggedIn(): boolean {
    return !!this.getAdminToken();
  }

  private getHeaders(): HeadersInit {
    const token = this.getAdminToken();
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async login(password: string, username?: string): Promise<{ token: string; admin: any }> {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, username }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Admin login failed");
    }

    if (data.token) {
      this.setAdminToken(data.token);
    }
    return data;
  }

  async getOverview(): Promise<OverviewStats> {
    const res = await fetch(`${API_BASE}/api/admin/overview`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch overview");
    return data;
  }

  async getUsers(search = "", role = "all"): Promise<AdminUser[]> {
    const query = new URLSearchParams({ search, role }).toString();
    const res = await fetch(`${API_BASE}/api/admin/users?${query}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch users");
    return data.users || [];
  }

  async createUser(userData: Partial<AdminUser>): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create user");
    return data.user;
  }

  async updateUser(id: string, userData: Partial<AdminUser>): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update user");
    return data.user;
  }

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete user");
  }

  async toggleBanUser(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/admin/users/${id}/ban`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to toggle ban");
    return data.isBanned;
  }

  async getActiveRooms(): Promise<ActiveRoom[]> {
    const res = await fetch(`${API_BASE}/api/admin/rooms`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch active rooms");
    return data.rooms || [];
  }

  async closeRoom(roomCode: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/rooms/${roomCode}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to close room");
  }

  async kickPlayer(roomCode: string, playerId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/rooms/${roomCode}/kick`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ playerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to kick player");
  }

  async getPlayerStats(search = ""): Promise<PlayerStatsRecord[]> {
    const res = await fetch(`${API_BASE}/api/admin/player-stats?search=${encodeURIComponent(search)}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch player stats");
    return data.stats || [];
  }

  async updatePlayerStats(id: string, statsData: Partial<PlayerStatsRecord>): Promise<PlayerStatsRecord> {
    const res = await fetch(`${API_BASE}/api/admin/player-stats/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(statsData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update stats record");
    return data.stats;
  }

  async resetPlayerStats(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/player-stats/${id}/reset`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reset stats");
  }

  async getMatches(search = "", gameMode = ""): Promise<MatchRecord[]> {
    const query = new URLSearchParams({ search, gameMode }).toString();
    const res = await fetch(`${API_BASE}/api/admin/matches?${query}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch match history");
    return data.matches || [];
  }

  async deleteMatch(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/matches/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete match record");
  }

  async clearAllMatches(): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/matches`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to clear match history");
  }

  async broadcastAnnouncement(message: string, type = "info"): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/broadcast`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ message, type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send announcement");
  }

  async getModernModeAdminData(): Promise<ModernAdminDashboardData> {
    const res = await fetch(`${API_BASE}/api/admin/modern-mode/dashboard`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch Modern Mode dashboard data");
    return data;
  }

  async getSystemConfig(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch system config");
    return data.config;
  }

  async getGuestSessionsList(search = "", limit = 100): Promise<GuestSessionRecord[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (limit) params.append("limit", limit.toString());

    const res = await fetch(`${API_BASE}/api/admin/guests?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch guest sessions");
    return data.guests || [];
  }

  async updateSystemConfig(configData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(configData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update config");
    return data.config;
  }
}

export const adminService = new AdminService();

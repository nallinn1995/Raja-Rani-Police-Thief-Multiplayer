import { pushNotificationService } from "./pushNotificationService";
const API_BASE = import.meta.env.VITE_SERVER_URL || "";

export interface AdminUser {
  _id: string;
  username: string;
  role: "user" | "admin" | "guest" | string;
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
  isRegistered?: boolean;
  isGuestuser?: boolean;
  IsPermissionEnabled?: boolean;
  isappinstalled?: boolean;
  guestDeviceId?: string;
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
  detectiveMatchesCount?: number;
  policeThiefMatchesCount?: number;
  modernMatchesCount?: number;
  totalStatsRecords: number;
  totalDcStatsRecords?: number;
  totalModernStatsRecords?: number;
  activeRoomsCount: number;
  classicRoomsCount?: number;
  detectiveRoomsCount?: number;
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
    pushNotificationService.handleLogout().catch(() => {});
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
      pushNotificationService.handleLogin().catch(() => {});
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

  // Push Notifications API
  async getPushNotificationData(): Promise<{
    metrics: {
      totalInstallations: number;
      enabledInstallations: number;
      registeredUsersWithPush: number;
      guestInstallations: number;
      isFirebaseConfigured: boolean;
    };
    recent: Array<{
      _id: string;
      title: string;
      body: string;
      targetType: "ALL" | "INSTALLATION" | "USER";
      targetId?: string | null;
      targetCount: number;
      successCount: number;
      failureCount: number;
      status: "PROCESSING" | "SENT" | "PARTIAL" | "FAILED";
      createdBy: string;
      deepLink?: string;
      createdAt: string;
      sentAt?: string;
    }>;
  }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch push notification data");
    return data;
  }

  async sendPushNotification(payload: {
    title: string;
    body: string;
    targetType: "ALL" | "INSTALLATION" | "USER" | "ALL_ENABLED" | "REGISTERED_USERS" | "SPECIFIC_USER" | "SPECIFIC_INSTALLATION";
    targetId?: string | null;
    deepLink?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/send`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send notification");
    return data;
  }

  // --- Phase 2: Campaigns & Templates API ---

  async getCampaigns(params?: { status?: string; type?: string; search?: string }): Promise<{
    campaigns: NotificationCampaignItem[];
    stats: {
      totalCampaigns: number;
      activeRecurring: number;
      scheduledOneTime: number;
      totalRuns: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.type) query.append("type", params.type);
    if (params?.search) query.append("search", params.search);

    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch campaigns");
    return data;
  }

  async getCampaignById(id: string): Promise<{
    campaign: NotificationCampaignItem;
    runs: NotificationCampaignRunItem[];
  }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns/${id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch campaign details");
    return data;
  }

  async createCampaign(payload: Partial<NotificationCampaignItem>): Promise<{ campaign: NotificationCampaignItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create campaign");
    return data;
  }

  async updateCampaign(id: string, payload: Partial<NotificationCampaignItem>): Promise<{ campaign: NotificationCampaignItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update campaign");
    return data;
  }

  async pauseCampaign(id: string): Promise<{ campaign: NotificationCampaignItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns/${id}/pause`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to pause campaign");
    return data;
  }

  async resumeCampaign(id: string): Promise<{ campaign: NotificationCampaignItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns/${id}/resume`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to resume campaign");
    return data;
  }

  async cancelCampaign(id: string): Promise<{ campaign: NotificationCampaignItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns/${id}/cancel`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to cancel campaign");
    return data;
  }

  async archiveCampaign(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to archive campaign");
    return data;
  }

  async getCampaignRuns(id: string): Promise<{ runs: NotificationCampaignRunItem[] }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/campaigns/${id}/runs`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch campaign runs");
    return data;
  }

  async getTemplates(): Promise<{ templates: NotificationTemplateItem[] }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/templates`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch templates");
    return data;
  }

  async createTemplate(payload: Partial<NotificationTemplateItem>): Promise<{ template: NotificationTemplateItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/templates`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create template");
    return data;
  }

  async updateTemplate(id: string, payload: Partial<NotificationTemplateItem>): Promise<{ template: NotificationTemplateItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/templates/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update template");
    return data;
  }

  async duplicateTemplate(id: string): Promise<{ template: NotificationTemplateItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/templates/${id}/duplicate`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to duplicate template");
    return data;
  }

  async deleteTemplate(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/templates/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete template");
    return data;
  }

  // --- Phase 3: Automatic Game Events, Audience Estimation & Analytics ---

  async getAutomaticEvents(): Promise<{ configs: AutomaticEventConfigItem[] }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/automatic-events`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch automatic events");
    return data;
  }

  async updateAutomaticEvent(
    eventType: string,
    payload: Partial<AutomaticEventConfigItem>
  ): Promise<{ config: AutomaticEventConfigItem }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/automatic-events/${eventType}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update automatic event");
    return data;
  }

  async estimateAudience(filter: {
    levelMin?: number | null;
    levelMax?: number | null;
    lastPlayedDays?: number | null;
    gameMode?: string | null;
    onlyPushEnabled?: boolean;
  }): Promise<{ estimate: AudienceEstimateResult }> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/audience/estimate`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(filter),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to estimate audience");
    return data;
  }

  async getNotificationAnalytics(params?: {
    range?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<NotificationAnalyticsSummary> {
    const q = new URLSearchParams();
    if (params?.range) q.set("range", params.range);
    if (params?.startDate) q.set("startDate", params.startDate);
    if (params?.endDate) q.set("endDate", params.endDate);

    const res = await fetch(`${API_BASE}/api/admin/notifications/analytics?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch notification analytics");
    return data;
  }

  async exportAnalyticsCsv(range: string = "last30days"): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/admin/notifications/analytics/export?range=${range}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to export analytics CSV");
    return await res.blob();
  }
}

export interface NotificationCampaignItem {
  _id: string;
  name: string;
  type: "ONE_TIME" | "RECURRING";
  title: string;
  body: string;
  icon?: string;
  image?: string | null;
  deepLink?: string;
  targetType: "ALL_ENABLED" | "REGISTERED_USERS" | "SPECIFIC_USER" | "SPECIFIC_INSTALLATION";
  targetUserIds?: string[];
  targetInstallationIds?: string[];
  schedule: {
    timezone: string;
    startAt: string;
    endAt?: string | null;
    recurrence?: {
      frequency: "DAILY" | "WEEKLY" | "MONTHLY";
      interval?: number;
      daysOfWeek?: number[];
      dayOfMonth?: number;
      timeOfDay: string;
    };
  };
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | "FAILED";
  createdBy: string;
  updatedBy?: string | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  runCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCampaignRunItem {
  _id: string;
  campaignId: string;
  campaignName: string;
  scheduledAt: string;
  startedAt: string;
  completedAt?: string | null;
  targetCount: number;
  successCount: number;
  failureCount: number;
  status: "PROCESSING" | "SENT" | "PARTIAL" | "FAILED";
  errorSummary?: string | null;
  executedBy: string;
  createdAt: string;
}

export interface NotificationTemplateItem {
  _id: string;
  name: string;
  category: "GENERAL" | "GAME" | "EVENT" | "REMINDER" | "REWARD" | "ANNOUNCEMENT";
  title: string;
  body: string;
  icon?: string;
  image?: string | null;
  deepLink?: string;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomaticEventConfigItem {
  _id: string;
  eventType: string;
  displayName: string;
  category: "FRIENDS" | "ROOMS" | "ACHIEVEMENTS" | "LEVEL_UP" | "REMINDERS";
  enabled: boolean;
  cooldownMinutes: number;
  titleTemplate: string;
  bodyTemplate: string;
  deepLinkTemplate: string;
  availableVariables: string[];
  description?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AudienceEstimateResult {
  totalUsers: number;
  matchingStatsUsers: number;
  eligibleInstallations: number;
  optedOutCount: number;
  inQuietHoursCount: number;
  rateLimitedCount: number;
  estimatedDeliveryCount: number;
}

export interface NotificationAnalyticsSummary {
  success: boolean;
  window: {
    start: string;
    end: string;
    range: string;
  };
  metrics: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalOpened: number;
    totalClicked: number;
    deliveryRate: number;
    openRate: number;
    ctr: number;
  };
  topCampaigns: Array<{
    campaignId: string;
    name: string;
    type: string;
    sent: number;
    opened: number;
    clicked: number;
    ctr: string;
  }>;
  topEventTypes: Array<{
    category: string;
    sent: number;
    opened: number;
    openRate: string;
  }>;
}

export const adminService = new AdminService();




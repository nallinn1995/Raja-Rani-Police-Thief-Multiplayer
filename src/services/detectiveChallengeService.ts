import { adminService } from "./adminService";

const API_BASE = import.meta.env.VITE_SERVER_URL || "";

export const detectiveChallengeService = {
  async getProfile(userId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/detective-challenge/profile/${userId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch Detective Challenge profile");
    }
    return res.json();
  },

  async getLeaderboard(category = "highest_accuracy", limit = 50): Promise<any> {
    const res = await fetch(
      `${API_BASE}/api/detective-challenge/leaderboard?category=${category}&limit=${limit}`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch Detective Challenge leaderboard");
    }
    return res.json();
  },

  async getAdminDashboard(): Promise<any> {
    const token = adminService.getAdminToken();
    const res = await fetch(`${API_BASE}/api/admin/detective-challenge/dashboard`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch Detective Challenge admin dashboard data");
    }
    return res.json();
  },

  async recordRound(roundData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/api/detective-challenge/round`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roundData),
    });
    if (!res.ok) throw new Error("Failed to record Detective round");
    return res.json();
  },

  async recordMatch(matchData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/api/detective-challenge/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(matchData),
    });
    if (!res.ok) throw new Error("Failed to record Detective match");
    return res.json();
  },
};

import type { ModernPlayerStatsData, ModernAchievementData } from '../../types/modernMode';

const API_URL = import.meta.env.VITE_SERVER_URL || '';

export const modernModeService = {
  async getProfileStats(userId: string): Promise<ModernPlayerStatsData | null> {
    try {
      const res = await fetch(`${API_URL}/api/modern-mode/stats/${userId}`);
      const data = await res.json();
      if (data.success) {
        return data.stats;
      }
      return null;
    } catch (err) {
      console.error('Error fetching modern mode profile stats:', err);
      return null;
    }
  },

  async getAchievements(userId: string): Promise<ModernAchievementData[]> {
    try {
      const res = await fetch(`${API_URL}/api/modern-mode/achievements/${userId}`);
      const data = await res.json();
      if (data.success) {
        return data.achievements;
      }
      return [];
    } catch (err) {
      console.error('Error fetching modern mode achievements:', err);
      return [];
    }
  },

  async getLeaderboard() {
    try {
      const res = await fetch(`${API_URL}/api/modern-mode/leaderboard`);
      const data = await res.json();
      if (data.success) {
        return data.leaderboard;
      }
      return [];
    } catch (err) {
      console.error('Error fetching modern mode leaderboard:', err);
      return [];
    }
  },
};

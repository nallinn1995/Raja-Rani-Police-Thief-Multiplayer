const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
import { authService } from "./authService";

export const profileService = {
  async getProfile(userId: string) {
    console.debug(`[profileService] Fetching profile for user ID ${userId}`);
    const resp = await authService.authFetch(
      `${API_BASE_URL}/api/profile/user/${encodeURIComponent(userId)}`,
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      console.error("[profileService] profile fetch failed", {
        userId,
        status: resp.status,
        body: err,
      });
      throw new Error(err?.error || `Failed to fetch profile (${resp.status})`);
    }
    return resp.json();
  },

  async updateProfile(payload: { userId: string; username?: string; description?: string; avatar?: string }) {
    console.debug("[profileService] Updating profile");
    const resp = await authService.authFetch(`${API_BASE_URL}/api/profile/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || `Failed to update profile (${resp.status})`);
    }
    return resp.json();
  },
};

export default profileService;

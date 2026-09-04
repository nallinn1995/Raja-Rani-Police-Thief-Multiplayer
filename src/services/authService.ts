const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
import { pushNotificationService } from "./pushNotificationService";

export interface User {
  id?: string;
  _id?: string;
  username: string;
  email?: string;
  isGuest: boolean;
  guestDeviceId?: string;
  googleId?: string;
  authProvider?: "local" | "google";
  role?: "user" | "admin";
  createdAt: string;
  avatar?: string;
  description?: string;
}

export const authService = {
  async loginGoogle(credential: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Google authentication failed");
    }

    const data = await response.json();
    this.setSession(data.user, data.token, data.refreshToken);
    return data.user;
  },

  async signIn(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to sign in");
    }

    const data = await response.json();
    this.setSession(data.user, data.token, data.refreshToken);
    return data.user;
  },

  async signUp(username: string, email: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to sign up");
    }

    const data = await response.json();
    this.setSession(data.user, data.token, data.refreshToken);
    return data.user;
  },

  async forgotPassword(emailOrUsername: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailOrUsername }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send reset code");
    }

    return await response.json();
  },

  async resetPassword(emailOrUsername: string, otpCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailOrUsername, otpCode, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to reset password");
    }

    return await response.json();
  },

  async refreshSession(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      if (data.token && data.refreshToken) {
        this.setSessionTokens(data.token, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  getGuestDeviceId(): string {
    let deviceId = localStorage.getItem("guest_device_id");
    if (!deviceId) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        deviceId = crypto.randomUUID();
      } else {
        deviceId = "g_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now().toString(36);
      }
      localStorage.setItem("guest_device_id", deviceId);
    }
    return deviceId;
  },

  loginGuest(): User {
    const guestDeviceId = this.getGuestDeviceId();
    const guestUser: User = {
      id: undefined,
      username: `Guest_${Math.floor(Math.random() * 10000)}`,
      isGuest: true,
      guestDeviceId,
      createdAt: new Date().toISOString(),
    };
    this.setSession(guestUser, null, null);

    // Fire-and-forget anonymous guest ping to backend
    fetch(`${API_BASE_URL}/api/guest/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestDeviceId,
        username: guestUser.username,
      }),
    }).catch(() => {});

    return guestUser;
  },

  setSession(user: User, accessToken: string | null, refreshToken?: string | null) {
    sessionStorage.setItem("current_user", JSON.stringify(user));
    this.setSessionTokens(accessToken, refreshToken);
    if (!user.isGuest) {
      pushNotificationService.handleLogin().catch(() => {});
    }
  },

  setSessionTokens(accessToken: string | null, refreshToken?: string | null) {
    if (accessToken) {
      sessionStorage.setItem("access_token", accessToken);
    } else {
      sessionStorage.removeItem("access_token");
    }

    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    } else if (refreshToken === null) {
      localStorage.removeItem("refresh_token");
    }
  },

  setCurrentUser(user: User) {
    this.setSession(user, this.getAccessToken(), this.getRefreshToken());
  },

  getCurrentUser(): User | null {
    const data = sessionStorage.getItem("current_user");
    return data ? JSON.parse(data) : null;
  },

  getAccessToken(): string | null {
    return sessionStorage.getItem("access_token");
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  },

  getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...options.headers,
      ...this.getAuthHeaders(),
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401 && this.getRefreshToken()) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        const newHeaders = {
          ...options.headers,
          ...this.getAuthHeaders(),
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      }
    }

    return response;
  },

  logout() {
    pushNotificationService.handleLogout().catch(() => {});
    sessionStorage.removeItem("current_user");
    sessionStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

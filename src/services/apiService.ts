const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
import { authService } from "./authService";

export const apiService = {
  async createRoom(
    roomName: string,
    playerName: string,
    totalRounds: number,
    options?: {
      gameMode?: string;
      winCondition?: string;
      targetScore?: number;
      policeTurnsPerPlayer?: number;
    },
    userId?: string
  ) {
    const guestDeviceId = authService.getGuestDeviceId();
    const response = await authService.authFetch(`${API_BASE_URL}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName,
        playerName,
        totalRounds,
        userId,
        guestDeviceId,
        gameMode: options?.gameMode,
        winCondition: options?.winCondition,
        targetScore: options?.targetScore,
        policeTurnsPerPlayer: options?.policeTurnsPerPlayer,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create room");
    }

    const data = await response.json();
    sessionStorage.setItem("playerToken", data.playerToken);
    return data;
  },

  async joinRoom(roomCode: string, playerName: string, userId?: string) {
    const guestDeviceId = authService.getGuestDeviceId();
    const response = await authService.authFetch(`${API_BASE_URL}/api/rooms/${roomCode}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerName, userId, guestDeviceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to join room");
    }

    const data = await response.json();
    sessionStorage.setItem("playerToken", data.playerToken);
    return data;
  },

  async recordOfflineGameStarted(userId?: string) {
    try {
      const guestDeviceId = authService.getGuestDeviceId();
      await authService.authFetch(`${API_BASE_URL}/api/stats/offline-game-started`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, guestDeviceId }),
      });
    } catch (err) {
      console.warn("Failed to record offline game metric:", err);
    }
  },
};

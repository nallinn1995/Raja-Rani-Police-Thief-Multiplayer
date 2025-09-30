const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const apiService = {
  async createRoom(roomName: string, playerName: string, totalRounds: number) {
    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName, playerName, totalRounds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create room");
    }

    return response.json();
  },

  async joinRoom(roomCode: string, playerName: string) {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to join room");
    }

    return response.json();
  },
};

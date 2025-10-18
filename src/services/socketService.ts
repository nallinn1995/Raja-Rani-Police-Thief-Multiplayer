import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private serverUrl = import.meta.env.VITE_SERVER_URL || "";

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 1000,
      });

      // Debug logs
      this.socket.on("connect", () => {
        console.log("✅ Connected to server:", this.socket?.id);
      });

      this.socket.on("connect_error", (err) => {
        console.error("❌ Connection error:", err.message);
      });

      this.socket.on("disconnect", (reason) => {
        console.warn("⚠️ Disconnected:", reason);
      });
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.off("connect");
      this.socket.off("connect_error");
      this.socket.off("disconnect");

      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();

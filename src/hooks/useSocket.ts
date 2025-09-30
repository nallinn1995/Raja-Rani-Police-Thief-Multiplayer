import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import socketService from "../services/socketService";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // connect
    socketRef.current = socketService.connect();

    if (socketRef.current) {
      // add listeners for connection status
      socketRef.current.on("connect", () => {
        console.log("✅ Connected to server:", socketRef.current?.id);
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("❌ Connection error:", err.message);
      });
    }

    // cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
};

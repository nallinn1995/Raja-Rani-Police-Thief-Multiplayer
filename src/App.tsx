import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Bounce, ToastContainer, toast } from "react-toastify";

import io from "socket.io-client";
import { apiService } from "./services/apiService";
import { HomePage } from "./components/HomePage";
import { CreateRoom } from "./components/CreateRoom";
import { JoinRoom } from "./components/JoinRoom";
import { WaitingRoom } from "./components/WaitingRoom";
import { GameBoard } from "./components/GameBoard";
import { RoundResult } from "./components/RoundResult";
import { Leaderboard } from "./components/Leaderboard";
import {
  Room,
  Player,
  ChatMessage,
  RoundResult as RoundResultType,
} from "./types/game";
import { Welcome } from "./components/Welcome";

const socket = io(import.meta.env.VITE_SERVER_URL);
let currentRoom: string | null = null;
let playerId = null;

type AppState =
  | "welcome"
  | "home"
  | "create"
  | "join"
  | "waiting"
  | "playing"
  | "result"
  | "leaderboard";

function App() {
  //const socket = useSocket();
  const [appState, setAppState] = useState<AppState>("welcome");
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("");
  const [policeId, setPoliceId] = useState<string>("");
  const [allRoles, setAllRoles] = useState<Player[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResultType | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>("");

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("room-state", (data) => {
      setRoom(data.room);
      setCurrentPlayerId(data.playerId);
      setPoliceId(data.policeId || "");

      const currentPlayer = data.room.players.find(
        (p: Player) => p.id === data.playerId
      );
      if (currentPlayer?.role) {
        setMyRole(currentPlayer.role);
      }

      if (data.room.gameState === "waiting") {
        setAppState("waiting");
      }
    });

    socket.on("player-joined", (data) => {
      if (room) {
        setRoom({ ...room, players: data.players });
      }
    });

    socket.on("game-started", (data) => {
      setRoom((prev) =>
        prev ? { ...prev, ...data, gameState: "role-assignment" } : null
      );
      setAppState("playing");
    });

    socket.on("role-assigned", (data) => {
      setMyRole(data.role);
      setRoom((prev) => (prev ? { ...prev, players: data.players } : null));
    });

    socket.on("police-reveal-phase", () => {
      setRoom((prev) =>
        prev ? { ...prev, gameState: "police-reveal" } : null
      );
    });

    socket.on("all-roles", (data) => {
      setAllRoles(data.players);
    });

    socket.on("police-revealed", (data) => {
      console.log(data);
      toast(`${data.policeName} : I am Police and going to catch theif Now😎`);
      setPoliceId(data.policeId);
      setRoom((prev) => (prev ? { ...prev, gameState: "guessing" } : null));
    });

    socket.on("round-result", (data) => {
      setRoundResult(data);
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              gameState: "results",
              players: data.players.map((p: any) => ({
                ...p,
                role: undefined,
              })),
            }
          : null
      );
      setAppState("result");
      setAllRoles([]);
    });

    socket.on("game-finished", (data) => {
      setLeaderboard(data.leaderboard);
      setAppState("leaderboard");
    });

    socket.on("chat-message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("chat-history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("connect_error", (err) => {
      setError("Connection failed. Please try again.");
      console.error("Socket connection error:", err);
    });

    socket.on("reconnect", () => {
      console.log("✅ Reconnected to server");
      if (currentRoom && currentPlayerId) {
        socket.emit("join-room", { currentRoom, currentPlayerId });
        console.log("🔁 Rejoined room:", currentRoom);
      }
    });

    return () => {
      socket.off("room-state");
      socket.off("player-joined");
      socket.off("game-started");
      socket.off("role-assigned");
      socket.off("police-reveal-phase");
      socket.off("all-roles");
      socket.off("police-revealed");
      socket.off("round-result");
      socket.off("game-finished");
      socket.off("chat-message");
      socket.off("chat-history");
      socket.off("connect_error");
    };
  }, [currentPlayerId, room]);

  const handleCreateRoom = async (
    roomName: string,
    playerName: string,
    totalRounds: number
  ) => {
    return await apiService.createRoom(roomName, playerName, totalRounds);
  };

  const handleJoinRoom = async (roomCode: string, playerName: string) => {
    return await apiService.joinRoom(roomCode, playerName);
  };

  const handleRoomCreated = (roomCode: string, playerId: string) => {
    setCurrentPlayerId(playerId);
    if (socket) {
      currentRoom = roomCode;
      socket.emit("join-room", { roomCode, playerId });
    }
  };

  const handleRoomJoined = (roomCode: string, playerId: string) => {
    setCurrentPlayerId(playerId);
    if (socket) {
      socket.emit("join-room", { roomCode, playerId });
    }
  };

  const handlePoliceReveal = () => {
    if (socket && room) {
      socket.emit("police-reveal", {
        roomCode: room.id,
        playerId: currentPlayerId,
      });
    }
  };

  const handleMakeGuess = (guessedThiefId: string) => {
    if (socket && room) {
      socket.emit("make-guess", {
        roomCode: room.id,
        playerId: currentPlayerId,
        guessedThiefId,
      });
    }
  };

  const handleSendMessage = (message: string) => {
    if (socket && room) {
      socket.emit("chat-message", {
        roomCode: room.id,
        playerId: currentPlayerId,
        message,
      });
    }
  };

  const handlePlayAgain = () => {
    setAppState("home");
    setRoom(null);
    setCurrentPlayerId("");
    setMyRole("");
    setPoliceId("");
    setAllRoles([]);
    setRoundResult(null);
    setLeaderboard([]);
    setMessages([]);
    setError("");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            Connection Error
          </h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <ToastContainer
          position="top-center"
          transition={Bounce}
          theme="dark"
        />
      </div>
      {/* 🎵 Background music runs across all states */}
      {/* Music Toggle Button */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl hover:shadow-[0_10px_40px_rgba(168,85,247,0.6)] hover:scale-110 active:scale-95 transition-all duration-300"
        aria-label="Toggle music"
      >
        {isMusicPlaying ? (
          <Volume2 className="w-6 h-6 animate-pulse" />
        ) : (
          <VolumeX className="w-6 h-6" />
        )}
      </button>

      {/* Background Music */}
      <audio
        ref={audioRef}
        loop
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      />

      {(() => {
        switch (appState) {
          case "welcome":
            return <Welcome startGame={() => setAppState("home")} />;

          case "home":
            return (
              <HomePage
                onCreateRoom={() => setAppState("create")}
                onJoinRoom={() => setAppState("join")}
              />
            );

          case "create":
            return (
              <CreateRoom
                onBack={() => setAppState("home")}
                onRoomCreated={handleRoomCreated}
                createRoom={handleCreateRoom}
              />
            );

          case "join":
            return (
              <JoinRoom
                onBack={() => setAppState("home")}
                onRoomJoined={handleRoomJoined}
                joinRoom={handleJoinRoom}
              />
            );

          case "waiting":
            return room ? (
              <WaitingRoom
                room={room}
                currentPlayerId={currentPlayerId}
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            ) : null;

          case "playing":
            return room ? (
              <GameBoard
                room={room}
                currentPlayerId={currentPlayerId}
                myRole={myRole}
                policeId={policeId}
                allRoles={allRoles}
                messages={messages}
                onPoliceReveal={handlePoliceReveal}
                onMakeGuess={handleMakeGuess}
                onSendMessage={handleSendMessage}
              />
            ) : null;

          case "result":
            return roundResult ? <RoundResult result={roundResult} /> : null;

          case "leaderboard":
            return (
              <Leaderboard
                leaderboard={leaderboard}
                onPlayAgain={handlePlayAgain}
              />
            );

          default:
            return null;
        }
      })()}
    </>
  );
}

export default App;

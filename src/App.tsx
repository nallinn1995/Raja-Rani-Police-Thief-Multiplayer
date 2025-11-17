import { useState, useEffect, useRef, SetStateAction, SetStateAction, SetStateAction, SetStateAction, SetStateAction, SetStateAction } from "react";
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
const SOCKET_URL = import.meta.env.VITE_SERVER_URL;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
});

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
  // 🔄 Reconnect UI state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [reconnectRemaining, setReconnectRemaining] = useState<number>(0); // seconds left

  const [currentRoom, setCurrentRoom] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("");
  const [policeId, setPoliceId] = useState<string>("");
  const [allRoles, setAllRoles] = useState<Player[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResultType | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>("");

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isReconnectingRef = useRef(false);
  const RECONNECT_TIMEOUT_MS = 30000; // 30 seconds default (you can change)


  // refs for timers so we can clear them
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectIntervalRef = useRef<number | null>(null);
  const reconnectDeadlineRef = useRef<number | null>(null);



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

  // 🧠 Remember the last joined room + player for reconnects
  const currentRoomRef = useRef<string | null>(
    localStorage.getItem("roomCode") || null
  );
  const currentPlayerRef = useRef<string | null>(
    localStorage.getItem("playerId") || null
  );

  useEffect(() => {
    const saved = localStorage.getItem("appState");
    if (saved) {
      console.log("ggggggggbbbbbbbbbbb");
      setAppState(saved as AppState);
    }
  }, []);

useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log("✅ Socket connected:", socket.id);

      clearReconnectTimersAndUI();

      // Auto rejoin if previously saved session exists
      const savedRoom = currentRoomRef.current;
      const savedPlayer = currentPlayerRef.current;
      console.log(savedRoom, savedPlayer,"CHECJING.....");
      if (savedRoom && savedPlayer) {
        console.log("🔁 Auto rejoining room after connect:", savedRoom);
        socket.emit("join-room", {
          roomCode: savedRoom,
          playerId: savedPlayer,
        });
      }
    };

    const onRoomState = (data) => {
      console.log("Received room-state:", data);
      setRoom(data.room);
      setCurrentRoom(data.room.id);
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
        localStorage.setItem("appState", "waiting");
      }

      console.log(isReconnectingRef.current);
      // Assuming a successful rejoin is confirmed by receiving room-state
      if (isReconnectingRef.current) {
        // *** FIX: Dismiss toast and hide overlay on successful room-state reception ***
        toast.dismiss("reconnect");
        toast.success("✅ Reconnected successfully!");

        setIsReconnecting(false); // Hide the overlay
        isReconnectingRef.current = false; // Reset the ref
        console.log("Reconnection successful. Overlay hidden.");
      }
    };

    const onPlayerJoined = (data: { players: any; }) => {
      if (room) {
        setRoom({ ...room, players: data.players });
      }
    };

    const onGameStarted = (data: Room | null) => {
      setRoom((prev) =>
        prev ? { ...prev, ...data, gameState: "role-assignment" } : null
      );
      setAppState("playing");
      localStorage.setItem("appState", "playing");
    };

    const onRoleAssigned = (data: { role: SetStateAction<string>; players: any; }) => {
      setMyRole(data.role);
      setRoom((prev) => (prev ? { ...prev, players: data.players } : null));
    };

    const onPoliceRevealPhase = () => {
      setRoom((prev) =>
        prev ? { ...prev, gameState: "police-reveal" } : null
      );
    };

    const onAllRoles = (data: { players: SetStateAction<Player[]>; }) => {
      setAllRoles(data.players);
    };

    const onPoliceRevealed = (data: { policeName: any; policeId: SetStateAction<string>; }) => {
      console.log(data);
      toast(`${data.policeName} : I am Police and going to catch theif Now😎`);
      setPoliceId(data.policeId);
      setRoom((prev) => (prev ? { ...prev, gameState: "guessing" } : null));
    };

    const onRoundResult = (data: SetStateAction<RoundResultType | null>) => {
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
      localStorage.setItem("appState", "result");
      setAllRoles([]);
    };

    const onGameFinished = (data: { leaderboard: SetStateAction<Player[]>; }) => {
      setLeaderboard(data.leaderboard);
      setAppState("leaderboard");
      localStorage.setItem("appState", "leaderboard");
    };

    const onChatMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    const onChatHistory = (history: ChatMessage[]) => {
      setMessages(history);
    };

    const onConnectError = (err: unknown) => {
      console.error("Socket connection error:", err);
      // start reconnect UI (if not already started)
      if (!isReconnecting) {
        beginReconnectFlow();
      }
      // NOTE: We only handle UI for disconnect/reconnect, not connect_error for the overlay
    };

    const onPlayerReconnected = ({ playerId }) => {
      console.log(`🔁 Player ${playerId} reconnected`);
    };

    const onPlayerDisconnected = ({ playerId }) => {
      console.log(`🚫 Player ${playerId} temporarily disconnected`);
    };

    // 🔌 Connection Lost Handler (Uses refs for up-to-date session info)
    const onDisconnect = () => {
      console.log("DISCONNECTED");
      const savedRoom = currentRoomRef.current;
      const savedPlayer = currentPlayerRef.current;
      
      // if (savedRoom && savedPlayer) {
      //   isReconnectingRef.current = true;
      //   setIsReconnecting(true); // Show the overlay
      //   toast.info("🔁 Connection lost. Attempting to reconnect...", {
      //     toastId: "reconnect",
      //     autoClose: false,
      //   });
      // }
        console.log(savedRoom, savedPlayer);
        if (currentRoomRef.current && currentPlayerRef.current) {
        beginReconnectFlow();
      } else {
        // If not part of any room, we still attempt reconnect but we won't auto-join
        beginReconnectFlow();
      }
    };

    // 🔗 Reconnect Attempt Handler (Triggered by socket.io automatically)
    const onReconnect = (attempt: unknown) => {
      console.log("ffffffffffRECONNECT");
      console.log(`🔄 Socket reconnected (attempt ${attempt})`);

      toast.update("reconnect", {
        render: "🔗 Reconnected — restoring session...",
        type: "info",
        isLoading: true,
        autoClose: false,
      });

      // const savedRoom = currentRoomRef.current;
      // const savedPlayer = currentPlayerRef.current;

      // if (!savedRoom || !savedPlayer) return;

      // // This ensures the logic in room-state runs on the next event
      // isReconnectingRef.current = true; 

      // toast.loading("🔁 Reconnecting to room...", {
      //   toastId: "reconnect",
      // });

      // // Emit the join-room event to restore session
      // socket.emit("join-room", {
      //   roomCode: savedRoom,
      //   playerId: savedPlayer,
      // });

      // console.log("🔗 Sent rejoin request:", savedRoom, savedPlayer);
    };

    // --- Register Listeners ---
    socket.on("connect", onConnect);
    socket.on("room-state", onRoomState);
    socket.on("player-joined", onPlayerJoined);
    socket.on("game-started", onGameStarted);
    socket.on("role-assigned", onRoleAssigned);
    socket.on("police-reveal-phase", onPoliceRevealPhase);
    socket.on("all-roles", onAllRoles);
    socket.on("police-revealed", onPoliceRevealed);
    socket.on("round-result", onRoundResult);
    socket.on("game-finished", onGameFinished);
    socket.on("chat-message", onChatMessage);
    socket.on("chat-history", onChatHistory);
    socket.on("connect_error", onConnectError);
    socket.on("player-reconnected", onPlayerReconnected);
    socket.on("player-disconnected", onPlayerDisconnected);
    socket.on("disconnect", onDisconnect); // Add cleanup for disconnect
    socket.on("reconnect", onReconnect);   // Add cleanup for reconnect

    // --- Cleanup Listeners ---
    return () => {
      socket.off("connect", onConnect);
      socket.off("room-state", onRoomState);
      socket.off("player-joined", onPlayerJoined);
      socket.off("game-started", onGameStarted);
      socket.off("role-assigned", onRoleAssigned);
      socket.off("police-reveal-phase", onPoliceRevealPhase);
      socket.off("all-roles", onAllRoles);
      socket.off("police-revealed", onPoliceRevealed);
      socket.off("round-result", onRoundResult);
      socket.off("game-finished", onGameFinished);
      socket.off("chat-message", onChatMessage);
      socket.off("chat-history", onChatHistory);
      socket.off("connect_error", onConnectError);
      socket.off("player-reconnected", onPlayerReconnected);
      socket.off("player-disconnected", onPlayerDisconnected);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect", onReconnect);
    };
  // NOTE: Removed `isReconnecting` from dependencies as it's not needed for listener setup
  // and using it causes unnecessary re-registrations.
  }, [[room, isReconnecting]]);

  // ----------------- reconnect helpers -----------------
  function beginReconnectFlow() {
    if (error) {
      // if we already showed final error, do nothing here — require user to Retry
      return;
    }

    if (!isReconnecting) {
      setIsReconnecting(true);
      // start toast
      toast.info("🔁 Connection lost. Attempting to reconnect...", {
        toastId: "reconnect",
        autoClose: false,
      });
    }

    // set countdown deadline
    const deadline = Date.now() + RECONNECT_TIMEOUT_MS;
    reconnectDeadlineRef.current = deadline;
    updateReconnectRemaining(); // set initial remaining seconds

    // start interval to update remaining seconds every 1s
    if (!reconnectIntervalRef.current) {
      reconnectIntervalRef.current = window.setInterval(() => {
        updateReconnectRemaining();
      }, 1000);
    }

    // start timeout that will show error UI if not reconnected
    if (!reconnectTimeoutRef.current) {
      reconnectTimeoutRef.current = window.setTimeout(() => {
        // timed out: show error UI and dismiss reconnect toast
        setIsReconnecting(false);
        setReconnectRemaining(0);
        toast.dismiss("reconnect");
        setError("Connection failed. Please try again.");
        // clear timers
        clearReconnectTimers();
      }, RECONNECT_TIMEOUT_MS) as unknown as number;
    }
  }


  function updateReconnectRemaining() {
    if (!reconnectDeadlineRef.current) {
      setReconnectRemaining(0);
      return;
    }
    const remainingMs = Math.max(0, reconnectDeadlineRef.current - Date.now());
    setReconnectRemaining(Math.ceil(remainingMs / 1000));
  }

  function clearReconnectTimers() {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    reconnectDeadlineRef.current = null;
  }

  function clearReconnectTimersAndUI() {
    clearReconnectTimers();
    setIsReconnecting(false);
    setReconnectRemaining(0);
    // dismiss reconnect toast if present
    try {
      toast.dismiss("reconnect");
    } catch (e) {}
  }




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
    currentRoomRef.current = roomCode;
    currentPlayerRef.current = playerId;
    localStorage.setItem("roomCode", roomCode);
    localStorage.setItem("playerId", playerId);
    setCurrentPlayerId(playerId);
    socket.emit("join-room", { roomCode, playerId });
  };

  const handleRoomJoined = (roomCode: string, playerId: string) => {
    currentRoomRef.current = roomCode;
    currentPlayerRef.current = playerId;
    localStorage.setItem("roomCode", roomCode);
    localStorage.setItem("playerId", playerId);
    setCurrentPlayerId(playerId);
    socket.emit("join-room", { roomCode, playerId });
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
    localStorage.removeItem("roomCode");
    localStorage.removeItem("playerId");
    currentRoomRef.current = null;
    currentPlayerRef.current = null;
    localStorage.clear();
    setAppState("home");
    localStorage.setItem("appState", "home");
    setRoom(null);
    setCurrentPlayerId("");
    setMyRole("");
    setPoliceId("");
    setAllRoles([]);
    setRoundResult(null);
    setLeaderboard([]);
    setMessages([]);
    setError("");
    clearReconnectTimersAndUI();
  };

   // Retry function used in error UI
  const retry = () => {
    setError("");
    // attempt to reconnect
    try {
      // If socket is disconnected, try to connect
      if (socket && (socket as any).connected === false) {
        socket.connect();
      } else {
        // either connected or connecting - force reconnect
        socket.connect();
      }
    } catch (e) {
      console.error("retry connect error", e);
    }

    // restart reconnect flow
    beginReconnectFlow();
  };

  // small helper to restore saved appState manually (if needed)
  const restoreAppStateFromStorage = () => {
    const savedState = localStorage.getItem("appState");
    if (savedState) {
      setAppState(savedState as AppState);
    }
  };

  if (error) {
    // return (
    //   <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
    //     <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
    //       <h1 className="text-2xl font-bold text-red-800 mb-4">
    //         Connection Error
    //       </h1>
    //       <p className="text-red-600 mb-6">{error}</p>
    //       <button
    //         onClick={() => retry()}
    //         className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
    //       >
    //         Retry
    //       </button>
    //     </div>
    //   </div>
    // );
  }

   if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            Connection Error
          </h1>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => retry()}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => {
                // allow user to fallback to home (clear saved session)
                localStorage.removeItem("roomCode");
                localStorage.removeItem("playerId");
                localStorage.setItem("appState", "home");
                handlePlayAgain();
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Go Home
            </button>
          </div>
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
      {/* 🔄 Reconnect overlay */}
       {isReconnecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-md rounded-2xl p-6 text-center shadow-xl">
            <div className="loader mx-auto mb-4" />
            <p className="font-semibold mb-2">Reconnecting to room...</p>
            <p className="text-sm text-gray-600 mb-4">
              Attempting to restore your session. Time left:{" "}
              <strong>{reconnectRemaining}s</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  // Manual immediate retry
                  try {
                    socket.connect();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
              >
                Try reconnect now
              </button>

              <button
                onClick={() => {
                  // allow quick fallback to home
                  localStorage.removeItem("roomCode");
                  localStorage.removeItem("playerId");
                  localStorage.setItem("appState", "home");
                  handlePlayAgain();
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

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
            return (
              <Welcome
                startGame={() => {
                  localStorage.setItem("appState", "home");
                  setAppState("home");
                }}
              />
            );

          case "home":
            return (
              <HomePage
                onCreateRoom={() => {
                  localStorage.setItem("appState", "create");
                  setAppState("create");
                }}
                onJoinRoom={() => {
                  setAppState("join");
                  localStorage.setItem("appState", "join");
                }}
              />
            );

          case "create":
            return (
              <CreateRoom
                onBack={() => {
                  localStorage.setItem("appState", "home");
                  setAppState("home");
                }}
                onRoomCreated={handleRoomCreated}
                createRoom={handleCreateRoom}
              />
            );

          case "join":
            return (
              <JoinRoom
                onBack={() => {
                  setAppState("home");
                  localStorage.setItem("appState", "home");
                }}
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

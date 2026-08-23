import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Bounce, ToastContainer, toast } from "react-toastify";

import io from "socket.io-client";
import { apiService } from "./services/apiService";
import { HomePage } from "./components/HomePage";
import { CreateRoom } from "./components/CreateRoom";
import { JoinRoom } from "./components/JoinRoom";
import { WaitingRoom } from "./components/WaitingRoom";
import { GameBoard } from "./components/GameBoard";
import { RoundResult } from "./components/RoundResult";
import { Welcome } from "./components/Welcome";
import { AppHeader } from "./components/AppHeader";
import {
  Room,
  Player,
  ChatMessage,
  RoundResult as RoundResultType,
} from "./types/game";
import { VoiceChatManager } from "./components/VoiceChatManager";
import { authService, User as UserType } from "./services/authService";
import { profileService } from "./services/profileService";
import { AuthOverlay } from "./components/auth/AuthOverlay";
import { adminService } from "./services/adminService";
import { configService } from "./services/configService";

// Lazy-loaded routes for performance & lightweight initial bundle
const Leaderboard = lazy(() =>
  import("./components/Leaderboard").then((m) => ({ default: m.Leaderboard }))
);
const GameInfo = lazy(() =>
  import("./components/GameInfo").then((m) => ({ default: m.GameInfo }))
);
const ProfileDashboard = lazy(() =>
  import("./components/ProfileDashboard").then((m) => ({
    default: m.ProfileDashboard,
  }))
);
const AdminDashboard = lazy(() =>
  import("./components/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  }))
);
const AdminLoginModal = lazy(() =>
  import("./components/admin/AdminLoginModal").then((m) => ({
    default: m.AdminLoginModal,
  }))
);

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
  | "leaderboard"
  | "game-info"
  | "dashboard"
  | "admin";

function App() {
  //const socket = useSocket();
  const [appState, setAppState] = useState<AppState>("welcome");
  const [currentUser, setCurrentUser] = useState<UserType | null>(authService.getCurrentUser());
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean>(adminService.isAdminLoggedIn());

  useEffect(() => {
    if (currentUser && !currentUser.isGuest) {
      const targetUserId = currentUser.id || currentUser._id || currentUser.username;
      if (targetUserId) {
        profileService.getProfile(targetUserId)
          .then((res) => {
            if (res?.user?.avatar && res.user.avatar !== currentUser.avatar) {
              const updated = {
                ...currentUser,
                username: res.user.username || currentUser.username,
                avatar: res.user.avatar,
                description: res.user.description || currentUser.description || '',
              };
              authService.setCurrentUser(updated);
              setCurrentUser(updated);
            }
          })
          .catch(() => {});
      }
    }
  }, [currentUser?.id, currentUser?._id]);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  // 🔄 Reconnect UI state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [reconnectRemaining, setReconnectRemaining] = useState<number>(0); // seconds left

  const [myRole, setMyRole] = useState<string>("");
  const [cardsState, setCardsState] = useState<{ id: string; selectedBy: string | null }[]>([]);
  const [myPrivateRole, setMyPrivateRole] = useState<{ cardId: string; role: string } | null>(null);
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
    sessionStorage.getItem("roomCode") || null
  );
  const currentPlayerRef = useRef<string | null>(
    sessionStorage.getItem("playerId") || null
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    const pathname = window.location.pathname.toLowerCase();
    const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin") || urlParams.get("admin") !== null;

    if (isAdminPath) {
      setAppState("admin");
      sessionStorage.setItem("appState", "admin");
    } else if (roomParam) {
      // User clicked an invite link. Clear any previous session so they can join the new room cleanly.
      sessionStorage.removeItem("roomCode");
      sessionStorage.removeItem("playerId");
      currentRoomRef.current = null;
      currentPlayerRef.current = null;
      
      setAppState("join");
      sessionStorage.setItem("appState", "join");
    } else {
      const saved = sessionStorage.getItem("appState");
      if (saved) {
        setAppState(saved as AppState);
      }
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
      const savedToken = sessionStorage.getItem("playerToken");
      console.log("🔁 Auto-rejoin check:", savedRoom, savedPlayer);
      if (savedRoom && savedPlayer) {
        console.log("🔁 Auto rejoining room after connect:", savedRoom);
        socket.emit("join-room", {
          roomCode: savedRoom,
          playerId: savedPlayer,
          playerToken: savedToken,
        });
      }
    };

    const onRoomState = (data: { room: Room; playerId: string; policeId?: string }) => {
      console.log("Received room-state:", data);
      setRoom(data.room);
      setCurrentPlayerId(data.playerId);
      setPoliceId(data.policeId || "");
      if (data.room.cardsState) {
        setCardsState(data.room.cardsState);
      }

      const currentPlayer = data.room.players.find(
        (p: Player) => p.id === data.playerId
      );
      if (currentPlayer?.role) {
        setMyRole(currentPlayer.role);
      }

      // FIX #3: Map ALL server gameStates to the correct client appState,
      // not just "waiting" — so reconnecting mid-game restores the right screen
      const gameStateToAppState: Record<string, AppState> = {
        "waiting": "waiting",
        "role-assignment": "playing",
        "classic-card-selection": "playing",
        "police-reveal": "playing",
        "guessing": "playing",
        "results": "result",
        "finished": "leaderboard",
      };
      const restoredState = gameStateToAppState[data.room.gameState];
      if (restoredState) {
        setAppState(restoredState);
        sessionStorage.setItem("appState", restoredState);
      }

      // FIX #4 + #9: isReconnectingRef is now correctly set in beginReconnectFlow,
      // so this success block will reliably run after reconnect
      if (isReconnectingRef.current) {
        toast.dismiss("reconnect");
        toast.success("✅ Reconnected successfully!");
        isReconnectingRef.current = false;
        setIsReconnecting(false);
        clearReconnectTimers();
        console.log("Reconnection successful. Overlay hidden.");
      }
    };

    const onPlayerJoined = (data: { players: Player[] }) => {
      if (room) {
        setRoom({ ...room, players: data.players });
      }
    };

    const onGameStarted = (data: Room | null) => {
      setRoom((prev) =>
        prev ? { ...prev, ...data, gameState: "classic-card-selection" } : null
      );
      setMyRole("");
      setPoliceId("");
      setAllRoles([]);
      setRoundResult(null);
      setMyPrivateRole(null);
      setAppState("playing");
      sessionStorage.setItem("appState", "playing");
    };

    const onStartCardSelection = (data: { cardsState: { id: string; selectedBy: string | null }[] }) => {
      setCardsState(data.cardsState || []);
      setMyPrivateRole(null);
      setMyRole("");
      setPoliceId("");
      setAllRoles([]);
      setRoundResult(null);
      setRoom((prev) => (prev ? { ...prev, gameState: "classic-card-selection" } : null));
    };

    const onPlayerCardSelected = (data: { playerId: string; cardId: string; cardsState: { id: string; selectedBy: string | null }[] }) => {
      setCardsState(data.cardsState || []);
      if (data.playerId !== currentPlayerRef.current) {
        const selectingPlayerName = room?.players.find((p: Player) => p.id === data.playerId)?.name || "A player";
        toast.info(`🔒 ${selectingPlayerName} selected a card!`, { autoClose: 3000 });
      }
    };

    const onRoleRevealedPrivate = (data: { cardId: string; role: string }) => {
      setMyPrivateRole(data);
      setMyRole(data.role);
    };

    const onRoleAssigned = (data: { role: string; players: Player[] }) => {
      setMyRole(data.role);
      setRoom((prev) => (prev ? { ...prev, players: data.players } : null));
    };

    const onPoliceRevealPhase = () => {
      setRoom((prev) =>
        prev ? { ...prev, gameState: "police-reveal" } : null
      );
    };

    const onAllRoles = (data: { players: Player[] }) => {
      setAllRoles(data.players);
    };

    const onPoliceRevealed = (data: { policeName: string; policeId: string; guessingEndTime?: number }) => {
      // Only show this toast as part of an active game session.
      if (appState !== "playing" || !room || room.gameState !== "police-reveal") {
        return;
      }

      console.log(data);
      toast(`${data.policeName} : I am Police and going to catch the thief Now 😎`);
      setPoliceId(data.policeId);
      setRoom((prev) => (prev ? { ...prev, gameState: "guessing", guessingEndTime: data.guessingEndTime } : null));
    };

    const onRoundResult = (data: RoundResultType) => {
      setRoundResult(data);
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              gameState: "results",
              winCondition: data.winCondition || prev.winCondition,
              targetScore: data.targetScore || prev.targetScore,
              players: data.players.map((p: Player) => ({
                ...p,
                role: undefined,
              })),
            }
          : null
      );
      setAppState("result");
      sessionStorage.setItem("appState", "result");
      setAllRoles([]);
    };

    const onGameFinished = (data: { leaderboard: Player[] }) => {
      setLeaderboard(data.leaderboard);
      setAppState("leaderboard");
      sessionStorage.setItem("appState", "leaderboard");
    };

    const onChatMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    const onChatHistory = (history: ChatMessage[]) => {
      setMessages(history);
    };

    const onConnectError = (err: unknown) => {
      console.error("Socket connection error:", err);
      // FIX #7: Use ref instead of stale `isReconnecting` state from closure
      if (!isReconnectingRef.current) {
        beginReconnectFlow();
      }
    };

    // FIX #12: Show toast to other players when someone reconnects/disconnects.
    // Toast is called OUTSIDE the setRoom updater to avoid setState-during-render warning.
    const onPlayerReconnected = ({ playerId }: { playerId: string }) => {
      console.log(`🔁 Player ${playerId} reconnected`);
      if (playerId !== currentPlayerRef.current) {
        const playerName = room?.players.find((p) => p.id === playerId)?.name;
        if (playerName) {
          toast.info(`🔁 ${playerName} reconnected!`, { autoClose: 3000 });
        }
        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map((p) =>
              p.id === playerId ? { ...p, disconnected: false } : p
            ),
          };
        });
      }
    };

    const onPlayerDisconnected = ({ playerId }: { playerId: string }) => {
      console.log(`🚫 Player ${playerId} temporarily disconnected`);
      if (playerId !== currentPlayerRef.current) {
        const playerName = room?.players.find((p) => p.id === playerId)?.name;
        if (playerName) {
          toast.warn(`⚠️ ${playerName} disconnected. Waiting for reconnect...`, {
            autoClose: 5000,
          });
        }
        setRoom((prev) => prev); // touch state to trigger any necessary re-render
      }
    };

    // FIX #13: Only trigger reconnect flow when the player is actually in a room
    const onDisconnect = () => {
      console.log("DISCONNECTED");
      const savedRoom = currentRoomRef.current;
      const savedPlayer = currentPlayerRef.current;
      console.log("Session on disconnect:", savedRoom, savedPlayer);
      if (savedRoom && savedPlayer) {
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

    const onSystemConfigUpdated = (newConfig: any) => {
      configService.updateConfig(newConfig);
    };

    // --- Register Listeners ---
    socket.on("connect", onConnect);
    socket.on("system_config_updated", onSystemConfigUpdated);
    socket.on("room-state", onRoomState);
    socket.on("player-joined", onPlayerJoined);
    socket.on("game-started", onGameStarted);
    socket.on("classic:startCardSelection", onStartCardSelection);
    socket.on("classic:playerCardSelected", onPlayerCardSelected);
    socket.on("classic:roleRevealedPrivate", onRoleRevealedPrivate);
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
      socket.off("system_config_updated", onSystemConfigUpdated);
      socket.off("room-state", onRoomState);
      socket.off("player-joined", onPlayerJoined);
      socket.off("game-started", onGameStarted);
      socket.off("classic:startCardSelection", onStartCardSelection);
      socket.off("classic:playerCardSelected", onPlayerCardSelected);
      socket.off("classic:roleRevealedPrivate", onRoleRevealedPrivate);
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
  // FIX #1: Corrected from [[room, isReconnecting]] (double-nested array) to [room].
  // beginReconnectFlow/clearReconnectTimersAndUI use only refs+setters — safe to omit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, appState]);

  // ----------------- reconnect helpers -----------------
  function beginReconnectFlow() {
    if (error) {
      return;
    }

    // FIX #4 + #7: Guard with ref (not stale state) and set ref so onRoomState detects success
    if (!isReconnectingRef.current) {
      isReconnectingRef.current = true;
      setIsReconnecting(true);
      toast.info("🔁 Connection lost. Attempting to reconnect...", {
        toastId: "reconnect",
        autoClose: false,
      });
    }

    const deadline = Date.now() + RECONNECT_TIMEOUT_MS;
    reconnectDeadlineRef.current = deadline;
    updateReconnectRemaining();

    if (!reconnectIntervalRef.current) {
      reconnectIntervalRef.current = window.setInterval(() => {
        updateReconnectRemaining();
      }, 1000);
    }

    if (!reconnectTimeoutRef.current) {
      reconnectTimeoutRef.current = window.setTimeout(() => {
        isReconnectingRef.current = false;
        setIsReconnecting(false);
        setReconnectRemaining(0);
        toast.dismiss("reconnect");
        setError("Connection failed. Please try again.");
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

  // FIX #3: Also reset isReconnectingRef so future reconnect detection works correctly
  function clearReconnectTimersAndUI() {
    clearReconnectTimers();
    isReconnectingRef.current = false;
    setIsReconnecting(false);
    setReconnectRemaining(0);
    try {
      toast.dismiss("reconnect");
    } catch {
      // noop — toast.dismiss never throws in practice
    }
  }




  const handleCreateRoom = async (
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
  ) => {
    return await apiService.createRoom(
      roomName,
      playerName,
      totalRounds,
      options,
      userId
    );
  };

  const handleJoinRoom = async (
    roomCode: string,
    playerName: string,
    userId?: string
  ) => {
    return await apiService.joinRoom(roomCode, playerName, userId);
  };

  const handleRoomCreated = (
    roomCode: string,
    playerId: string,
    playerToken?: string
  ) => {
    currentRoomRef.current = roomCode;
    currentPlayerRef.current = playerId;
    sessionStorage.setItem("roomCode", roomCode);
    sessionStorage.setItem("playerId", playerId);
    setCurrentPlayerId(playerId);
    const token = playerToken || sessionStorage.getItem("playerToken");
    socket.emit("join-room", { roomCode, playerId, playerToken: token });
  };

  const handleRoomJoined = (
    roomCode: string,
    playerId: string,
    playerToken?: string
  ) => {
    currentRoomRef.current = roomCode;
    currentPlayerRef.current = playerId;
    sessionStorage.setItem("roomCode", roomCode);
    sessionStorage.setItem("playerId", playerId);
    setCurrentPlayerId(playerId);
    const token = playerToken || sessionStorage.getItem("playerToken");
    socket.emit("join-room", { roomCode, playerId, playerToken: token });
  };

  const handlePoliceReveal = useCallback(() => {
    if (socket && room) {
      socket.emit("police-reveal", {
        roomCode: room.id,
        playerId: currentPlayerId,
      });
    }
  }, [room, currentPlayerId]);

  const handleMakeGuess = useCallback((guessedThiefId: string) => {
    if (socket && room) {
      socket.emit("make-guess", {
        roomCode: room.id,
        playerId: currentPlayerId,
        guessedThiefId,
      });
    }
  }, [room, currentPlayerId]);

  const handleSendMessage = useCallback((message: string) => {
    if (socket && room) {
      socket.emit("chat-message", {
        roomCode: room.id,
        playerId: currentPlayerId,
        message,
      });
    }
  }, [room, currentPlayerId]);

  const handleNextRound = useCallback(() => {
    if (socket && room) {
      socket.emit("next-round", {
        roomCode: room.id,
        playerId: currentPlayerId,
      });
    }
  }, [room, currentPlayerId]);

  const handlePlayAgain = () => {
    sessionStorage.removeItem("roomCode");
    sessionStorage.removeItem("playerId");
    currentRoomRef.current = null;
    currentPlayerRef.current = null;
    sessionStorage.clear();
    setAppState("home");
    sessionStorage.setItem("appState", "home");
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

  const handleBackToHome = () => {
    sessionStorage.removeItem("roomCode");
    sessionStorage.removeItem("playerId");
    currentRoomRef.current = null;
    currentPlayerRef.current = null;
    sessionStorage.clear();
     setAppState("welcome");

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
      if (socket && socket.connected === false) {
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

  // FIX #11: Removed unused restoreAppStateFromStorage (dead code)
  // FIX #6: Removed dead first if(error) block with only commented-out JSX
  // that was silently returning undefined and blocking the real error screen below.

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
                sessionStorage.removeItem("roomCode");
                sessionStorage.removeItem("playerId");
                sessionStorage.setItem("appState", "home");
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

  // FIX #10: Show a loading/restoring screen instead of a blank page when
  // appState was saved mid-game (e.g. "playing") but room hasn't loaded yet after page refresh
  const isRoomRequiredState =
    appState === "waiting" ||
    appState === "playing" ||
    appState === "result" ||
    appState === "leaderboard";
  if (isRoomRequiredState && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loader mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-lg">Restoring your session...</p>
          <p className="text-gray-500 text-sm mt-2">Reconnecting to the server</p>
          <button
            onClick={handlePlayAgain}
            className="mt-6 px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-sm font-medium transition-colors"
          >
            Back to Home
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
                  sessionStorage.removeItem("roomCode");
                  sessionStorage.removeItem("playerId");
                  sessionStorage.setItem("appState", "home");
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

      {/* 🎤 Voice Chat & Music Audio Manager */}
      <VoiceChatManager
        socket={socket as any}
        room={room}
        currentPlayerId={currentPlayerId}
        isMusicPlaying={isMusicPlaying}
        toggleMusic={toggleMusic}
      />

      {/* Background Music */}
      <audio
        ref={audioRef}
        loop
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      />

      {/* Sticky App Header after login for all screens */}
      {appState !== "welcome" && currentUser && (
        <AppHeader
          currentUser={currentUser}
          onOpenGameInfo={() => {
            sessionStorage.setItem("appState", "game-info");
            setAppState("game-info");
          }}
          onGoHome={() => {
            sessionStorage.setItem("appState", "home");
            setAppState("home");
          }}
          onLogout={() => {
            authService.logout();
            adminService.logout();
            setIsAdminAuthed(false);
            setCurrentUser(null);
            sessionStorage.setItem("appState", "welcome");
            setAppState("welcome");
            toast.info("Logged out successfully");
          }}
          onOpenDashboard={() => {
            sessionStorage.setItem("appState", "dashboard");
            setAppState("dashboard");
          }}
          onOpenAdminDashboard={() => {
            setIsAdminAuthed(true);
            sessionStorage.setItem("appState", "admin");
            setAppState("admin");
          }}
        />
      )}

      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0A041A] flex items-center justify-center">
            <div className="loader mx-auto" />
          </div>
        }
      >
        {(() => {
          switch (appState) {
            case "welcome":
              return (
                <Welcome
                  currentUser={currentUser}
                  onOpenAuth={() => setShowAuthModal(true)}
                  onOpenGameInfo={() => {
                    sessionStorage.setItem("appState", "game-info");
                    setAppState("game-info");
                  }}
                  startGame={() => {
                    sessionStorage.setItem("appState", "home");
                    setAppState("home");
                  }}
                  onLogout={() => {
                    authService.logout();
                    adminService.logout();
                    setIsAdminAuthed(false);
                    setCurrentUser(null);
                    sessionStorage.setItem("appState", "welcome");
                    setAppState("welcome");
                    toast.info("Logged out successfully");
                  }}
                  onOpenDashboard={() => {
                    sessionStorage.setItem("appState", "dashboard");
                    setAppState("dashboard");
                  }}
                  onOpenAdminDashboard={() => {
                    setIsAdminAuthed(true);
                    sessionStorage.setItem("appState", "admin");
                    setAppState("admin");
                  }}
                />
              );

            case "home":
              return (
                <HomePage
                  onBack={() => {
                    sessionStorage.setItem("appState", "welcome");
                    setAppState("welcome");
                  }}
                  onCreateRoom={() => {
                    sessionStorage.setItem("appState", "create");
                    setAppState("create");
                  }}
                  onJoinRoom={() => {
                    setAppState("join");
                    sessionStorage.setItem("appState", "join");
                  }}
                  onOpenGameInfo={() => {
                    sessionStorage.setItem("appState", "game-info");
                    setAppState("game-info");
                  }}
                />
              );

            case "create":
              return (
                <CreateRoom
                  onBack={() => {
                    sessionStorage.setItem("appState", "home");
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
                    sessionStorage.setItem("appState", "home");
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
                  socket={socket}
                  room={room}
                  currentPlayerId={currentPlayerId}
                  myRole={myRole}
                  policeId={policeId}
                  allRoles={allRoles}
                  messages={messages}
                  cardsState={cardsState}
                  myPrivateRole={myPrivateRole}
                  onPoliceReveal={handlePoliceReveal}
                  onMakeGuess={handleMakeGuess}
                  onSendMessage={handleSendMessage}
                  onLeaveRoom={handlePlayAgain}
                />
              ) : null;

            case "result":
              return roundResult ? (
                <RoundResult
                  result={roundResult}
                  isHost={room?.players.find((p) => p.id === currentPlayerId)?.isHost}
                  onNextRound={handleNextRound}
                />
              ) : null;

            case "leaderboard":
              return (
                <Leaderboard
                  leaderboard={leaderboard}
                  onPlayAgain={handlePlayAgain}
                  onBackToHome={handleBackToHome}
                />
              );

            case "game-info":
              return (
                <GameInfo
                  onBack={() => {
                    sessionStorage.setItem("appState", "welcome");
                    setAppState("welcome");
                  }}
                  onStartGame={() => {
                    sessionStorage.setItem("appState", "home");
                    setAppState("home");
                  }}
                />
              );

            case "dashboard":
              return currentUser ? (
                <ProfileDashboard
                  user={currentUser}
                  onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
                  onBack={() => {
                    sessionStorage.setItem("appState", "welcome");
                    setAppState("welcome");
                  }}
                />
              ) : null;

            case "admin":
              if (isAdminAuthed || adminService.isAdminLoggedIn()) {
                return (
                  <AdminDashboard
                    onBackToApp={() => {
                      window.history.pushState({}, "", "/");
                      sessionStorage.setItem("appState", "welcome");
                      setAppState("welcome");
                    }}
                    onLogout={() => {
                      adminService.logout();
                      setIsAdminAuthed(false);
                    }}
                  />
                );
              }
              return (
                <AdminLoginModal
                  isOpen={true}
                  onClose={() => {
                    window.history.pushState({}, "", "/");
                    sessionStorage.setItem("appState", "welcome");
                    setAppState("welcome");
                  }}
                  onSuccess={() => {
                    setIsAdminAuthed(true);
                  }}
                />
              );

            default:
              return null;
          }
        })()}
      </Suspense>

      {showAuthModal && (
        <AuthOverlay
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
          onCancel={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}

export default App;

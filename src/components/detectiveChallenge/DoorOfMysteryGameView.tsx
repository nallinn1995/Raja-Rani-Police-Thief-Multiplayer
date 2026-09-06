import React, { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import {
  Shield,
  Heart,
  Volume2,
  VolumeX,
  Trophy,
  RotateCcw,
  LogOut,
  Target,
  Flame,
  AlertTriangle,
  Award,
} from "lucide-react";
import {
  DetectiveDoorOutcome,
  DetectivePlayerStatus,
  DetectiveDoorResultPayload,
  DetectivePlayerPublicState,
  DetectivePublicGameState,
  DetectiveGameFinishedPayload,
  DetectiveLeaderboardEntry,
  DetectiveReconnectSyncPayload,
} from "../../types/detectiveChallenge";
import { DoorOfMysteryScene } from "./DoorOfMysteryScene";
import {
  setMysteryAudioMuted,
  getMysteryAudioMuted,
  playLifeLostSound,
  playTimerTickSound,
} from "../../utils/mysteryAudio";

interface DoorOfMysteryGameViewProps {
  socket: Socket;
  roomCode: string;
  currentPlayerId: string;
  isHost: boolean;
  initialPublicState?: DetectivePublicGameState | null;
  onLeaveGame: () => void;
}

export const DoorOfMysteryGameView: React.FC<DoorOfMysteryGameViewProps> = ({
  socket,
  roomCode,
  currentPlayerId,
  isHost,
  initialPublicState,
  onLeaveGame,
}) => {
  // Game & Timer State
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return initialPublicState?.remainingSeconds ?? 60;
  });
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(getMysteryAudioMuted());
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Personal Player State
  const [lives, setLives] = useState<number>(3);
  const [attempts, setAttempts] = useState<number>(0);
  const [safeDoorsFound, setSafeDoorsFound] = useState<number>(0);
  const [bombsTriggered, setBombsTriggered] = useState<number>(0);
  const [myStatus, setMyStatus] = useState<DetectivePlayerStatus>("INVESTIGATING");
  const [investigationTimeMs, setInvestigationTimeMs] = useState<number | null>(null);

  // Door tracking
  const [revealedDoors, setRevealedDoors] = useState<Map<number, DetectiveDoorOutcome>>(new Map());
  const [latestDoorResult, setLatestDoorResult] = useState<{ doorId: number; result: DetectiveDoorOutcome } | null>(null);
  const [isRequestPending, setIsRequestPending] = useState<boolean>(false);

  // Room Players Public Roster
  const [playersRoster, setPlayersRoster] = useState<DetectivePlayerPublicState[]>(() => {
    return initialPublicState?.players ?? [];
  });

  // Reset key to smoothly reset game and timer state
  const [resetKey, setResetKey] = useState<number>(() => Date.now());
  const modalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Final Results
  const [finalResults, setFinalResults] = useState<DetectiveGameFinishedPayload | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  // Status message banner
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "safe" | "bomb" | "thief" | "info" } | null>(null);

  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = (text: string, type: "safe" | "bomb" | "thief" | "info", duration = 3000) => {
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    setBannerMessage({ text, type });
    bannerTimeoutRef.current = setTimeout(() => {
      setBannerMessage(null);
    }, duration);
  };

  /**
   * Complete reset of the game board, timer, results modal, and player state
   */
  const resetGameAndTimer = (seconds = 60) => {
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    setBannerMessage(null);
    setIsGameOver(false);
    setShowResultModal(false);
    setFinalResults(null);
    setSecondsRemaining(seconds);
    setResetKey(Date.now());
    setRevealedDoors(new Map());
    setLatestDoorResult(null);
    setIsRequestPending(false);
    setLives(3);
    setAttempts(0);
    setSafeDoorsFound(0);
    setBombsTriggered(0);
    setMyStatus("INVESTIGATING");
    setInvestigationTimeMs(null);
  };

  // Timer Tick Interval - smoothly resets whenever resetKey changes or isGameOver changes
  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        if (prev <= 10) {
          playTimerTickSound(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, resetKey]);

  // Socket Event Listeners
  useEffect(() => {
    const handleGameStarted = (data: DetectivePublicGameState) => {
      resetGameAndTimer(data.remainingSeconds || 60);
      setPlayersRoster(data.players || []);
      showBanner("🔍 New Investigation Started! Find the hidden Thief.", "info", 4000);
    };

    const handleDoorResult = (data: DetectiveDoorResultPayload) => {
      setIsRequestPending(false);
      setLives(data.livesRemaining);
      setAttempts(data.attempts);
      setSafeDoorsFound(data.safeDoorsFound);
      setBombsTriggered(data.bombsTriggered);
      setMyStatus(data.status);
      if (data.investigationTimeMs) {
        setInvestigationTimeMs(data.investigationTimeMs);
      }

      setRevealedDoors((prev) => {
        const next = new Map(prev);
        next.set(data.doorId, data.result);
        return next;
      });

      setLatestDoorResult({ doorId: data.doorId, result: data.result });

      if (data.result === "SAFE") {
        showBanner(`Door #${data.doorId} is SAFE. Keep investigating!`, "safe");
      } else if (data.result === "BOMB") {
        playLifeLostSound();
        if (data.livesRemaining > 0) {
          showBanner(`💥 TIME BOMB! -1 LIFE! (${data.livesRemaining} Lives Left)`, "bomb");
        } else {
          showBanner("☠️ ELIMINATED! All lives lost to time bombs.", "bomb", 5000);
        }
      } else if (data.result === "THIEF") {
        const timeSec = (data.investigationTimeMs ? data.investigationTimeMs / 1000 : 0).toFixed(2);
        showBanner(`🕵️ THIEF CAUGHT! Identified in ${timeSec}s!`, "thief", 6000);
      }
    };

    const handlePlayerUpdated = (data: DetectivePlayerPublicState) => {
      setPlayersRoster((prev) => {
        const exists = prev.some((p) => p.id === data.id);
        if (exists) {
          return prev.map((p) => (p.id === data.id ? { ...p, ...data } : p));
        }
        return [...prev, data];
      });

      if (data.id !== currentPlayerId) {
        if (data.status === "CAUGHT") {
          showBanner(`🏆 Detective ${data.name} CAUGHT the Thief!`, "thief", 4000);
        } else if (data.status === "ELIMINATED") {
          showBanner(`⚠️ Detective ${data.name} was ELIMINATED by a bomb.`, "bomb", 3000);
        }
      }
    };

    const handleGameFinished = (data: DetectiveGameFinishedPayload) => {
      setIsGameOver(true);
      setFinalResults(data);
      if (modalTimeoutRef.current) clearTimeout(modalTimeoutRef.current);
      // Reveal results modal after 1.5 seconds for dramatic effect
      modalTimeoutRef.current = setTimeout(() => {
        setShowResultModal(true);
      }, 1500);
    };

    const handleReconnectSync = (data: DetectiveReconnectSyncPayload) => {
      if (data.publicState) {
        setSecondsRemaining(data.publicState.remainingSeconds || 0);
        setPlayersRoster(data.publicState.players || []);
        if (data.publicState.status === "FINISHED") {
          setIsGameOver(true);
        }
      }
      if (data.myState) {
        setLives(data.myState.lives);
        setAttempts(data.myState.attempts);
        setSafeDoorsFound(data.myState.safeDoorsFound);
        setBombsTriggered(data.myState.bombsTriggered);
        setMyStatus(data.myState.status);
        if (data.myState.investigationTimeMs) {
          setInvestigationTimeMs(data.myState.investigationTimeMs);
        }
        if (data.myState.revealedDoors) {
          const map = new Map<number, DetectiveDoorOutcome>();
          data.myState.revealedDoors.forEach((d) => map.set(d.doorId, d.result));
          setRevealedDoors(map);
        }
      }
    };

    const handleError = (data: { message: string }) => {
      setIsRequestPending(false);
      showBanner(data.message, "bomb", 3000);
    };

    socket.on("detective:gameStarted", handleGameStarted);
    socket.on("detective:doorResult", handleDoorResult);
    socket.on("detective:playerUpdated", handlePlayerUpdated);
    socket.on("detective:gameFinished", handleGameFinished);
    socket.on("detective:reconnectSync", handleReconnectSync);
    socket.on("detective:error", handleError);

    // Initial state request
    socket.emit("detective:requestState", { roomCode, playerId: currentPlayerId });

    return () => {
      socket.off("detective:gameStarted", handleGameStarted);
      socket.off("detective:doorResult", handleDoorResult);
      socket.off("detective:playerUpdated", handlePlayerUpdated);
      socket.off("detective:gameFinished", handleGameFinished);
      socket.off("detective:reconnectSync", handleReconnectSync);
      socket.off("detective:error", handleError);
    };
  }, [socket, roomCode, currentPlayerId]);

  // Door click handler
  const handleOpenDoor = (doorId: number) => {
    if (isGameOver || myStatus !== "INVESTIGATING" || lives <= 0 || isRequestPending) {
      return;
    }
    if (revealedDoors.has(doorId)) return;

    setIsRequestPending(true);
    socket.emit("detective:openDoor", {
      roomCode,
      playerId: currentPlayerId,
      doorId,
    });
  };

  const toggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    setMysteryAudioMuted(next);
  };

  const handlePlayAgain = () => {
    if (!isHost) return;
    resetGameAndTimer(60);
    showBanner("🔄 Resetting investigation chamber...", "info", 2000);
    socket.emit("detective:playAgain", { roomCode, playerId: currentPlayerId });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const canInteract = !isGameOver && myStatus === "INVESTIGATING" && lives > 0 && !isRequestPending;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 font-sans text-white select-none">
      {/* 3D PLAYABLE SCENE (BABYLON.JS) */}
      <div className="absolute inset-0 z-0">
        <DoorOfMysteryScene
          revealedDoors={revealedDoors}
          selectedDoorId={null}
          latestDoorResult={latestDoorResult}
          onOpenDoor={handleOpenDoor}
          canInteract={canInteract}
          resetKey={resetKey}
        />
      </div>

      {/* 2D HUD OVERLAY (TOP BAR) */}
      <header className="absolute top-0 left-0 right-0 z-20 px-3 py-2 sm:px-6 sm:py-3.5 bg-gradient-to-b from-[#090214]/90 via-[#0e041e]/60 to-transparent backdrop-blur-[2px] flex items-center justify-between border-b border-purple-500/20">
        {/* Left: Mode Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-900/60 border border-amber-400/50 flex items-center justify-center shadow-lg shrink-0">
            <span className="text-lg sm:text-xl">🗝️</span>
          </div>
          <div>
            <h1 className="text-xs sm:text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 uppercase drop-shadow-md">
              Door of Mystery
            </h1>
            <p className="text-[10px] sm:text-xs text-purple-300 font-semibold tracking-wide">
              Detective Challenge • Room <span className="font-mono text-amber-300 font-bold">{roomCode}</span>
            </p>
          </div>
        </div>

        {/* Center: Authoritative Countdown Timer */}
        <div className="flex flex-col items-center">
          <div
            className={`px-3 sm:px-4 py-1 rounded-full border shadow-md flex items-center space-x-1.5 transition-colors ${
              secondsRemaining <= 10
                ? "bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/50"
                : "bg-[#140628]/80 border-amber-400/40 text-amber-300"
            }`}
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-200">Time:</span>
            <span className="font-mono font-black text-sm sm:text-lg tabular-nums tracking-wider">
              {formatTimer(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Right: Lives Hearts + Mute Toggle + Exit Room */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-[#150529]/80 rounded-xl border border-purple-500/30 shadow-inner">
            {[1, 2, 3].map((heartNum) => (
              <Heart
                key={heartNum}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                  lives >= heartNum
                    ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-105"
                    : "text-slate-600 fill-slate-800 scale-90 opacity-60"
                }`}
              />
            ))}
          </div>

          <button
            onClick={toggleMute}
            className="p-1.5 sm:p-2 rounded-xl bg-[#16062b]/80 border border-purple-500/30 text-purple-300 hover:text-white transition shadow cursor-pointer"
            title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 hover:text-white transition shadow cursor-pointer text-xs font-bold"
            title="Exit Room"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Exit Room</span>
          </button>
        </div>
      </header>

      {/* 2D HUD OVERLAY (TOP SUB-BAR BELOW HEADER): ROSTER & PERSONAL METRICS */}
      <div className="absolute top-14 sm:top-16 left-2 right-2 sm:left-6 sm:right-6 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Personal Investigation Card */}
        <div className="pointer-events-auto bg-[#130528]/95 backdrop-blur-md rounded-2xl border border-purple-600/40 px-3 py-1.5 sm:px-4 sm:py-2 shadow-xl flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] text-purple-300 uppercase font-bold block leading-tight">Attempts</span>
              <span className="text-xs sm:text-sm font-black text-white">{attempts}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] text-purple-300 uppercase font-bold block leading-tight">Safe</span>
              <span className="text-xs sm:text-sm font-black text-emerald-300">{safeDoorsFound}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/20 border border-rose-400/40 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-300" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] text-purple-300 uppercase font-bold block leading-tight">Bombs</span>
              <span className="text-xs sm:text-sm font-black text-rose-300">{bombsTriggered}</span>
            </div>
          </div>

          <div className="border-l border-purple-500/30 pl-2.5 sm:pl-3 flex flex-col">
            <span className="text-[9px] sm:text-[10px] text-purple-300 uppercase font-bold block leading-tight">My Status</span>
            <span
              className={`text-[11px] sm:text-xs font-black tracking-wider uppercase ${
                myStatus === "CAUGHT"
                  ? "text-amber-400"
                  : myStatus === "ELIMINATED"
                  ? "text-rose-400"
                  : myStatus === "TIMEOUT"
                  ? "text-slate-400"
                  : "text-cyan-400"
              }`}
            >
              {myStatus} {investigationTimeMs && `(${(investigationTimeMs / 1000).toFixed(1)}s)`}
            </span>
          </div>
        </div>

        {/* Live Detective Roster Panel */}
        <div className="pointer-events-auto bg-[#100422]/95 backdrop-blur-md rounded-2xl border border-purple-600/40 p-1.5 sm:p-2 shadow-xl overflow-x-auto flex items-center gap-1.5 sm:gap-2 max-w-full sm:max-w-md">
          {playersRoster.map((p) => (
            <div
              key={p.id}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border flex items-center space-x-1.5 shrink-0 ${
                p.id === currentPlayerId
                  ? "bg-purple-900/60 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                  : "bg-purple-950/40 border-purple-700/30"
              }`}
            >
              <span className="text-xs">🕵️</span>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-[11px] font-bold text-white truncate max-w-[75px] sm:max-w-[85px]">
                  {p.name} {p.id === currentPlayerId && "(You)"}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-[8px] sm:text-[9px] text-rose-400">
                    {"❤️".repeat(p.lives)}
                    {"🖤".repeat(Math.max(0, 3 - p.lives))}
                  </span>
                  <span
                    className={`text-[8px] font-black uppercase px-1 rounded ${
                      p.status === "CAUGHT"
                        ? "bg-amber-400 text-black"
                        : p.status === "ELIMINATED"
                        ? "bg-rose-600 text-white"
                        : p.status === "TIMEOUT"
                        ? "bg-slate-700 text-slate-300"
                        : "bg-cyan-500/30 text-cyan-300"
                    }`}
                  >
                    {p.status === "CAUGHT" ? "CAUGHT" : p.status === "ELIMINATED" ? "OUT" : "SEARCH"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DYNAMIC ALERT BANNER */}
      {bannerMessage && (
        <div className="absolute top-28 sm:top-32 left-1/2 transform -translate-x-1/2 z-30 w-[90%] max-w-md pointer-events-none animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-center space-x-2.5 text-center text-xs sm:text-sm font-black tracking-wide ${
              bannerMessage.type === "safe"
                ? "bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                : bannerMessage.type === "bomb"
                ? "bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                : bannerMessage.type === "thief"
                ? "bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                : "bg-purple-950/90 border-purple-400 text-purple-200"
            }`}
          >
            {bannerMessage.type === "bomb" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {bannerMessage.type === "thief" && <Trophy className="w-4 h-4 text-amber-400 shrink-0" />}
            {bannerMessage.type === "safe" && <Shield className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{bannerMessage.text}</span>
          </div>
        </div>
      )}

      {/* FINAL LEADERBOARD & RESULT MODAL */}
      {showResultModal && finalResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c0836] via-[#120324] to-[#0a0114] border-2 border-amber-400/60 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-white font-sans max-h-[95vh] flex flex-col justify-between">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] mb-2">
                <Trophy className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 uppercase tracking-wide">
                Detective Challenge Complete
              </h2>
              <p className="text-xs sm:text-sm text-purple-300 mt-0.5">
                The hidden Thief was behind <strong className="text-amber-400 font-mono">Door #{finalResults.secretLayout.thiefDoor}</strong>
              </p>
            </div>

            {/* Leaderboard Table / Cards */}
            <div className="space-y-2 sm:space-y-2.5 my-2 overflow-y-auto max-h-[40vh] pr-1">
              {finalResults.leaderboard.map((entry: DetectiveLeaderboardEntry) => {
                const isMe = entry.id === currentPlayerId;

                return (
                  <div
                    key={entry.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
                      isMe
                        ? "bg-gradient-to-r from-purple-900/80 to-indigo-950/80 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/40"
                        : "bg-[#18082e]/80 border-purple-700/40"
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="flex items-center space-x-2.5 sm:space-x-3">
                      <div
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl font-black text-xs sm:text-base flex items-center justify-center shrink-0 shadow-md ${
                          entry.rank === 1
                            ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                            : entry.rank === 2
                            ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950"
                            : entry.rank === 3
                            ? "bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200"
                            : "bg-purple-950/80 text-purple-300 border border-purple-600/40"
                        }`}
                      >
                        #{entry.rank}
                      </div>

                      {/* Name & Details */}
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-extrabold text-xs sm:text-sm text-white">{entry.name}</h4>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-black uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] sm:text-xs text-purple-300 mt-0.5">
                          <span>
                            {entry.status === "CAUGHT" ? (
                              <strong className="text-amber-300">THIEF CAUGHT</strong>
                            ) : entry.status === "ELIMINATED" ? (
                              <strong className="text-rose-400">ELIMINATED</strong>
                            ) : (
                              <strong className="text-slate-400">TIMEOUT</strong>
                            )}
                          </span>
                          {entry.investigationTimeSec && (
                            <span>• {entry.investigationTimeSec.toFixed(1)}s</span>
                          )}
                          <span>• {entry.accuracyPercent}% ACC</span>
                          <span>• {"❤️".repeat(entry.livesRemaining)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Final Score */}
                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-purple-300 font-bold uppercase block">Score</span>
                      <span className="text-base sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
                        {entry.finalScore.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* My Personal Investigation Breakdown */}
            {(() => {
              const myEntry = finalResults.leaderboard.find((e) => e.id === currentPlayerId);
              if (!myEntry) return null;

              return (
                <div className="p-3 sm:p-4 rounded-2xl bg-[#150729]/90 border border-purple-600/30 my-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-200 uppercase mb-2">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Your Score Breakdown</span>
                    </span>
                    <span className="text-amber-300 font-mono font-black">{myEntry.finalScore.toFixed(2)} / 100 Pts</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
                    <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40">
                      <span className="text-purple-300 block">Accuracy (40)</span>
                      <strong className="text-white font-mono">{myEntry.breakdown.accuracyScore.toFixed(1)}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40">
                      <span className="text-purple-300 block">Time (30)</span>
                      <strong className="text-white font-mono">{myEntry.breakdown.timeScore.toFixed(1)}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40">
                      <span className="text-purple-300 block">Lives (20)</span>
                      <strong className="text-white font-mono">{myEntry.breakdown.livesScore.toFixed(1)}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40">
                      <span className="text-purple-300 block">Efficiency (10)</span>
                      <strong className="text-white font-mono">{myEntry.breakdown.efficiencyScore.toFixed(1)}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons: Play Again & Return */}
            <div className="flex items-center gap-3 pt-3 border-t border-purple-700/30">
              {isHost ? (
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-[1.02]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              ) : (
                <div className="flex-1 text-center text-xs text-purple-300 font-semibold italic py-2">
                  Waiting for host to restart game...
                </div>
              )}

              <button
                onClick={onLeaveGame}
                className="py-3 px-5 rounded-xl font-bold bg-slate-900/80 hover:bg-slate-800 border border-purple-500/30 text-purple-200 hover:text-white transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT ROOM CONFIRMATION MODAL */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#21073F] to-[#120426] border border-rose-500/50 rounded-2xl shadow-2xl p-5 sm:p-6 text-center space-y-4 text-white">
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Exit Detective Room?</h3>
              <p className="text-xs text-purple-200/80 mt-1.5 leading-relaxed">
                Are you sure you want to leave Room <span className="font-mono font-bold text-amber-300">{roomCode}</span>? Your investigation will end and you will return to the home screen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              >
                Stay in Game
              </button>
              <button
                onClick={() => {
                  socket.emit("leaveRoom", { roomCode, playerId: currentPlayerId });
                  setShowExitConfirm(false);
                  onLeaveGame();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_15px_rgba(239,68,68,0.4)] transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Exit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

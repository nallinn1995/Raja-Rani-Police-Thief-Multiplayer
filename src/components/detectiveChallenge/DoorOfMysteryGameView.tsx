import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Users,
  ChevronDown,
  ChevronUp,
  Crown,
  Home,
  Clock,
  Star,
  X,
  BarChart3,
  ChevronRight,
  Zap,
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
import { performanceManager, QualityProfile } from "../../services/performanceManager";

interface DoorOfMysteryGameViewProps {
  socket: Socket;
  roomCode: string;
  currentPlayerId: string;
  isHost: boolean;
  initialPublicState?: DetectivePublicGameState | null;
  onLeaveGame: () => void;
  onOpenDashboard?: () => void;
}

export const DoorOfMysteryGameView: React.FC<DoorOfMysteryGameViewProps> = ({
  socket,
  roomCode,
  currentPlayerId,
  isHost,
  initialPublicState,
  onLeaveGame,
  onOpenDashboard,
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
  const [latestDoorResult, setLatestDoorResult] = useState<{ doorId: number; result: DetectiveDoorOutcome; clue?: string | null; clueRiddles?: Record<string, string> | null } | null>(null);
  const [activeClue, setActiveClue] = useState<string | null>(null);
  const [clueRiddles, setClueRiddles] = useState<Record<string, string> | null>(null);
  const [currentLayout, setCurrentLayout] = useState<'mobile-4-4-2' | 'desktop-5-2'>('desktop-5-2');
  const [isRequestPending, setIsRequestPending] = useState<boolean>(false);

  // Derive layout-specific riddle matching current screen matrix resolution
  // Strictly only active if the player has actually uncovered a CLUE door in the current match!
  const hasRevealedClue = Array.from(revealedDoors.values()).includes("CLUE");
  const effectiveClue = hasRevealedClue
    ? (clueRiddles && clueRiddles[currentLayout]) || activeClue
    : null;

  // Room Players Public Roster
  const [playersRoster, setPlayersRoster] = useState<DetectivePlayerPublicState[]>(() => {
    return initialPublicState?.players ?? [];
  });

  // Joined Players Accordion Dropdown State
  const [isPlayersAccordionOpen, setIsPlayersAccordionOpen] = useState<boolean>(false);
  const playersAccordionRef = useRef<HTMLDivElement | null>(null);

  // Graphics Quality Profile State
  const [qualityProfile, setQualityProfile] = useState<QualityProfile>(() => performanceManager.getQualityProfile());
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const qualityMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = performanceManager.subscribe((_tier, profile) => {
      setQualityProfile(profile);
    });
    return unsub;
  }, []);

  // Close accordion & quality dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        playersAccordionRef.current &&
        !playersAccordionRef.current.contains(event.target as Node)
      ) {
        setIsPlayersAccordionOpen(false);
      }
      if (
        qualityMenuRef.current &&
        !qualityMenuRef.current.contains(event.target as Node)
      ) {
        setShowQualityMenu(false);
      }
    };
    if (isPlayersAccordionOpen || showQualityMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPlayersAccordionOpen, showQualityMenu]);

  // Lock window scroll completely so detective challenge stays fixed in viewport with no layout shifts or auto-scroll
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as any });
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const preventScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("scroll", preventScroll, { passive: true });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("scroll", preventScroll);
    };
  }, []);

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
    setActiveClue(null);
    setClueRiddles(null);
    setIsPlayersAccordionOpen(false);
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

      setLatestDoorResult({ doorId: data.doorId, result: data.result, clue: data.clue, clueRiddles: data.clueRiddles });

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
      } else if (data.result === "CLUE") {
        if (data.clueRiddles) {
          setClueRiddles(data.clueRiddles);
        }
        setActiveClue(data.clue || null);
        // Toast banner omitted as requested: only the pinned clue banner at the top shows
      } else if (data.result === "LIFE") {
        showBanner(`❤️ +1 EXTRA LIFE! Vitality Restored! (${data.livesRemaining} Lives)`, "safe", 5000);
      }
    };

    const handlePlayerUpdated = (data: DetectivePlayerPublicState & { playerId?: string }) => {
      const targetId = data.id || data.playerId;
      if (!targetId) return;
      const updatedItem: DetectivePlayerPublicState = {
        ...data,
        id: targetId,
      };

      setPlayersRoster((prev) => {
        const index = prev.findIndex((p) => p.id === targetId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedItem };
          return next;
        }
        return [...prev, updatedItem];
      });

      if (targetId !== currentPlayerId) {
        if (data.status === "CAUGHT") {
          showBanner(`🏆 Detective ${data.name} CAUGHT their Thief!`, "thief", 4000);
        } else if (data.status === "ELIMINATED") {
          showBanner(`⚠️ Detective ${data.name} was ELIMINATED by a bomb.`, "bomb", 3000);
        }
      }
    };

    const handleGameFinished = (data: DetectiveGameFinishedPayload) => {
      setIsGameOver(true);
      setFinalResults(data);
      if (modalTimeoutRef.current) clearTimeout(modalTimeoutRef.current);
      // Reveal results modal after 3.5 seconds so players can clearly see the Thief in Jail, Iron Bars & ARRESTED Stamp
      modalTimeoutRef.current = setTimeout(() => {
        setShowResultModal(true);
      }, 3500);
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
        if (data.myState.clue) {
          setActiveClue(data.myState.clue);
        }
        if (data.myState.clueRiddles) {
          setClueRiddles(data.myState.clueRiddles);
        }
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

  // Stable Door click handler (useCallback prevents unnecessary DoorOfMysteryScene re-renders during timer ticks)
  const handleOpenDoor = useCallback(
    (doorId: number) => {
      if (isGameOver || myStatus !== "INVESTIGATING" || lives <= 0 || isRequestPending) {
        return;
      }
      if (revealedDoors.has(doorId)) return;

      setIsRequestPending(true);
      socket.emit("detective:openDoor", {
        roomCode,
        playerId: currentPlayerId,
        doorId,
        layout: currentLayout,
      });
    },
    [isGameOver, myStatus, lives, isRequestPending, revealedDoors, socket, roomCode, currentPlayerId, currentLayout]
  );

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

  const otherPlayers: DetectivePlayerPublicState[] = useMemo(() => {
    return playersRoster.filter(
      (p: DetectivePlayerPublicState) => p.id && String(p.id).trim() !== String(currentPlayerId).trim()
    );
  }, [playersRoster, currentPlayerId]);

  return (
    <div
      style={{ backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')" }}
      className="fixed inset-x-0 bottom-0 top-[45px] sm:top-[53px] w-full overflow-hidden bg-[#0A041A] bg-cover bg-center bg-no-repeat font-sans text-white select-none touch-none overscroll-none flex flex-col"
    >
      {/* Dark palace vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A021A]/70 via-transparent to-[#0A021A]/85 pointer-events-none z-0" />

      {/* 2D HUD OVERLAY (TOP BAR) - FULLY RESPONSIVE 2-TIER MOBILE-FIRST LAYOUT */}
      <header className="relative z-20 w-full px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-b from-[#090214]/98 via-[#0e041e]/90 to-[#090214]/80 backdrop-blur-md border-b border-purple-500/20 shrink-0 space-y-1 sm:space-y-1.5">
        {/* Tier 1: Navigation, Mode, Timer, Joined Detectives & Room Actions */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full">
          {/* Left: Mode Title & Room Code */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-900/70 border border-amber-400/50 flex items-center justify-center shadow-md shrink-0">
              <span className="text-xs sm:text-base">🗝️</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-[10px] sm:text-xs md:text-sm font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 uppercase leading-tight truncate">
                Door of Mystery
              </h1>
              <p className="text-[8px] sm:text-[10px] text-purple-300 font-semibold tracking-wide leading-tight">
                Room <span className="font-mono text-amber-300 font-bold">{roomCode}</span>
              </p>
            </div>
          </div>

          {/* Center: Authoritative Countdown Timer */}
          <div className="shrink-0 flex items-center justify-center">
            <div
              className={`px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full border shadow-md flex items-center space-x-1 transition-colors ${
                secondsRemaining <= 10
                  ? "bg-rose-950/95 border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/50"
                  : "bg-[#140628]/95 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.25)]"
              }`}
            >
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-purple-200 hidden xs:inline">Time:</span>
              <span className="font-mono font-black text-xs sm:text-sm md:text-base tabular-nums tracking-wider">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          </div>

          {/* Right: Joined Detectives Roster, Sound Mute & Exit */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Other Detectives: Single Player View */}
            {otherPlayers.length === 1 && (
              <div
                key={otherPlayers[0].id}
                className="flex items-center space-x-1 px-1.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-purple-950/80 border border-purple-700/40 shadow-sm shrink-0"
                title={`${otherPlayers[0].name}: ${otherPlayers[0].lives} lives, Status: ${otherPlayers[0].status}`}
              >
                <span className="text-[10px] sm:text-xs">🕵️</span>
                <span className="text-[9px] sm:text-xs font-bold text-white truncate max-w-[45px] sm:max-w-[75px]">
                  {otherPlayers[0].name}
                </span>
                <span
                  className={`text-[7px] sm:text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                    otherPlayers[0].status === "CAUGHT"
                      ? "bg-amber-400 text-black font-black"
                      : otherPlayers[0].status === "ELIMINATED"
                      ? "bg-rose-600 text-white"
                      : otherPlayers[0].status === "TIMEOUT"
                      ? "bg-slate-700 text-slate-300"
                      : "bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 animate-pulse"
                  }`}
                >
                  {otherPlayers[0].status === "CAUGHT"
                    ? "🏆 CAUGHT"
                    : otherPlayers[0].status === "ELIMINATED"
                    ? "💀 OUT"
                    : otherPlayers[0].status === "TIMEOUT"
                    ? "⏳ TIMEOUT"
                    : "🕵️ Investigating..."}
                </span>
              </div>
            )}

            {/* Other Detectives: Accordion Dropdown if > 1 Player */}
            {otherPlayers.length > 1 && (
              <div className="relative" ref={playersAccordionRef}>
                <button
                  type="button"
                  onClick={() => setIsPlayersAccordionOpen((prev) => !prev)}
                  className={`flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border transition-all cursor-pointer select-none text-[9px] sm:text-xs font-bold shadow-md ${
                    isPlayersAccordionOpen
                      ? "bg-purple-900 border-amber-400 text-amber-200 ring-2 ring-amber-400/40"
                      : "bg-[#16062b]/90 hover:bg-[#250a45] border-purple-500/40 text-purple-200 hover:text-white"
                  }`}
                  title="Toggle Other Detectives Roster"
                >
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-black">
                    {otherPlayers.length} <span className="hidden sm:inline">Detectives</span>
                  </span>
                  {isPlayersAccordionOpen ? (
                    <ChevronUp className="w-3 h-3 text-amber-300 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-purple-300 shrink-0" />
                  )}
                </button>

                {/* Accordion Dropdown Menu */}
                {isPlayersAccordionOpen && (
                  <div className="absolute top-full right-0 mt-2 z-50 w-64 sm:w-72 bg-gradient-to-b from-[#1c0736] via-[#120424] to-[#0a0114] border-2 border-amber-400/60 shadow-[0_0_30px_rgba(0,0,0,0.9)] rounded-2xl p-3 backdrop-blur-xl animate-fade-in space-y-2">
                    <div className="flex items-center justify-between border-b border-purple-500/30 pb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] sm:text-xs font-black text-amber-200 uppercase tracking-wide">
                          Other Detectives ({otherPlayers.length})
                        </span>
                      </div>
                      <button
                        onClick={() => setIsPlayersAccordionOpen(false)}
                        className="text-purple-300 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-purple-800/50 transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {otherPlayers.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-purple-950/70 border border-purple-700/40 shadow-inner"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-sm">🕵️</span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-extrabold text-white truncate max-w-[100px] sm:max-w-[130px]">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-rose-400 font-mono">
                                {"❤️".repeat(Math.max(0, p.lives))}
                                {p.lives === 0 && <span className="text-slate-400 text-[9px] ml-1">Out</span>}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm shrink-0 ${
                              p.status === "CAUGHT"
                                ? "bg-amber-400 text-black font-black"
                                : p.status === "ELIMINATED"
                                ? "bg-rose-600 text-white"
                                : p.status === "TIMEOUT"
                                ? "bg-slate-700 text-slate-300"
                                : "bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 animate-pulse"
                            }`}
                          >
                            {p.status === "CAUGHT"
                              ? "🏆 CAUGHT"
                              : p.status === "ELIMINATED"
                              ? "💀 OUT"
                              : p.status === "TIMEOUT"
                              ? "⏳ TIMEOUT"
                              : "🕵️ Investigating..."}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Graphics Quality Control Button & Popover */}
            <div className="relative shrink-0" ref={qualityMenuRef}>
              <button
                onClick={() => setShowQualityMenu((prev) => !prev)}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#16062b]/80 border border-purple-500/30 text-purple-200 hover:text-amber-300 transition shadow cursor-pointer text-[9px] sm:text-xs font-bold shrink-0"
                title="Graphics & Performance Quality"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span className="hidden xs:inline uppercase text-[9px] tracking-wider font-extrabold">
                  {qualityProfile === "POWER_SAVER" ? "SAVER" : qualityProfile}
                </span>
              </button>

              {showQualityMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#140428]/95 backdrop-blur-xl border border-amber-400/40 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in flex flex-col gap-1">
                  <div className="px-2 py-1 text-[10px] font-black tracking-wider text-amber-300 uppercase border-b border-purple-500/20">
                    Graphics Quality
                  </div>
                  {(["AUTO", "HIGH", "MEDIUM", "LOW", "POWER_SAVER"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        performanceManager.setProfile(mode);
                        setQualityProfile(mode);
                        setShowQualityMenu(false);
                      }}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-bold transition text-left cursor-pointer ${
                        qualityProfile === mode
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                          : "text-purple-200 hover:bg-purple-900/40 hover:text-white"
                      }`}
                    >
                      <span>
                        {mode === "POWER_SAVER"
                          ? "🍃 Power Saver"
                          : mode === "AUTO"
                          ? "⚡ Auto (Adaptive)"
                          : mode === "HIGH"
                          ? "💎 High Quality"
                          : mode === "MEDIUM"
                          ? "⚖️ Medium (Balanced)"
                          : "🚀 Low Performance"}
                      </span>
                      {qualityProfile === mode && <span className="text-amber-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-[#16062b]/80 border border-purple-500/30 text-purple-300 hover:text-white transition shadow cursor-pointer shrink-0"
              title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            {/* Exit Room Button */}
            <button
              onClick={() => setShowExitConfirm(true)}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 hover:text-white transition shadow cursor-pointer text-[9px] sm:text-xs font-bold shrink-0"
              title="Exit Room"
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Gameplay Counters (Attempts, Safe, Bombs), My Status, and Lives Hearts */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full pt-0.5">
          {/* Left: Attempts, Safe, Bombs Chips */}
          <div className="flex items-center gap-1 sm:gap-2 bg-[#130528]/95 px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-purple-500/30 shadow-inner shrink-0">
            <div className="flex items-center space-x-1" title={`Attempts: ${attempts}`}>
              <Target className="w-3 h-3 text-amber-300 shrink-0" />
              <span className="text-[10px] sm:text-xs font-black text-white">{attempts}</span>
            </div>

            <div className="w-px h-3 bg-purple-500/30" />

            <div className="flex items-center space-x-1" title={`Safe Doors: ${safeDoorsFound} / 4`}>
              <Shield className="w-3 h-3 text-emerald-300 shrink-0" />
              <span className="text-[10px] sm:text-xs font-black text-emerald-300">{safeDoorsFound}/4</span>
            </div>

            <div className="w-px h-3 bg-purple-500/30" />

            <div className="flex items-center space-x-1" title={`Bombs: ${bombsTriggered} / 3`}>
              <Flame className="w-3 h-3 text-rose-300 shrink-0" />
              <span className="text-[10px] sm:text-xs font-black text-rose-300">{bombsTriggered}/3</span>
            </div>
          </div>

          {/* Center: My Status Badge */}
          <div className="flex items-center bg-[#130528]/95 px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-purple-500/30 shadow-inner min-w-0 shrink">
            <span
              className={`text-[8px] sm:text-[10px] md:text-xs font-black tracking-wider uppercase truncate leading-none ${
                myStatus === "CAUGHT"
                  ? "text-amber-400"
                  : myStatus === "ELIMINATED"
                  ? "text-rose-400"
                  : myStatus === "TIMEOUT"
                  ? "text-slate-400"
                  : "text-cyan-400"
              }`}
            >
              {myStatus === "CAUGHT" && !isGameOver
                ? "🏆 THIEF CAUGHT — WAITING FOR OTHERS"
                : myStatus === "INVESTIGATING"
                ? "INVESTIGATING"
                : myStatus}
              {investigationTimeMs && ` (${(investigationTimeMs / 1000).toFixed(1)}s)`}
            </span>
          </div>

          {/* Right: Lives Hearts */}
          <div className="flex items-center space-x-1 px-2 py-0.5 sm:py-1 bg-[#150529]/90 rounded-lg sm:rounded-xl border border-purple-500/30 shadow-inner shrink-0">
            {Array.from({ length: Math.max(3, lives) }, (_, i) => i + 1).map((heartNum) => (
              <Heart
                key={heartNum}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${
                  lives >= heartNum
                    ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-105"
                    : "text-slate-600 fill-slate-800 scale-90 opacity-60"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* 3D PLAYABLE SCENE (BABYLON.JS) - FILLS ENTIRE REMAINING AREA WITH PERFECT 4-WAY CENTERING */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <DoorOfMysteryScene
          revealedDoors={revealedDoors}
          selectedDoorId={null}
          latestDoorResult={latestDoorResult}
          activeClue={effectiveClue}
          clueRiddles={clueRiddles}
          onOpenDoor={handleOpenDoor}
          onLayoutChange={setCurrentLayout}
          canInteract={canInteract}
          resetKey={resetKey}
          roomCode={roomCode}
        />
      </main>

      {/* WAITING FOR OTHERS OVERLAY (WHEN CURRENT PLAYER CAUGHT THIEF BUT OTHERS ARE STILL PLAYING) */}
      {!isGameOver && myStatus === "CAUGHT" && (
        <div className="absolute top-16 sm:top-20 inset-x-0 flex justify-center pointer-events-none z-30 px-3 animate-fade-in">
          <div className="w-auto max-w-[92vw] sm:max-w-md bg-gradient-to-r from-amber-950/95 via-[#230a42]/95 to-amber-950/95 border-2 border-amber-400/80 px-4 sm:px-6 py-2 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] flex flex-col items-center text-center backdrop-blur-md">
            <div className="flex items-center space-x-2 text-amber-300">
              <span className="text-base sm:text-lg">🏆</span>
              <span className="text-xs sm:text-sm font-black tracking-wider uppercase">Thief Captured!</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold text-purple-200">
                Waiting for other detectives...
              </span>
            </div>
            {otherPlayers.some((p) => p.status === "INVESTIGATING") && (
              <span className="text-[10px] text-purple-300/80 mt-0.5">
                {otherPlayers.filter((p) => p.status === "INVESTIGATING").length} detective(s) still investigating
              </span>
            )}
          </div>
        </div>
      )}

      {/* PINNED SECRET CLUE BANNER (WHEN CLUE DOOR IS REVEALED) */}
      {effectiveClue && (
        <div className="absolute top-16 sm:top-20 inset-x-0 flex justify-center pointer-events-none z-20 px-3 animate-fade-in">
          <div className="w-auto max-w-[92vw] sm:max-w-xl">
            <div className="px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-purple-950/95 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center space-x-2 text-center text-xs sm:text-sm font-black text-amber-200 backdrop-blur-md animate-pulse">
              <span className="text-base shrink-0">📜</span>
              <span className="text-amber-400 uppercase tracking-wide font-black shrink-0">CLUE:</span>
              <span className="text-white drop-shadow-md break-words">{effectiveClue}</span>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC ALERT BANNER - FULLY RESPONSIVE, CENTERED & ZERO OVERFLOW */}
      {bannerMessage && (
        <div className="fixed top-14 sm:top-16 inset-x-0 flex justify-center pointer-events-none z-40 px-3">
          <div className="w-auto max-w-[90vw] sm:max-w-md animate-bounce mx-auto">
            <div
              className={`px-3.5 py-1.5 rounded-full border backdrop-blur-xl shadow-2xl flex items-center justify-center space-x-2 text-center text-xs sm:text-sm font-black tracking-wide break-words ${
                bannerMessage.type === "safe"
                  ? "bg-emerald-950/95 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  : bannerMessage.type === "bomb"
                  ? "bg-rose-950/95 border-rose-500 text-rose-200 shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                  : bannerMessage.type === "thief"
                  ? "bg-amber-950/95 border-amber-400 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                  : "bg-purple-950/95 border-purple-400 text-purple-200"
              }`}
            >
              {bannerMessage.type === "bomb" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {bannerMessage.type === "thief" && <Trophy className="w-4 h-4 text-amber-400 shrink-0" />}
              {bannerMessage.type === "safe" && <Shield className="w-4 h-4 text-emerald-400 shrink-0" />}
              <span className="break-words line-clamp-2">{bannerMessage.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* FINAL LEADERBOARD & RESULT MODAL - MATCHING ROYAL REFERENCE DESIGN */}
      {showResultModal && finalResults && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in flex min-h-full">
          {/* Main Modal Frame - Vertically and Horizontally Centered with Constant Padding */}
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#18042b] via-[#120224] to-[#0a0114] border-2 border-amber-400/80 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-white font-sans flex flex-col gap-3 m-auto">
            {/* Ambient Palace Torch Glow Accents */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Right Circular Close Button */}
            <button
              onClick={onLeaveGame}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#200738]/90 border border-purple-400/60 hover:border-amber-400 text-purple-200 hover:text-white flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] transition cursor-pointer z-20 group"
              title="Close & Return to Home"
            >
              <X className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            </button>

            {/* Header: Trophy, Laurels & 3D Ribbon Banner */}
            <div className="flex flex-col items-center text-center relative pt-1">
              {/* Circular Halo Ring with Laurel Leaves & Golden Trophy */}
              <div className="relative flex items-center justify-center mb-1">
                <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-400/30 via-purple-900/50 to-[#120324] border-2 border-amber-400/80 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5),inset_0_0_15px_rgba(251,191,36,0.3)] relative">
                  {/* Laurel Wreath SVG */}
                  <svg className="absolute inset-0 w-full h-full text-amber-400 pointer-events-none drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 28,70 C 20,55 20,38 32,24 C 28,32 26,45 32,58 Z" opacity="0.9" />
                    <circle cx="23" cy="45" r="2.2" />
                    <circle cx="26" cy="33" r="2.2" />
                    <circle cx="33" cy="24" r="2.2" />
                    <path d="M 72,70 C 80,55 80,38 68,24 C 72,32 74,45 68,58 Z" opacity="0.9" />
                    <circle cx="77" cy="45" r="2.2" />
                    <circle cx="74" cy="33" r="2.2" />
                    <circle cx="67" cy="24" r="2.2" />
                  </svg>
                  {/* Golden Trophy with Star */}
                  <div className="relative flex flex-col items-center justify-center">
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                    <Star className="w-3 h-3 text-amber-200 fill-amber-200 absolute -top-1" />
                  </div>
                </div>
              </div>

              {/* 3D Royal Purple & Gold Ribbon */}
              <div className="relative w-full max-w-xs sm:max-w-sm my-1 flex justify-center items-center">
                <div className="w-full bg-gradient-to-r from-[#2c094d] via-[#48117d] to-[#2c094d] border-y-2 border-amber-400 px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg shadow-[0_6px_20px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.3)] flex flex-col items-center">
                  <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] text-amber-300 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    DETECTIVE CHALLENGE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-500 uppercase drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)] leading-tight mt-0.5">
                    COMPLETE
                  </h2>
                </div>
              </div>

              {/* Door Announcement Pill */}
              {(() => {
                const myEntry = finalResults.leaderboard.find((e: DetectiveLeaderboardEntry) => e.id === currentPlayerId);
                const myThief = myEntry?.thiefDoor ?? finalResults.secretLayout?.thiefDoor;
                const formattedDoor = myThief ? (myThief < 10 ? `0${myThief}` : `${myThief}`) : null;
                return (
                  <div className="mt-1 px-3 sm:px-4 py-1 rounded-xl bg-[#1a052e]/90 border border-amber-400/50 shadow-[0_0_15px_rgba(0,0,0,0.6)] flex items-center justify-center space-x-1.5 text-xs sm:text-sm text-purple-200">
                    <span>Your hidden Thief was behind</span>
                    <span className="text-amber-400 font-black font-mono tracking-wide">
                      {formattedDoor ? `Door #${formattedDoor}` : "Unknown"}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Leaderboard / Player Cards (Scrollable when > 2 players) */}
            <div
              className={`space-y-2 ${
                finalResults.leaderboard.length > 2
                  ? "max-h-[38vh] sm:max-h-[44vh] overflow-y-auto pr-1.5"
                  : ""
              }`}
              style={
                finalResults.leaderboard.length > 2
                  ? {
                      scrollbarWidth: "thin",
                      scrollbarColor: "#f59e0b #18082e",
                    }
                  : undefined
              }
            >
              {finalResults.leaderboard.map((entry: DetectiveLeaderboardEntry) => {
                const isMe = entry.id === currentPlayerId;
                const isFirst = entry.rank === 1;

                return (
                  <div
                    key={entry.id}
                    className={`p-2.5 sm:p-3.5 rounded-2xl border-2 flex items-center justify-between gap-2 transition ${
                      isFirst
                        ? "bg-gradient-to-r from-[#2c0847]/95 via-[#1e0536]/95 to-[#2c0847]/95 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                        : isMe
                        ? "bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border-amber-400/60 shadow-md"
                        : "bg-[#18082e]/85 border-purple-700/40"
                    }`}
                  >
                    {/* Left: Medallion with Crown on Top */}
                    <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                      <div className="relative shrink-0 pt-2">
                        {isFirst && (
                          <Crown className="w-4 h-4 text-amber-300 fill-amber-300 absolute top-0 left-1/2 -translate-x-1/2 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                        )}
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-md ${
                            isFirst
                              ? "bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-slate-950 border border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                              : entry.rank === 2
                              ? "bg-gradient-to-b from-slate-200 to-slate-400 text-slate-950 border border-slate-300"
                              : entry.rank === 3
                              ? "bg-gradient-to-b from-amber-700 to-amber-900 text-amber-200 border border-amber-600"
                              : "bg-purple-950/80 text-purple-300 border border-purple-600/40"
                          }`}
                        >
                          #{entry.rank}
                        </div>
                      </div>

                      {/* Name & Subtitle & 3 Stats Row */}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[110px] sm:max-w-[160px]">
                            {entry.name}
                          </h4>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black uppercase shrink-0">
                              YOU
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 leading-tight mt-0.5">
                          {entry.status === "CAUGHT" ? (
                            <span>THIEF CAUGHT</span>
                          ) : entry.status === "ELIMINATED" ? (
                            <span className="text-rose-400">BOMB DETONATED</span>
                          ) : (
                            <span className="text-slate-400">TIME EXPIRED</span>
                          )}
                        </div>

                        {/* 3 Stats in a Row */}
                        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[11px] text-purple-200 mt-1">
                          <div className="flex items-center space-x-1" title="Time Taken">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-bold">{entry.investigationTimeSec ? `${entry.investigationTimeSec.toFixed(1)}s` : "--"}</span>
                            <span className="text-purple-400 text-[8px] uppercase">TIME</span>
                          </div>
                          <div className="flex items-center space-x-1" title="Accuracy">
                            <Target className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="font-bold">{entry.accuracyPercent}%</span>
                            <span className="text-purple-400 text-[8px] uppercase">ACC</span>
                          </div>
                          <div className="flex items-center space-x-1" title="Lives Remaining">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                            <span className="font-bold">{entry.livesRemaining}</span>
                            <span className="text-purple-400 text-[8px] uppercase">{entry.livesRemaining === 1 ? "LIFE" : "LIVES"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score Card with Crown & Evaluation Pill */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-[#140426]/90 border border-purple-500/40 text-center shrink-0 min-w-[72px] sm:min-w-[84px] shadow-inner">
                      <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400 mx-auto" />
                      <span className="text-[8px] sm:text-[9px] text-purple-300 font-bold uppercase tracking-wider block leading-tight">
                        SCORE
                      </span>
                      <span className="text-sm sm:text-lg font-black text-amber-300 font-mono tracking-tight block leading-tight mt-0.5">
                        {entry.finalScore.toFixed(2)}
                      </span>
                      <span className="inline-block px-1.5 py-0.2 rounded-full text-[7px] sm:text-[8px] font-black uppercase bg-purple-900/90 border border-amber-400/60 text-amber-300 tracking-wide mt-1">
                        {entry.finalScore >= 90
                          ? "EXCELLENT!"
                          : entry.finalScore >= 75
                          ? "GREAT JOB!"
                          : entry.finalScore >= 50
                          ? "GOOD EFFORT!"
                          : "COMPLETED"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* YOUR SCORE BREAKDOWN Card */}
            {(() => {
              const myEntry = finalResults.leaderboard.find((e) => e.id === currentPlayerId);
              if (!myEntry) return null;

              return (
                <div className="rounded-2xl bg-gradient-to-b from-[#18062e]/95 to-[#120324]/95 border border-purple-500/40 p-2.5 sm:p-3.5 shadow-xl">
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold uppercase mb-2">
                    <span className="flex items-center gap-1.5 text-white font-black tracking-wide">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>YOUR SCORE BREAKDOWN</span>
                    </span>
                    <span className="text-amber-300 font-mono font-black tracking-wider">
                      {myEntry.finalScore.toFixed(2)} / 100 PTS
                    </span>
                  </div>

                  {/* 4 Score Breakdown Cards */}
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
                    {/* Accuracy Card */}
                    <div className="p-1.5 sm:p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 flex flex-col items-center justify-between">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500/20 flex items-center justify-center mb-1">
                        <Target className="w-3 h-3 text-rose-400" />
                      </div>
                      <strong className="text-white font-mono text-xs sm:text-sm font-black block">
                        {myEntry.breakdown.accuracyScore.toFixed(1)}
                      </strong>
                      <span className="text-purple-300 text-[9px] sm:text-[10px] block leading-tight mt-0.5">Accuracy</span>
                      <span className="text-purple-400 text-[8px] sm:text-[9px] font-mono">(40)</span>
                    </div>

                    {/* Time Card */}
                    <div className="p-1.5 sm:p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 flex flex-col items-center justify-between">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500/20 flex items-center justify-center mb-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                      </div>
                      <strong className="text-white font-mono text-xs sm:text-sm font-black block">
                        {myEntry.breakdown.timeScore.toFixed(1)}
                      </strong>
                      <span className="text-purple-300 text-[9px] sm:text-[10px] block leading-tight mt-0.5">Time</span>
                      <span className="text-purple-400 text-[8px] sm:text-[9px] font-mono">(30)</span>
                    </div>

                    {/* Lives Card */}
                    <div className="p-1.5 sm:p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 flex flex-col items-center justify-between">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500/20 flex items-center justify-center mb-1">
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                      </div>
                      <strong className="text-white font-mono text-xs sm:text-sm font-black block">
                        {myEntry.breakdown.livesScore.toFixed(1)}
                      </strong>
                      <span className="text-purple-300 text-[9px] sm:text-[10px] block leading-tight mt-0.5">Lives</span>
                      <span className="text-purple-400 text-[8px] sm:text-[9px] font-mono">(20)</span>
                    </div>

                    {/* Efficiency Card */}
                    <div className="p-1.5 sm:p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 flex flex-col items-center justify-between">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-500/20 flex items-center justify-center mb-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      </div>
                      <strong className="text-white font-mono text-xs sm:text-sm font-black block">
                        {myEntry.breakdown.efficiencyScore.toFixed(1)}
                      </strong>
                      <span className="text-purple-300 text-[9px] sm:text-[10px] block leading-tight mt-0.5">Efficiency</span>
                      <span className="text-purple-400 text-[8px] sm:text-[9px] font-mono">(10)</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Commentary / Quote Ribbon */}
            {(() => {
              const myEntry = finalResults.leaderboard.find((e) => e.id === currentPlayerId);
              return (
                <div className="relative px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#1b0533] via-[#2a084e] to-[#1b0533] border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-center">
                  <span className="text-amber-400 font-serif text-base mr-1">“</span>
                  <span className="text-amber-200 text-xs sm:text-sm font-semibold italic tracking-wide">
                    {myEntry?.status === "CAUGHT"
                      ? myEntry.finalScore >= 90
                        ? "Excellent investigation!"
                        : "Great detective work! You caught the thief!"
                      : myEntry?.status === "ELIMINATED"
                      ? "Perilous mission! Watch out for bombs next time!"
                      : "The thief slipped into shadows! Keep investigating!"}
                  </span>
                  <span className="text-amber-400 font-serif text-base ml-1">”</span>
                </div>
              );
            })()}

            {/* Action Buttons: Check Profile & Stats, Play Again, Return to Home */}
            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="w-full py-2.5 sm:py-3 px-4 rounded-2xl font-black bg-gradient-to-r from-amber-500/20 via-purple-900/80 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/30 border-2 border-amber-400/80 hover:border-amber-300 text-amber-300 font-sans transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-[1.01] active:scale-95 text-xs sm:text-sm"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold uppercase tracking-wide">Check Profile Dashboard & Stats</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3 pt-1">
              {isHost ? (
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-2xl font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-[1.02] active:scale-95 text-xs sm:text-sm"
                >
                  <RotateCcw className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Play Again</span>
                </button>
              ) : (
                <div className="flex-1 text-center text-xs text-purple-300 font-semibold italic py-2">
                  Waiting for host to restart game...
                </div>
              )}

              <button
                onClick={onLeaveGame}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-2xl font-bold bg-gradient-to-r from-[#17052c] to-[#250847] hover:bg-[#320a5e] border-2 border-purple-500/50 hover:border-amber-400 text-white transition-all shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-[1.02] active:scale-95 text-xs sm:text-sm"
              >
                <Home className="w-4 h-4 text-purple-300" />
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

import React, { useState, useEffect } from "react";
import { Shield, MessageCircle, Heart, LogOut } from "lucide-react";
import { Socket } from "socket.io-client";
import { Player, ChatMessage } from "../types/game";
import { Chat } from "./Chat";
import { ClassicCardSelection } from "./ClassicCardSelection";

interface GameBoardProps {
  socket?: Socket | null;
  room: {
    id: string;
    name: string;
    currentRound: number;
    totalRounds: number;
    gameState: string;
    gameMode?: string;
    winCondition?: string;
    targetScore?: number;
    guessingEndTime?: number;
    players: Player[];
  };
  currentPlayerId: string;
  myRole?: string;
  policeId?: string;
  allRoles?: Player[];
  messages: ChatMessage[];
  cardsState?: { id: string; selectedBy: string | null }[];
  myPrivateRole?: { cardId: string; role: string } | null;
  onPoliceReveal: () => void;
  onMakeGuess: (guessedThiefId: string) => void;
  onSendMessage: (message: string) => void;
  onLeaveRoom?: () => void;
}

const ROLE_VIDEOS: Record<string, string> = {
  raja: "/assets/raja.mp4",
  rani: "/assets/rani.mp4",
  police: "/assets/police.mp4",
  thief: "/assets/thief.mp4",
  chor: "/assets/thief.mp4",
};

const ROLE_CONFIGS: Record<string, { title: string; badgeStyle: string; borderStyle: string }> = {
  raja: {
    title: "Raja",
    badgeStyle:
      "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.8)] border border-amber-300",
    borderStyle: "border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.4)]",
  },
  rani: {
    title: "Rani",
    badgeStyle:
      "bg-gradient-to-r from-pink-400 via-fuchsia-400 to-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] border border-pink-300",
    borderStyle: "border-pink-400/80 shadow-[0_0_30px_rgba(236,72,153,0.4)]",
  },
  police: {
    title: "Police",
    badgeStyle:
      "bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.8)] border border-blue-300",
    borderStyle: "border-blue-400/80 shadow-[0_0_30px_rgba(59,130,246,0.4)]",
  },
  thief: {
    title: "Thief",
    badgeStyle:
      "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.8)] border border-emerald-300",
  },
};

const GAME_BOARD_PARTICLES = [
  { id: 0, width: "3px", height: "3px", top: "12%", left: "18%", animationDuration: "3.2s", animationDelay: "0.5s", opacity: 0.8 },
  { id: 1, width: "2px", height: "2px", top: "25%", left: "75%", animationDuration: "4.1s", animationDelay: "1.2s", opacity: 0.6 },
  { id: 2, width: "4px", height: "4px", top: "40%", left: "10%", animationDuration: "2.8s", animationDelay: "0.2s", opacity: 0.75 },
  { id: 3, width: "2px", height: "2px", top: "55%", left: "88%", animationDuration: "3.5s", animationDelay: "1.8s", opacity: 0.5 },
  { id: 4, width: "3px", height: "3px", top: "70%", left: "22%", animationDuration: "4.5s", animationDelay: "0.8s", opacity: 0.9 },
  { id: 5, width: "2px", height: "2px", top: "85%", left: "65%", animationDuration: "3.0s", animationDelay: "1.5s", opacity: 0.65 },
  { id: 6, width: "3px", height: "3px", top: "15%", left: "45%", animationDuration: "3.8s", animationDelay: "0.3s", opacity: 0.7 },
  { id: 7, width: "4px", height: "4px", top: "32%", left: "92%", animationDuration: "4.2s", animationDelay: "1.1s", opacity: 0.85 },
  { id: 8, width: "2px", height: "2px", top: "48%", left: "35%", animationDuration: "2.9s", animationDelay: "0.7s", opacity: 0.6 },
  { id: 9, width: "3px", height: "3px", top: "62%", left: "78%", animationDuration: "3.6s", animationDelay: "1.4s", opacity: 0.75 },
  { id: 10, width: "2px", height: "2px", top: "78%", left: "8%", animationDuration: "4.0s", animationDelay: "0.4s", opacity: 0.55 },
  { id: 11, width: "3px", height: "3px", top: "92%", left: "48%", animationDuration: "3.3s", animationDelay: "1.7s", opacity: 0.8 },
  { id: 12, width: "2px", height: "2px", top: "8%", left: "82%", animationDuration: "3.9s", animationDelay: "0.9s", opacity: 0.6 },
  { id: 13, width: "4px", height: "4px", top: "28%", left: "28%", animationDuration: "4.4s", animationDelay: "0.1s", opacity: 0.85 },
  { id: 14, width: "2px", height: "2px", top: "65%", left: "5%", animationDuration: "2.7s", animationDelay: "1.3s", opacity: 0.7 },
  { id: 15, width: "3px", height: "3px", top: "82%", left: "90%", animationDuration: "3.7s", animationDelay: "0.6s", opacity: 0.75 },
  { id: 16, width: "2px", height: "2px", top: "5%", left: "30%", animationDuration: "4.3s", animationDelay: "1.6s", opacity: 0.5 },
  { id: 17, width: "3px", height: "3px", top: "95%", left: "25%", animationDuration: "3.1s", animationDelay: "0.2s", opacity: 0.85 },
  { id: 18, width: "2px", height: "2px", top: "38%", left: "60%", animationDuration: "3.4s", animationDelay: "1.0s", opacity: 0.65 },
  { id: 19, width: "3px", height: "3px", top: "75%", left: "52%", animationDuration: "4.6s", animationDelay: "0.5s", opacity: 0.7 },
];

export const GameBoard: React.FC<GameBoardProps> = ({
  socket,
  room,
  currentPlayerId,
  myRole,
  policeId,
  allRoles,
  messages,
  cardsState,
  myPrivateRole,
  onPoliceReveal,
  onMakeGuess,
  onSendMessage,
  onLeaveRoom,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);
  const [currentPlayerName, setCurrentPlayerName] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [speakingPlayers, setSpeakingPlayers] = useState<Set<string>>(new Set());

  const heartbeatAudioRef = React.useRef<HTMLAudioElement>(null);
  const policeSirenAudioRef = React.useRef<HTMLAudioElement>(null);

  // Real-time socket listener for player speaking updates
  useEffect(() => {
    if (!socket) return;

    const onSpeakingUpdate = ({ playerId, isSpeaking }: { playerId: string; isSpeaking: boolean }) => {
      setSpeakingPlayers((prev) => {
        const next = new Set(prev);
        if (isSpeaking) {
          next.add(playerId);
        } else {
          next.delete(playerId);
        }
        return next;
      });
    };

    socket.on("player-speaking-update", onSpeakingUpdate);
    return () => {
      socket.off("player-speaking-update", onSpeakingUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (room.gameState === "guessing" && room.guessingEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((room.guessingEndTime! - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (policeSirenAudioRef.current) {
          policeSirenAudioRef.current.volume = 0.3;
          policeSirenAudioRef.current.play().catch((e) => console.log("Audio autoplay prevented", e));
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        if (heartbeatAudioRef.current) {
          heartbeatAudioRef.current.pause();
          heartbeatAudioRef.current.currentTime = 0;
        }
        if (policeSirenAudioRef.current) {
          policeSirenAudioRef.current.pause();
          policeSirenAudioRef.current.currentTime = 0;
        }
      };
    } else {
      if (heartbeatAudioRef.current) {
        heartbeatAudioRef.current.pause();
        heartbeatAudioRef.current.currentTime = 0;
      }
      if (policeSirenAudioRef.current) {
        policeSirenAudioRef.current.pause();
        policeSirenAudioRef.current.currentTime = 0;
      }
    }
  }, [room.gameState, room.guessingEndTime]);

  useEffect(() => {
    if (!showChat) {
      setUnreadMsgs(messages.length - lastReadMessageCount);
    }
  }, [messages.length, showChat, lastReadMessageCount]);

  // Track chat messages to animate speaking equalizer dots
  useEffect(() => {
    if (messages.length > 0) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg?.playerId) {
        setSpeakingPlayers((prev) => new Set([...prev, latestMsg.playerId]));
        const timer = setTimeout(() => {
          setSpeakingPlayers((prev) => {
            const next = new Set(prev);
            next.delete(latestMsg.playerId);
            return next;
          });
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length]);

  // Periodic speaking animations during guessing phase to keep UI lively
  useEffect(() => {
    if (room.gameState === "guessing") {
      const interval = setInterval(() => {
        const randomPlayerIndex = Math.floor(Math.random() * room.players.length);
        const speakingId = room.players[randomPlayerIndex]?.id;
        if (speakingId) {
          setSpeakingPlayers((prev) => new Set([...prev, speakingId]));
          setTimeout(() => {
            setSpeakingPlayers((prev) => {
              const next = new Set(prev);
              next.delete(speakingId);
              return next;
            });
          }, 2500);
        }
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [room.gameState, room.players]);

  const handleShowChat = () => {
    setShowChat(true);
    setUnreadMsgs(0);
    setLastReadMessageCount(messages.length);
  };

  useEffect(() => {
    setCurrentPlayerName(
      room.players.find((player) => player.id === currentPlayerId)?.name ?? ""
    );
  }, [currentPlayerId, room.players]);

  const isPolice = myRole === "Police";
  const canMakeGuess = room.gameState === "guessing" && currentPlayerId === policeId;

  const getPlayerRole = (playerId: string) => {
    if (playerId === currentPlayerId) return myRole;
    if (allRoles) {
      const player = allRoles.find((p) => p.id === playerId);
      return player?.role;
    }
    return null;
  };

  if (room.gameState === "classic-card-selection") {
    return (
      <div
        className="relative min-h-screen bg-[#0A041A] bg-cover bg-center bg-no-repeat p-4 text-white font-sans flex items-center justify-center"
        style={{ backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')" }}
      >
        {/* Dark Royal Vignette & Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A021A]/70 via-transparent to-[#0A021A]/85 pointer-events-none" />
        <ClassicCardSelection
          socket={socket}
          roomCode={room.id}
          currentPlayerId={currentPlayerId}
          currentRound={room.currentRound}
          totalRounds={room.totalRounds}
          winCondition={room.winCondition}
          targetScore={room.targetScore}
          players={room.players}
          cardsState={cardsState}
          myPrivateRole={myPrivateRole}
          onSelectCard={(cardId) => {
            if (socket) {
              socket.emit("classic:selectCard", {
                roomCode: room.id,
                playerId: currentPlayerId,
                cardId,
              });
            }
          }}
          onLeaveRoom={onLeaveRoom}
        />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-[#0A041A] bg-cover bg-center bg-no-repeat p-4 overflow-y-auto overflow-x-hidden text-white font-sans sm:flex sm:flex-col sm:items-center sm:justify-center"
      style={{ backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')" }}
    >
      {/* Dark Royal Vignette & Shadow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A021A]/70 via-transparent to-[#0A021A]/85 pointer-events-none" />
      {/* Background Particles/Stars - Static positions to prevent shaking */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {GAME_BOARD_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: p.width,
              height: p.height,
              top: p.top,
              left: p.left,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {room.gameState === "guessing" && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-red-glow opacity-50"></div>
      )}

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        {/* Top Header Banner */}
        <div className="bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] shadow-[0_0_40px_rgba(147,51,234,0.3)] border border-[#3A1C61] p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide">
              Hi {currentPlayerName}, Welcome to {room.name}
            </h1>

            <div className="flex items-center space-x-3 sm:space-x-4">
              {room.gameState === "guessing" && (
                <div
                  className={`flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-full border ${
                    timeLeft <= 10 ? "border-red-400" : "border-red-200"
                  } shadow-sm`}
                >
                  <Heart
                    className={`w-5 h-5 text-red-500 ${
                      timeLeft <= 10 ? "animate-ping" : "animate-pulse"
                    }`}
                  />
                  <span
                    className={`font-bold ${
                      timeLeft <= 10 ? "text-red-600 animate-pulse" : "text-red-500"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
              )}
              <button
                onClick={handleShowChat}
                className="p-2.5 text-fuchsia-400 hover:text-white transition-colors relative bg-[#11052C] border border-[#3A1C61] rounded-full drop-shadow-md cursor-pointer"
                title="Open Chat"
              >
                <MessageCircle className="w-6 h-6" />
                {unreadMsgs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center border border-[#1D0C3A]">
                    {unreadMsgs > 9 ? "9+" : unreadMsgs}
                  </span>
                )}
              </button>

              {onLeaveRoom && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to leave this game room?")) {
                      onLeaveRoom();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-300 bg-red-950/80 hover:bg-red-900 border border-red-500/40 rounded-full shadow-md transition-colors cursor-pointer"
                  title="Leave Room"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Leave Room</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between text-xs sm:text-sm text-gray-400 font-sans tracking-wide">
            <span>
              {room.winCondition === "target_score" ? (
                <>
                  Round <strong className="text-yellow-400">{room.currentRound}</strong> • Target:{" "}
                  <strong className="text-yellow-400">{(room.targetScore || 5000).toLocaleString()} pts</strong>
                </>
              ) : (
                <>
                  Round <strong className="text-yellow-400">{room.currentRound}</strong> of{" "}
                  <strong className="text-yellow-400">{room.totalRounds}</strong>
                </>
              )}
            </span>
            <span>
              State:{" "}
              <strong className="text-fuchsia-400 capitalize">{room.gameState}</strong>
            </span>
          </div>
        </div>

        {/* 4 Player Hero Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {room.players.map((player) => {
            const playerRole = getPlayerRole(player.id);
            const isRoleRevealed = Boolean(
              playerRole &&
                (player.id === currentPlayerId ||
                  (room.gameState === "police-reveal" && player.id === policeId) ||
                  (room.gameState === "guessing" && player.id === policeId) ||
                  room.gameState === "results" ||
                  room.gameState === "finished")
            );

            const canClick =
              canMakeGuess && playerRole && playerRole !== "Police" && player.id !== policeId;
            const isPlayerSpeaking = Boolean(
              player.isSpeaking || speakingPlayers.has(player.id)
            );

            if (isRoleRevealed && playerRole) {
              const roleKey = playerRole.toLowerCase();
              const videoSrc = ROLE_VIDEOS[roleKey] || "/assets/raja.mp4";
              const styleInfo = ROLE_CONFIGS[roleKey] || ROLE_CONFIGS["raja"];

              return (
                <div
                  key={player.id}
                  className={`relative h-64 sm:h-72 w-full rounded-3xl overflow-hidden border-2 ${
                    styleInfo.borderStyle
                  } transition-all duration-300 transform ${
                    canClick ? "cursor-pointer hover:scale-105" : ""
                  }`}
                  onClick={canClick ? () => onMakeGuess(player.id) : undefined}
                >
                  {/* Looping Muted Role Video */}
                  <video
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls={false}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />

                  {/* Gradient Dark Overlay for Crisp Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/50 pointer-events-none" />

                  {/* Top Role Badge */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className={`px-4 py-1 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest ${styleInfo.badgeStyle}`}
                    >
                      {styleInfo.title}
                    </span>
                  </div>

                  {/* Reveal Police Action directly on Police role card */}
                  {room.gameState === "police-reveal" && player.id === currentPlayerId && playerRole === "Police" && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-slate-950/75 backdrop-blur-[3px] animate-fade-in text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPoliceReveal();
                        }}
                        className="relative group w-full max-w-[200px] cursor-pointer animate-bounce"
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 rounded-xl blur opacity-80 group-hover:opacity-100 transition duration-200"></div>
                        <div className="relative px-4 py-3 bg-[#0C1938] border-2 border-cyan-400 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-2xl tracking-wider hover:scale-105 transition-transform">
                          <Shield className="w-5 h-5 text-cyan-300 animate-pulse" />
                          I AM POLICE
                        </div>
                      </button>
                      <p className="text-[11px] font-bold text-cyan-200 mt-3 max-w-[180px] drop-shadow-md">
                        Tap button to reveal yourself and start catching the thief
                      </p>
                    </div>
                  )}

                  {/* Bottom Player Name */}
                  <div className="absolute bottom-3 left-0 right-0 z-10 text-center px-2">
                    <p className="font-black text-white text-base sm:text-lg tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {player.name}
                    </p>
                  </div>

                  {/* Bottom Cyan Neon Bevel Notch Tab */}
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 rounded-b-md shadow-[0_0_12px_rgba(34,211,238,0.9)] border-b-2 border-cyan-300" />
                </div>
              );
            }

            // Unrevealed Card (Matching Screenshot 2)
            return (
              <div
                key={player.id}
                className={`relative h-64 sm:h-72 w-full bg-[#0B031E] border-2 border-purple-500/40 hover:border-cyan-400/60 rounded-3xl shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:shadow-[0_0_35px_rgba(34,211,238,0.4)] transition-all duration-300 overflow-hidden flex flex-col items-center justify-between p-4 sm:p-5 select-none ${
                  canClick
                    ? "cursor-pointer hover:scale-105 border-fuchsia-400 shadow-[0_0_35px_rgba(217,70,239,0.5)]"
                    : ""
                }`}
                onClick={canClick ? () => onMakeGuess(player.id) : undefined}
              >
                {/* Sci-Fi Contour Tech Background */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-[#0B031E] to-[#04010B] opacity-80" />

                {/* Center 3D Neon Question Mark & Pedestal */}
                <div className="relative my-auto flex flex-col items-center justify-center z-10">
                  {/* 3D Neon Question Mark */}
                  <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-300 via-fuchsia-400 to-purple-500 drop-shadow-[0_0_25px_rgba(236,72,153,0.9)] select-none">
                    ?
                  </span>

                  {/* Concentric Neon Pedestal Aura */}
                  <div className="w-20 sm:w-24 h-6 -mt-3 rounded-full border border-fuchsia-400/60 bg-fuchsia-500/10 shadow-[0_0_25px_rgba(236,72,153,0.6)] transform -rotate-12" />
                </div>

                {/* Bottom Container: Speaking Dots Equalizer + Username */}
                <div className="relative z-10 w-full text-center flex flex-col items-center gap-1.5 pb-2">
                  {/* Speaking Dots Equalizer (. . . . .) */}
                  <div className="flex items-center justify-center space-x-1.5 h-4">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isPlayerSpeaking
                            ? "bg-[#F06292] shadow-[0_0_10px_#F06292] scale-125 animate-bounce"
                            : "bg-fuchsia-400/50 shadow-[0_0_5px_rgba(236,72,153,0.3)] opacity-60"
                        }`}
                        style={{
                          animationDelay: `${i * 0.12}s`,
                          animationDuration: "0.6s",
                        }}
                      />
                    ))}
                  </div>

                  {/* Username */}
                  <p className="font-black text-white text-base sm:text-lg tracking-wide drop-shadow-md">
                    {player.name}
                  </p>
                </div>

                {/* Bottom Cyan Neon Bevel Notch Tab */}
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 rounded-b-md shadow-[0_0_12px_rgba(34,211,238,0.9)] border-b-2 border-cyan-300" />
              </div>
            );
          })}
        </div>

        {/* Game Actions */}
        <div className="bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] shadow-[0_0_40px_rgba(147,51,234,0.3)] border border-[#3A1C61] p-6 mb-6">
          {room.gameState === "police-reveal" && (
            <div className="text-center p-4 bg-[#11052C] rounded-xl border border-blue-900/50 shadow-inner">
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2 drop-shadow-md" />
              <p className="text-blue-200 font-medium tracking-wide">
                {isPolice
                  ? "Click the button on your card above to reveal your Police role!"
                  : "Waiting for Police to reveal themselves..."}
              </p>
            </div>
          )}

          {room.gameState === "guessing" && (
            <div className="text-center p-4 bg-[#11052C] rounded-xl border border-yellow-900/50 shadow-inner">
              <Shield className="w-8 h-8 text-yellow-500 mx-auto mb-2 drop-shadow-md" />
              <p className="text-yellow-300 font-medium tracking-wide">
                {policeId === currentPlayerId
                  ? "Click on a player card to make your guess!"
                  : `Waiting for ${
                      room.players.find((p) => p.id === policeId)?.name
                    } to make their guess...`}
              </p>
            </div>
          )}

          {room.gameState === "role-assignment" && (
            <div className="text-center p-4 bg-[#11052C] rounded-xl border border-[#3A1C61] shadow-inner">
              <div className="animate-pulse">
                <p className="text-gray-300 tracking-wide font-medium">Assigning roles...</p>
              </div>
            </div>
          )}

          {room.gameState === "waiting" && (
            <div className="text-center p-4 bg-[#11052C] rounded-xl border border-fuchsia-900/50 shadow-inner flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400 mx-auto mb-3"></div>
              <p className="text-fuchsia-300 tracking-wide font-medium">Waiting for game to start...</p>
            </div>
          )}
        </div>
      </div>

      {showChat && (
        <Chat
          messages={messages}
          currentPlayerId={currentPlayerId}
          onSendMessage={onSendMessage}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Heartbeat and Siren audio */}
      <audio
        ref={heartbeatAudioRef}
        loop
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Heartbeat.ogg"
      />
      <audio
        ref={policeSirenAudioRef}
        loop
        src="https://actions.google.com/sounds/v1/alarms/police_siren.ogg"
      />
    </div>
  );
};

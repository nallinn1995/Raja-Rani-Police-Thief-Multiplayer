import React, { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import { Sparkles, Shield, Crown, CheckCircle2, Lock, HelpCircle, LogOut } from "lucide-react";
import { Player } from "../types/game";
import { BabylonRoleCardScene } from "./classic/BabylonRoleCardScene";

interface CardState {
  id: string;
  selectedBy: string | null;
}

interface ClassicCardSelectionProps {
  socket?: Socket | null;
  roomCode: string;
  currentPlayerId: string;
  currentRound: number;
  totalRounds: number;
  winCondition?: string;
  targetScore?: number;
  players: Player[];
  cardsState?: CardState[];
  myPrivateRole?: { cardId: string; role: string } | null;
  onSelectCard: (cardId: string) => void;
  onLeaveRoom?: () => void;
}

const ROLE_INFO: Record<
  string,
  { title: string; subtitle: string; description: string; colorClass: string; borderClass: string; videoSrc: string }
> = {
  Raja: {
    title: "RAJA",
    subtitle: "The King of the Kingdom",
    description: "Find the Rani.",
    colorClass: "from-amber-400 via-yellow-400 to-amber-500 text-amber-950",
    borderClass: "border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]",
    videoSrc: "/assets/raja.mp4",
  },
  Rani: {
    title: "RANI",
    subtitle: "The Queen of the Kingdom",
    description: "Find the Raja.",
    colorClass: "from-pink-400 via-fuchsia-400 to-pink-500 text-white",
    borderClass: "border-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.6)]",
    videoSrc: "/assets/rani.mp4",
  },
  Police: {
    title: "POLICE",
    subtitle: "The Kingdom's Investigator",
    description: "Observe carefully. Find the Thief.",
    colorClass: "from-blue-400 via-cyan-400 to-blue-500 text-white",
    borderClass: "border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)]",
    videoSrc: "/assets/police.mp4",
  },
  Thief: {
    title: "THIEF",
    subtitle: "The Secret Culprit",
    description: "Stay hidden.",
    colorClass: "from-emerald-400 via-teal-400 to-emerald-500 text-slate-950",
    borderClass: "border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)]",
    videoSrc: "/assets/thief.mp4",
  },
};

const DEFAULT_CARDS: CardState[] = [
  { id: "card-0", selectedBy: null },
  { id: "card-1", selectedBy: null },
  { id: "card-2", selectedBy: null },
  { id: "card-3", selectedBy: null },
];

export const ClassicCardSelection: React.FC<ClassicCardSelectionProps> = ({
  roomCode: _roomCode,
  currentPlayerId,
  currentRound,
  totalRounds,
  winCondition,
  targetScore,
  players,
  cardsState = DEFAULT_CARDS,
  myPrivateRole = null,
  onSelectCard,
  onLeaveRoom,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(myPrivateRole?.cardId || null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [showRoleReveal, setShowRoleReveal] = useState<boolean>(!!myPrivateRole);

  useEffect(() => {
    const allUnselected = cardsState.every((c) => c.selectedBy === null);

    if (myPrivateRole && myPrivateRole.cardId) {
      setSelectedCardId(myPrivateRole.cardId);
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setIsFlipping(false);
        setShowRoleReveal(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (!myPrivateRole || allUnselected) {
      setSelectedCardId(null);
      setIsFlipping(false);
      setShowRoleReveal(false);
    }
  }, [myPrivateRole, cardsState]);

  const handleCardClick = useCallback((cardId: string) => {
    // Prevent selecting if player already has a private role or if target card is taken
    if (myPrivateRole || showRoleReveal) return;
    const targetCard = cardsState.find((c) => c.id === cardId);
    if (targetCard && targetCard.selectedBy) return;

    setSelectedCardId(cardId);
    onSelectCard(cardId);
  }, [myPrivateRole, showRoleReveal, cardsState, onSelectCard]);

  // Find player who selected a given card
  const getSelectingPlayer = (cardId: string) => {
    const card = cardsState.find((c) => c.id === cardId);
    if (!card || !card.selectedBy) return null;
    return players.find((p) => p.id === card.selectedBy) || null;
  };

  const myRoleDetails = myPrivateRole ? ROLE_INFO[myPrivateRole.role] || null : null;
  const readyCount = cardsState.filter((c) => c.selectedBy !== null).length;

  const [use3D, setUse3D] = useState<boolean>(true);

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-between p-2 sm:p-6 text-white select-none">
      {onLeaveRoom && (
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to leave this game room?")) {
              onLeaveRoom();
            }
          }}
          className="absolute top-3 right-3 sm:top-6 sm:right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold transition-all shadow-lg cursor-pointer z-30"
          title="Exit Game Room"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave Room</span>
        </button>
      )}
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-2 mt-2">
        {/* Round Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#2A0944]/80 border border-[#FBE278]/40 shadow-[0_0_15px_rgba(251,226,120,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-[#FBE278] animate-pulse" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FBE278] font-serif">
            {winCondition === 'target_score'
              ? `Round ${currentRound} • Target: ${(targetScore || 5000).toLocaleString()} pts`
              : `Round ${currentRound} of ${totalRounds}`}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-[#FBE278] animate-pulse" />
        </div>

        {/* Title with Wing Flourishes */}
        <div className="flex items-center justify-center gap-3">
          <img src="/assets/images/Auth/title_decor.png" alt="" className="h-4 sm:h-5 object-contain" />
          <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-wider auth-gold-gradient-text drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            CHOOSE YOUR DESTINY
          </h1>
          <img src="/assets/images/Auth/title_decor.png" alt="" className="h-4 sm:h-5 object-contain scale-x-[-1]" />
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-base text-[#D8C7E0] font-medium max-w-md mx-auto">
          {showRoleReveal
            ? "Your private role is revealed for this round"
            : "Select one mysterious 3D card to reveal your secret role"}
        </p>
      </div>

      {/* 3D BABYLON CARD SCENE OR 2D FALLBACK GRID */}
      <div className="w-full my-3 sm:my-6 flex justify-center items-center">
        {use3D ? (
          <BabylonRoleCardScene
            cardsState={cardsState}
            players={players}
            currentPlayerId={currentPlayerId}
            myPrivateRole={myPrivateRole}
            onSelectCard={handleCardClick}
            onFallback={() => setUse3D(false)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl px-2">
            {cardsState.map((card, idx) => {
              const selectingPlayer = getSelectingPlayer(card.id);
              const isMyCard = card.id === selectedCardId || (myPrivateRole && myPrivateRole.cardId === card.id);
              const isTakenByOther = selectingPlayer && selectingPlayer.id !== currentPlayerId;
              const isLocked = isMyCard || isTakenByOther || !!selectedCardId;

              return (
                <div
                  key={card.id}
                  onClick={() => !isLocked && handleCardClick(card.id)}
                  className={`relative aspect-[3/4.2] rounded-2xl cursor-pointer transition-all duration-500 perspective-1000 ${
                    isLocked && !isMyCard ? "opacity-75 cursor-not-allowed scale-95" : ""
                  } ${
                    !isLocked ? "hover:-translate-y-3 hover:scale-105 hover:shadow-[0_0_35px_rgba(251,226,120,0.6)]" : ""
                  }`}
                >
                  <div
                    className={`w-full h-full duration-700 transition-transform transform-style-3d relative rounded-2xl ${
                      isMyCard && showRoleReveal ? "rotate-y-180" : isFlipping ? "rotate-y-180 animate-pulse" : ""
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isMyCard && (showRoleReveal || isFlipping) ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    <div
                      className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-b from-[#280B4D] via-[#12042A] to-[#280B4D] border-2 ${
                        isMyCard
                          ? "border-[#FBE278] shadow-[0_0_35px_rgba(251,226,120,0.8)]"
                          : isTakenByOther
                          ? "border-purple-500/50"
                          : "border-[#FBE278]/60 hover:border-[#FBE278]"
                      } p-3 flex flex-col items-center justify-between overflow-hidden shadow-2xl backface-hidden`}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="text-[#FBE278]/40 text-xs font-serif font-bold uppercase tracking-widest mt-1">
                        CARD {idx + 1}
                      </div>

                      <div className="relative flex flex-col items-center justify-center my-auto">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#3D0C6B] to-[#1E053B] border-2 border-[#FBE278]/50 flex items-center justify-center shadow-[0_0_25px_rgba(168,38,178,0.5)] group-hover:scale-110 transition-transform">
                          <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-[#FBE278] filter drop-shadow-[0_2px_8px_rgba(251,226,120,0.6)]" />
                        </div>
                        <span className="mt-2 text-[10px] sm:text-xs font-semibold text-[#D8C7E0] tracking-wide flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-[#FBE278]" /> Secret Destiny
                        </span>
                      </div>

                      <div className="w-full text-center">
                        {isMyCard ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FBE278] bg-[#3B1169] px-2.5 py-1 rounded-full border border-[#FBE278]/50">
                            <Sparkles className="w-3 h-3" /> YOUR CHOICE
                          </span>
                        ) : isTakenByOther ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-200 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/40">
                            <Lock className="w-2.5 h-2.5 text-purple-300" /> Selected
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-purple-300/80 group-hover:text-[#FBE278]">
                            Tap to Select
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-b from-[#2A0845] via-[#120324] to-[#2A0845] border-2 ${
                        myRoleDetails ? myRoleDetails.borderClass : "border-[#FBE278]"
                      } p-3 flex flex-col items-center justify-between overflow-hidden shadow-2xl backface-hidden`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#FBE278] font-serif text-center mt-1">
                        YOUR DESTINY IS REVEALED
                      </div>

                      {myRoleDetails && (
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#FBE278] shadow-[0_0_20px_rgba(251,226,120,0.5)] my-auto flex items-center justify-center bg-black">
                          <video
                            src={myRoleDetails.videoSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {myRoleDetails && (
                        <div className="text-center space-y-0.5">
                          <h2 className="text-lg sm:text-xl font-black font-serif tracking-wider text-amber-300">
                            {myRoleDetails.title}
                          </h2>
                          <p className="text-[10px] sm:text-xs font-semibold text-[#D8C7E0]">
                            {myRoleDetails.subtitle}
                          </p>
                          <p className="text-[10px] font-bold text-amber-400 italic">
                            "{myRoleDetails.description}"
                          </p>
                        </div>
                      )}

                      <div className="w-full text-center">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                          <Shield className="w-2.5 h-2.5" /> Secret to You
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PLAYER STATUS PANEL */}
      <div className="w-full max-w-2xl bg-[#1D0838]/90 border border-[#FBE278]/30 rounded-2xl p-3 sm:p-4 text-white shadow-xl backdrop-blur-md mb-2">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#3F1152]">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#FBE278]" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider font-serif text-[#FBE278]">
              PLAYER DESTINY STATUS
            </span>
          </div>
          <span className="text-xs font-extrabold text-amber-300 bg-[#350C5E] px-2.5 py-0.5 rounded-full border border-[#FBE278]/40">
            {readyCount} / {players.length} READY
          </span>
        </div>

        {/* Players List Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {players.map((p) => {
            const cardSelected = cardsState.find((c) => c.selectedBy === p.id);
            const isMe = p.id === currentPlayerId;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                  cardSelected
                    ? "bg-[#2E0B54]/90 border-emerald-500/50 text-white"
                    : "bg-[#14052B]/80 border-purple-900/60 text-gray-400"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      cardSelected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-400/50 animate-ping"
                    }`}
                  />
                  <span className={`font-semibold truncate ${isMe ? "text-[#FBE278]" : "text-gray-200"}`}>
                    {p.name} {isMe && "(You)"}
                  </span>
                </div>

                {cardSelected ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Locked
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-300/80 animate-pulse">
                    Choosing...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

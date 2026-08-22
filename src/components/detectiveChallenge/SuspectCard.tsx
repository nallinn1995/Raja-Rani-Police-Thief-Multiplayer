import React, { useState, useEffect } from "react";
import { SuspectCardData } from "../../types/detectiveChallenge";
import { CheckCircle2, ShieldQuestion, Briefcase } from "lucide-react";

interface SuspectCardProps {
  card: SuspectCardData;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (cardId: string) => void;
  isRevealed?: boolean;
  isActualThief?: boolean;
}

const GIF_MAP: Record<string, string> = {
  "Arjun Kumar": "/assets/college student.gif",
  "Ravi Prakash": "/assets/Barber.gif",
  "Karthik Vel": "/assets/Mechanic.gif",
  "Murugan Iyer": "/assets/Grocery Shop owner.gif",
  "Selvam Raj": "/assets/Tea Shop Owner.gif",
  "Naveen Sharma": "/assets/Office Employee.gif",
};

export const SuspectCard: React.FC<SuspectCardProps> = ({
  card,
  isSelected,
  isDisabled,
  onSelect,
  isRevealed = false,
  isActualThief = false,
}) => {
  const [speechIndex, setSpeechIndex] = useState<number>(0);

  // Speech bubble text shuffling every 20 seconds (20000ms)
  useEffect(() => {
    if (isDisabled) return;
    const bubbles = card.speechBubbles && card.speechBubbles.length > 0 ? card.speechBubbles : [card.speechBubble];
    const interval = setInterval(() => {
      setSpeechIndex((prev) => (prev + 1) % bubbles.length);
    }, 20000);

    return () => clearInterval(interval);
  }, [card.speechBubbles, card.speechBubble, isDisabled]);

  const activeSpeech =
    card.speechBubbles && card.speechBubbles.length > 0
      ? card.speechBubbles[speechIndex % card.speechBubbles.length]
      : card.speechBubble;

  const mediaSrc =
    card.gifName
      ? `/assets/${card.gifName}`
      : card.imageName
      ? `/assets/${card.imageName}`
      : GIF_MAP[card.name] || "/assets/college student.gif";

  const getAvatarGradient = (name: string) => {
    switch (name) {
      case "Arjun Kumar":
        return "from-cyan-600 via-blue-700 to-indigo-800 border-cyan-400";
      case "Ravi Prakash":
        return "from-amber-600 via-orange-700 to-red-800 border-amber-400";
      case "Karthik Vel":
        return "from-yellow-600 via-amber-700 to-orange-800 border-yellow-400";
      case "Murugan Iyer":
        return "from-emerald-600 via-teal-700 to-cyan-800 border-emerald-400";
      case "Selvam Raj":
        return "from-purple-600 via-indigo-700 to-blue-800 border-purple-400";
      case "Naveen Sharma":
        return "from-pink-600 via-rose-700 to-purple-800 border-pink-400";
      default:
        return "from-cyan-600 to-purple-800 border-cyan-400";
    }
  };

  return (
    <div
      onClick={() => !isDisabled && onSelect(card.cardId)}
      className={`relative group cursor-pointer transition-all duration-300 transform ${
        isDisabled ? "cursor-not-allowed opacity-90" : "hover:-translate-y-2 hover:scale-[1.02]"
      }`}
    >
      {/* Dynamic Speech Bubble (Updates every 20 seconds) */}
      <div className="mb-3 relative mx-auto w-full max-w-[260px] h-[52px] flex items-center justify-center">
        <div className="w-full bg-[#11052C] border border-[#5A2C81] text-purple-200 px-3 py-2 rounded-2xl shadow-xl text-center text-xs font-semibold backdrop-blur-md relative animate-pulse-slow flex items-center justify-center transition-all duration-300">
          <span className="italic font-sans text-cyan-200 truncate line-clamp-2">
            "{activeSpeech}"
          </span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#5A2C81]" />
        </div>
      </div>

      {/* Suspect 3D Card Container */}
      <div
        className={`relative rounded-3xl p-5 border-2 transition-all duration-300 backdrop-blur-xl ${
          isRevealed
            ? isActualThief
              ? "bg-rose-950/90 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.6)]"
              : "bg-[#11052C]/60 border-[#3A1C61] opacity-60"
            : isSelected
            ? "bg-gradient-to-b from-[#3A1054] to-[#1D0C3A] border-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.5)] scale-[1.03]"
            : "bg-[#1D0C3A]/95 border-[#3A1C61] hover:border-cyan-500/70 hover:shadow-[0_0_25px_rgba(147,51,234,0.4)]"
        }`}
      >
        {/* Selection Indicator Badge */}
        {isSelected && !isRevealed && (
          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 animate-pulse z-10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SELECTED</span>
          </div>
        )}

        {/* Thief Reveal Badge */}
        {isRevealed && isActualThief && (
          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg animate-bounce z-10">
            🚨 ACTUAL THIEF!
          </div>
        )}

        {/* Character Avatar Container with Animated GIF */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br ${getAvatarGradient(
              card.name
            )} p-1 shadow-2xl relative mb-3 group-hover:scale-105 transition-transform duration-300 overflow-hidden`}
          >
            <div className="w-full h-full rounded-2xl bg-[#0A0217] flex items-center justify-center overflow-hidden relative group">
              {/* Character Animated GIF */}
              <img
                src={mediaSrc}
                alt={card.name}
                className="w-full h-full object-cover object-top rounded-2xl transform transition-transform duration-700 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Shimmer Scan Effect Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-pulse" />

              {/* Expression Tag */}
              <span className="absolute bottom-1 right-1 text-[10px] bg-[#11052C]/90 px-2 py-0.5 rounded-full border border-[#5A2C81] text-cyan-300 font-bold capitalize shadow">
                {card.expression || "suspect"}
              </span>
            </div>
          </div>

          {/* Character Name & Occupation */}
          <h3 className="text-base sm:text-lg font-black text-white tracking-wide group-hover:text-cyan-300 transition-colors">
            {card.name}
          </h3>

          {card.occupation && (
            <p className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1 mt-0.5">
              <Briefcase className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{card.occupation}</span>
            </p>
          )}

          {card.personality && (
            <p className="text-[11px] text-purple-300 italic mt-0.5 line-clamp-1">
              "{card.personality}"
            </p>
          )}

          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1.5 flex items-center gap-1">
            <ShieldQuestion className="w-3 h-3 text-cyan-400" />
            <span>Suspect #{card.cardId.replace("card-", "")}</span>
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-[#3A1C61]">
          <button
            disabled={isDisabled}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl ${
              isSelected
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-cyan-400/40"
                : "bg-gradient-to-r from-[#7B1FA2] to-[#4A148C] hover:from-cyan-500 hover:to-blue-600 border border-[#9C27B0]/50 text-white"
            }`}
          >
            {isSelected ? "Suspect Selected" : "Accuse Suspect"}
          </button>
        </div>
      </div>
    </div>
  );
};

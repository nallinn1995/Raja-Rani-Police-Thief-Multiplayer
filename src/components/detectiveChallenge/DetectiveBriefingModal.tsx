import React, { useEffect } from "react";
import { Search, ShieldAlert, CheckSquare, Square, Zap, Award, Target, Flame, Play } from "lucide-react";

export interface CrimeStory {
  caseNumber: string;
  title: string;
  location: string;
  description: string;
}

interface DetectiveBriefingModalProps {
  crimeStory: CrimeStory;
  readyCount: number;
  totalPlayers: number;
  isReady: boolean;
  isHost: boolean;
  allReady: boolean;
  onToggleReady: (ready: boolean) => void;
  onStartHunting: () => void;
}

export const DetectiveBriefingModal: React.FC<DetectiveBriefingModalProps> = ({
  crimeStory,
  readyCount,
  totalPlayers,
  isReady,
  isHost,
  allReady,
  onToggleReady,
  onStartHunting,
}) => {
  // Prevent ESC key from closing modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-2xl bg-[#1D0C3A] border-2 border-[#5A2C81] rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(147,51,234,0.4)] text-white relative animate-fade-in space-y-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="text-center space-y-2 relative">
          <div className="inline-flex items-center space-x-2 bg-[#11052C] border border-cyan-400/50 px-4 py-1.5 rounded-full text-xs font-black text-cyan-300 uppercase tracking-widest shadow-inner">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Detective Challenge Briefing</span>
          </div>

          <h1
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide"
            style={{ filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.8))" }}
          >
            Classified Case File
          </h1>

          <p className="text-xs text-purple-300 font-semibold max-w-md mx-auto">
            Review the case details below and confirm readiness to begin the investigation.
          </p>
        </div>

        {/* Crime Case Story Card */}
        <div className="bg-[#11052C] border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between border-b border-[#3A1C61] pb-2">
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>{crimeStory?.caseNumber || "CASE FILE #409"}</span>
            </span>
            <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/40">
              {crimeStory?.location || "Grand Central Vaults"}
            </span>
          </div>

          <h3 className="text-lg font-black text-white">{crimeStory?.title || "The Phantom Sapphire Heist"}</h3>
          <p className="text-xs text-purple-200 leading-relaxed font-sans italic">
            "{crimeStory?.description || "At 02:00 AM, the priceless Royal Star Sapphire vanished from the vault. 3 suspects were seen fleeing near the rear exits."}"
          </p>
        </div>

        {/* Gameplay Rules & Equal Roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Rules & Equal Roles Notice */}
          <div className="bg-[#11052C] border border-[#5A2C81] rounded-2xl p-4 space-y-2">
            <h4 className="font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Equal Roles Notice</span>
            </h4>
            <p className="text-purple-200 leading-relaxed">
              In this round, <strong className="text-cyan-300">ALL 4 players are Detectives</strong>! There are no hidden Raja, Rani, Police, or Thief roles among you.
            </p>
            <p className="text-purple-300 text-[11px]">
              Examine the 3 suspects and their changing speech bubbles to identify the actual Secret Thief!
            </p>
          </div>

          {/* How Results Are Calculated */}
          <div className="bg-[#11052C] border border-[#5A2C81] rounded-2xl p-4 space-y-2">
            <h4 className="font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>How Results Are Calculated</span>
            </h4>
            <ul className="space-y-1 text-purple-200 font-medium">
              <li className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>1. Accusation Accuracy %</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>2. Total Correct Guesses</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>3. Decision Speed (Seconds)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>4. Win Streak Bonus</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Readiness Checkbox & Status */}
        <div className="bg-[#11052C] border border-cyan-500/40 rounded-2xl p-4 space-y-4 text-center">
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => onToggleReady(!isReady)}
              className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border-2 font-black text-sm transition-all transform hover:scale-[1.02] shadow-lg ${
                isReady
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-emerald-500/30"
                  : "bg-[#1D0C3A] border-purple-500/50 hover:border-cyan-400 text-purple-200 hover:text-white"
              }`}
            >
              {isReady ? (
                <CheckSquare className="w-5 h-5 text-emerald-300 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-purple-400 shrink-0" />
              )}
              <span className="tracking-wide">I am ready to catch the Suspect</span>
            </button>
          </div>

          {/* Readiness Tracker Bar */}
          <div className="space-y-1.5 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-purple-300 uppercase tracking-wider">Detectives Readiness</span>
              <span className={readyCount === totalPlayers ? "text-emerald-400" : "text-cyan-300"}>
                {readyCount} / {totalPlayers} Ready
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#1D0C3A] border border-[#3A1C61] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (readyCount / (totalPlayers || 4)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="pt-2 text-center">
          {isHost ? (
            <button
              disabled={!allReady}
              onClick={onStartHunting}
              className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-xl flex items-center justify-center space-x-2 ${
                allReady
                  ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-slate-950 shadow-cyan-400/40 hover:scale-[1.02] animate-pulse"
                  : "bg-purple-900/30 text-purple-400 border border-purple-800/40 cursor-not-allowed opacity-60"
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{allReady ? "Start Hunting..." : "Waiting for all players to check ready..."}</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-[#11052C] border border-[#3A1C61] text-xs text-purple-300 font-semibold italic">
              {allReady
                ? "All Detectives are ready! Waiting for room host to click 'Start Hunting'..."
                : `Waiting for all Detectives to check ready (${readyCount} / ${totalPlayers} ready)...`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

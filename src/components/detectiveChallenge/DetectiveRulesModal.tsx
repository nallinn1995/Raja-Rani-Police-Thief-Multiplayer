import React, { useState } from "react";
import { Play, Users, ChevronLeft, ChevronRight, X, Shield, Bomb, Clock, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DetectiveRulesModalProps {
  isHost: boolean;
  readyCount: number;
  totalPlayers: number;
  isReady: boolean;
  allReady: boolean;
  onToggleReady: (ready: boolean) => void;
  onStartGame: () => void;
}

const RULE_STEPS = [
  {
    id: 1,
    emoji: "🚪",
    icon: Shield,
    title: "STEP 1: The Chamber of 10 Doors",
    subtitle: "Dynamic 5x2 Mystery Grid",
    description: "Before you stands a grand chamber of 10 ancient wooden mystery doors arranged in a dynamic 5x2 matrix (2x5 on mobile).",
    detail: "Exactly 1 door conceals the escaped Mastermind Thief! Detectives investigate simultaneously in real-time to capture the Thief.",
    color: "from-cyan-950/95 via-blue-950/95 to-[#080214]/95",
    borderColor: "border-cyan-500/50",
    badge: "10 Doors Matrix",
  },
  {
    id: 2,
    emoji: "🛡️",
    icon: Shield,
    title: "STEP 2: 4 Safe Doors & Points",
    subtitle: "Investigation Points & Clear Paths",
    description: "4 of the 10 doors are completely Safe (+100 PTS each). Safe doors clear sectors and eliminate false trails.",
    detail: "Safe doors never deduct lives! Discovering safe doors narrows down where the Thief is hiding.",
    color: "from-emerald-950/95 via-teal-950/95 to-slate-950/95",
    borderColor: "border-emerald-500/50",
    badge: "4 Safe Doors",
  },
  {
    id: 3,
    emoji: "💣",
    icon: Bomb,
    title: "STEP 3: 3 Trapped Bombs",
    subtitle: "High Explosive Danger",
    description: "Beware! 3 of the doors are trapped with time bombs rigged by the cunning Thief.",
    detail: "Opening a bomb detonates an explosion and permanently costs 1 of your 3 lives. Triggering 3 bombs eliminates you!",
    color: "from-red-950/95 via-rose-950/95 to-purple-950/95",
    borderColor: "border-red-500/50",
    badge: "3 Bomb Doors",
  },
  {
    id: 4,
    emoji: "🔍",
    icon: Shield,
    title: "STEP 4: Secret Clue & Extra Life Doors",
    subtitle: "Riddles & Vitality Recovery",
    description: "1 door conceals a Secret Clue riddle revealing the Thief's row or column. 1 door holds an Extra Life (+1 heart) to restore lost health!",
    detail: "The Clue riddle is pinned to your HUD banner. Extra Life doors (+150 PTS) allow you to withstand an additional bomb blast!",
    color: "from-purple-950/95 via-indigo-950/95 to-[#12072B]/95",
    borderColor: "border-purple-500/50",
    badge: "1 Clue • 1 Life Door",
  },
  {
    id: 5,
    emoji: "⏱️",
    icon: Clock,
    title: "STEP 5: 3 Lives & 60s Countdown",
    subtitle: "Authoritative Race Against Time",
    description: "Every detective begins with 3 Lives (Hearts) and a strictly synchronized 60-second countdown timer.",
    detail: "If you lose all lives or time runs out before locating the Thief, you are ELIMINATED from the round!",
    color: "from-amber-950/95 via-orange-950/95 to-[#12072B]/95",
    borderColor: "border-amber-500/50",
    badge: "60s Timer • 3 Lives",
  },
  {
    id: 6,
    emoji: "🏆",
    icon: Trophy,
    title: "STEP 6: Scoring & Leaderboard Champion",
    subtitle: "Speed, Lives & Accuracy",
    description: "The detective who discovers the Thief door first secures the Grand Thief Catch (+1000 PTS)!",
    detail: "Final scores reflect catch speed, remaining hearts (+300 pts per life), safe sectors uncovered, and clues obtained.",
    color: "from-yellow-950/95 via-amber-950/95 to-[#0A0217]/95",
    borderColor: "border-yellow-400/50",
    badge: "Victory & Ranks",
  },
];

export const DetectiveRulesModal: React.FC<DetectiveRulesModalProps> = ({
  isHost,
  readyCount,
  totalPlayers = 2,
  isReady,
  allReady,
  onToggleReady,
  onStartGame,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasConfirmed, setHasConfirmed] = useState(isReady);

  React.useEffect(() => {
    setHasConfirmed(isReady);
  }, [isReady]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasConfirmed(checked);
    onToggleReady(checked);
  };

  const nextSlide = () => {
    if (currentSlide < RULE_STEPS.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const activeStep = RULE_STEPS[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#080214]/90 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a0833]/95 via-[#0c041c]/95 to-[#05010a]/95 backdrop-blur-xl overflow-y-auto text-white font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-300 animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDuration: Math.random() * 3 + 2 + "s",
              animationDelay: Math.random() * 2 + "s",
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#160830] to-[#0d041c] border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-7 shadow-[0_0_50px_rgba(34,211,238,0.2)] flex flex-col justify-between max-h-[92vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-purple-900/60 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl sm:text-3xl">📜</span>
            <div>
              <h2 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 bg-clip-text text-transparent uppercase tracking-wider">
                The Door of Mystery Rules
              </h2>
              <p className="text-[11px] sm:text-xs text-cyan-300/80 font-semibold">
                10 Doors • 1 Thief • 4 Safe • 3 Bombs • 1 Clue • 1 Life • 3 Lives
              </p>
            </div>
          </div>
        </div>

        {/* Carousel Content Card */}
        <div className="relative min-h-[220px] sm:min-h-[260px] flex items-center mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.22 }}
              className={`w-full p-4 sm:p-6 rounded-2xl bg-gradient-to-br ${activeStep.color} border ${activeStep.borderColor} shadow-xl flex flex-col justify-between relative overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {activeStep.emoji}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-cyan-200">
                      {activeStep.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">
                      {activeStep.title}
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-400">
                  {currentSlide + 1} / {RULE_STEPS.length}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans mb-3">
                {activeStep.description}
              </p>

              <div className="p-2.5 sm:p-3 bg-black/40 border border-white/10 rounded-xl text-[11px] sm:text-xs text-yellow-300/90 leading-relaxed font-sans">
                💡 <strong className="text-yellow-200">Key Rule: </strong>
                {activeStep.detail}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Pagination & Navigation Controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="px-3 py-1.5 rounded-xl bg-[#1D0C3A] hover:bg-[#2F145C] disabled:opacity-40 disabled:hover:bg-[#1D0C3A] border border-purple-700/50 text-xs font-bold transition flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-1.5">
            {RULE_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide
                    ? "w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    : "w-2 bg-purple-700/60 hover:bg-purple-500"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === RULE_STEPS.length - 1}
            className="px-3 py-1.5 rounded-xl bg-[#1D0C3A] hover:bg-[#2F145C] disabled:opacity-40 disabled:hover:bg-[#1D0C3A] border border-purple-700/50 text-xs font-bold transition flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Ready Checkbox & Host Control Footer */}
        <div className="pt-3 border-t border-purple-900/60 flex flex-col gap-3">
          {/* Checkbox Section */}
          <label className="flex items-center space-x-3 p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl cursor-pointer hover:bg-purple-950/70 transition">
            <input
              type="checkbox"
              checked={hasConfirmed}
              onChange={handleCheckboxChange}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded border-purple-400 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-gray-900 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              I have read and understood The Door of Mystery rules.
            </span>
          </label>

          {/* Status and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Ready Counter Pill */}
            <div className="flex items-center space-x-2 text-xs text-purple-300">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>
                Detectives Ready:{" "}
                <strong className={allReady ? "text-emerald-400 font-bold" : "text-yellow-400 font-bold"}>
                  {readyCount} / {totalPlayers}
                </strong>
              </span>
              {allReady ? (
                <span className="text-emerald-400 text-xs font-bold">✓ All Ready!</span>
              ) : (
                <span className="text-amber-400/80 text-[11px] font-medium">(Waiting for all {totalPlayers})</span>
              )}
            </div>

            {/* Host Start Button OR Non-Host Waiting Message */}
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!allReady}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg ${
                  allReady
                    ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-yellow-500/30 scale-105 cursor-pointer ring-2 ring-yellow-400 animate-pulse"
                    : "bg-gray-800/90 text-gray-400 border border-gray-700 cursor-not-allowed opacity-60"
                }`}
                title={allReady ? "Start the investigation!" : `Waiting for all ${totalPlayers} detectives to check the rules box`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{allReady ? "Start Investigation" : `Start Investigation (${readyCount}/${totalPlayers} Ready)`}</span>
              </button>
            ) : (
              <div className="text-xs text-center text-cyan-300/90 font-medium bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-800/40">
                {allReady
                  ? "✓ All detectives ready! Waiting for Host to start investigation..."
                  : hasConfirmed
                  ? "✓ You confirmed! Waiting for other detectives to confirm..."
                  : "Please check the box above when you are ready."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

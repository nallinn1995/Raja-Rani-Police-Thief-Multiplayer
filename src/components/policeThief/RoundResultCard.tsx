import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Shield, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import { RoundResult } from "../../types/game";
import { playCardShuffleSound } from "../../utils/soundUtils";
import { PerformanceBadge } from "./PerformanceBadge";
import { Timeline } from "./Timeline";

interface RoundResultCardProps {
  result: RoundResult;
  isHost?: boolean;
  onNextRound?: () => void;
}

export const RoundResultCard: React.FC<RoundResultCardProps> = ({ result, isHost, onNextRound }) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (result.isCorrect) {
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#eab308"],
      });
      const successAudio = new Audio("https://actions.google.com/sounds/v1/cartoon/cling_1.ogg");
      successAudio.volume = 0.6;
      successAudio.play().catch(() => {});
    } else {
      const wrongAudio = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
      wrongAudio.volume = 0.6;
      wrongAudio.play().catch(() => {});
    }
  }, [result.isCorrect]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const guessTime = result.guessTime || 0;
  const isFastCatch = result.isCorrect && guessTime > 0 && guessTime <= 5;

  return (
    <div
      className={`min-h-screen text-white font-sans transition-all duration-500 bg-[#090314] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#24084c] via-[#090314] to-[#04010a] flex items-center justify-center p-4 relative overflow-hidden ${
        result.isCorrect ? "animate-flash-green" : "animate-flash-red"
      }`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      <div
        className={`relative z-10 max-w-lg w-full bg-[#1A0C3B]/95 backdrop-blur-2xl rounded-3xl border border-[#3A1C61] p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.25)] space-y-6 ${
          !result.isCorrect ? "animate-shake" : ""
        }`}
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-purple-900/50 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="font-extrabold text-blue-300 text-sm tracking-wide uppercase">
              Police vs Thief • Round {result.currentRound} of {result.totalRounds}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11052C] border border-purple-800 text-xs font-bold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Next: {countdown}s</span>
          </div>
        </div>

        {/* Status Indicator Banner */}
        <div className="text-center space-y-2">
          {result.isCorrect ? (
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          ) : (
            <XCircle className="w-16 h-16 text-rose-500 mx-auto animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
          )}

          <h2
            className={`text-2xl sm:text-3xl font-black tracking-wide ${
              result.isCorrect ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]"
            }`}
          >
            {result.isCorrect ? "DETECTIVE CAUGHT THE THIEF!" : "THIEF ESCAPED DETECTIVE!"}
          </h2>

          <div className="flex items-center justify-center gap-2 pt-1">
            {isFastCatch && <PerformanceBadge type="quick_catch" label={`Fast Catch (${guessTime}s)`} />}
            {result.isCorrect && <PerformanceBadge type="perfect_accuracy" label="Correct Identification" />}
            {!result.isCorrect && <PerformanceBadge type="ghost_thief" label="Successful Thief Escape" />}
          </div>
        </div>

        {/* Round Details Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-[#11052C] rounded-2xl border border-rose-900/60 shadow-inner text-center">
            <span className="text-xs text-rose-300 font-semibold block mb-1">Actual Thief</span>
            <span className="text-xl font-black text-rose-400 tracking-wide drop-shadow-md">
              {result.thief?.name || "Unknown"}
            </span>
          </div>

          <div className="p-4 bg-[#11052C] rounded-2xl border border-blue-900/60 shadow-inner text-center">
            <span className="text-xs text-blue-300 font-semibold block mb-1">Police Guess</span>
            <span className="text-xl font-black text-blue-400 tracking-wide drop-shadow-md">
              {result.guessedPlayer?.name || "Nobody"}
            </span>
          </div>
        </div>

        {/* Guess Time Metrics */}
        {guessTime > 0 && (
          <div className="p-3 bg-[#11052C] rounded-xl border border-purple-900/40 flex items-center justify-between text-xs">
            <span className="text-purple-300 font-medium">Detective Decision Time</span>
            <span className="font-extrabold text-amber-300 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-400 inline" />
              {guessTime} seconds
            </span>
          </div>
        )}

        {/* Round Log Timeline */}
        {result.roundSummaries && result.roundSummaries.length > 0 && (
          <div className="pt-2 border-t border-purple-900/40">
            <Timeline roundSummaries={result.roundSummaries} />
          </div>
        )}

        {/* Action Button */}
        <div className="text-center pt-2">
          {result.currentRound >= result.totalRounds ? (
            <div className="animate-pulse text-amber-300 font-bold text-sm tracking-wide">
              Finalizing match rankings & awards...
            </div>
          ) : isHost ? (
            <button
              onClick={() => {
                playCardShuffleSound();
                if (onNextRound) onNextRound();
              }}
              className="w-full relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-200" />
              <div className="relative w-full bg-[#11052C] border border-blue-500/50 text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:scale-105 shadow-xl flex items-center justify-center space-x-2 cursor-pointer">
                <span className="tracking-wide text-base">Proceed to Next Round</span>
                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ) : (
            <div className="animate-pulse text-purple-300 font-semibold text-sm tracking-wide">
              Waiting for room host to start round {result.currentRound + 1}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

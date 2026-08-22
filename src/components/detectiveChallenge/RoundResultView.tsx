import React from "react";
import { DetectiveRoundResult } from "../../types/detectiveChallenge";
import { DetectiveBadge } from "./DetectiveBadge";
import { Timer, Award, ArrowRight, Zap, CheckCircle2, XCircle } from "lucide-react";

interface RoundResultViewProps {
  result: DetectiveRoundResult;
  onNextRound: () => void;
  isHost: boolean;
  roundTimerSeconds?: number;
}

export const RoundResultView: React.FC<RoundResultViewProps> = ({
  result,
  onNextRound,
  isHost,
}) => {
  const actualThiefCard = result.cards.find((c) => c.cardId === result.actualThiefCardId);

  return (
    <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto text-white font-sans">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
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

      <div className="w-full max-w-4xl space-y-6 relative z-10 my-4">
        {/* Round Header Banner */}
        <div className="bg-[#1D0C3A]/95 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_0_40px_rgba(147,51,234,0.3)] text-center relative overflow-hidden">
          <div className="inline-flex items-center space-x-2 bg-[#11052C] border border-[#5A2C81] px-4 py-1.5 rounded-full text-xs font-extrabold text-cyan-300 uppercase tracking-widest mb-3 shadow-inner">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Round {result.roundNumber} of {result.totalRounds} Outcome</span>
          </div>

          <h1
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide"
            style={{ filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.8))" }}
          >
            Investigation Reveal
          </h1>

          {/* Actual Thief Reveal Spotlight */}
          <div className="mt-6 bg-[#11052C] border border-rose-500/50 rounded-2xl p-4 max-w-md mx-auto flex items-center space-x-4 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-600 to-red-800 p-0.5 shrink-0 shadow-lg">
              <div className="w-full h-full rounded-lg bg-[#0A0217] flex items-center justify-center text-3xl">
                🦹
              </div>
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                Actual Thief Revealed
              </span>
              <h3 className="text-lg font-black text-white">{actualThiefCard?.name || result.actualThiefName || "Unknown Thief"}</h3>
              <p className="text-xs text-purple-300 italic mt-0.5">"{actualThiefCard?.speechBubble}"</p>
            </div>
          </div>
        </div>

        {/* Round Performance Leaderboard (No Cumulative Points) */}
        <div className="bg-[#1D0C3A]/95 border border-[#3A1C61] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[#3A1C61] pb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-200 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Round Decision Speed & Accuracy</span>
            </h2>
            <span className="text-xs text-purple-300 font-semibold">
              Round Performance Only
            </span>
          </div>

          <div className="space-y-3">
            {result.players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  player.rank === 1
                    ? "bg-gradient-to-r from-[#3A1054] via-[#1D0C3A] to-[#11052C] border-amber-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                    : player.isCorrect
                    ? "bg-[#11052C] border-emerald-500/30 text-white"
                    : "bg-[#11052C]/60 border-[#3A1C61] opacity-90"
                }`}
              >
                {/* Rank & Player Info */}
                <div className="flex items-center space-x-3.5 w-full sm:w-auto">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                      player.rank === 1
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-950"
                        : player.rank === 2
                        ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                        : player.rank === 3
                        ? "bg-gradient-to-br from-green-400 to-green-600 text-white"
                        : "bg-[#11052C] text-purple-300 border border-[#3A1C61]"
                    }`}
                  >
                    #{player.rank}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#11052C] border border-[#5A2C81] flex items-center justify-center text-xl shrink-0">
                      {player.avatar === "1" ? "🤵" : player.avatar === "2" ? "🕵️" : "🎭"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                        <span>{player.name}</span>
                        {player.isCorrect ? (
                          <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/30">
                            <XCircle className="w-3 h-3 mr-1" /> Wrong
                          </span>
                        )}
                      </h4>
                      <div className="mt-1 flex items-center space-x-2">
                        <DetectiveBadge badge={player.badge} icon={player.badgeIcon} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats & Speed Badge */}
                <div className="flex items-center justify-between sm:justify-end space-x-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#3A1C61]">
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Decision Speed</span>
                    <span className="text-sm font-black text-cyan-300 flex items-center justify-end gap-1">
                      <Timer className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{player.guessTime.toFixed(2)}s</span>
                    </span>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Accuracy</span>
                    <span className="text-sm font-black text-emerald-300">{player.accuracy}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-4 flex justify-end">
            {isHost ? (
              <button
                onClick={onNextRound}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#7B1FA2] to-[#4A148C] hover:from-cyan-500 hover:to-blue-600 border border-[#9C27B0]/50 text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
              >
                <span>Next Investigation Round</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs text-purple-300 italic text-center w-full py-2">
                Waiting for host to start next round...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

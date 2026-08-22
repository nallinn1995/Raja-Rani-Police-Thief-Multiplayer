import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { DetectiveMatchResult } from "../../types/detectiveChallenge";
import { Award, RotateCcw, Home, Crown } from "lucide-react";
import { XpBreakdownCard } from "../common/XpBreakdownCard";

interface FinalMatchViewProps {
  result: DetectiveMatchResult;
  onPlayAgain?: () => void;
  onHome?: () => void;
}

export const FinalMatchView: React.FC<FinalMatchViewProps> = ({
  result,
  onPlayAgain,
  onHome,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  }, []);

  const champion = result.champion || result.leaderboard[0];

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
        {/* Champion Spotlight Card */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-[#1D0C3A]/95 backdrop-blur-xl border border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center overflow-hidden">
          <div className="inline-flex items-center space-x-2 bg-[#11052C] border border-amber-400/50 px-4 py-1.5 rounded-full text-xs font-black text-amber-300 uppercase tracking-widest mb-4 shadow-inner">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Detective Champion</span>
          </div>

          {/* Champion Avatar */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 p-1.5 mx-auto mb-4 shadow-2xl relative">
            <div className="w-full h-full rounded-2xl bg-[#0A0217] flex items-center justify-center p-3">
              <img src="/assets/images/trophy.png" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" alt="Detective Champion Trophy" />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-0.5 rounded-full shadow-md uppercase tracking-wider">
              #1 Champion
            </div>
          </div>

          <h1
            className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide"
            style={{ filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.8))" }}
          >
            {champion?.name || "Supreme Detective"}
          </h1>
          <p className="text-sm font-bold text-amber-300 mt-1">
            {champion?.title || "Master Detective"}
          </p>

          {/* Champion Stats Bar */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mt-6 p-4 rounded-2xl bg-[#11052C] border border-amber-500/30 shadow-md">
            <div>
              <span className="text-[10px] font-bold text-amber-400/80 uppercase block">Accuracy</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{champion?.accuracy || 0}%</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400/80 uppercase block">Correct Guesses</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300">{champion?.correctCount || 0}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400/80 uppercase block">Avg Speed</span>
              <span className="text-xl sm:text-2xl font-black text-yellow-300">{(champion?.avgGuessTime || 0).toFixed(2)}s</span>
            </div>
          </div>
        </div>

        {/* XP Breakdown Card & Level Up Announcement */}
        <XpBreakdownCard matchXP={(result as any).matchXP} levelUpInfo={(result as any).levelUpInfo} />

        {/* Match Awards Grid */}
        <div className="space-y-3">
          <h3 className="text-lg font-extrabold text-amber-300 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Investigation Performance Awards</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(result.awards || []).map((award, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#1D0C3A]/95 border border-[#3A1C61] text-center shadow-lg hover:border-cyan-500/50 transition-all"
              >
                <div className="text-3xl mb-2">{award.icon}</div>
                <h4 className="font-black text-xs text-purple-200 uppercase tracking-wide">{award.title}</h4>
                <p className="font-black text-sm text-cyan-300 mt-1">{award.player}</p>
                <span className="text-[10px] text-purple-400 font-semibold block mt-0.5">{award.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final Rankings Table */}
        <div className="bg-[#1D0C3A]/95 border border-[#3A1C61] rounded-3xl p-5 sm:p-7 shadow-[0_0_40px_rgba(147,51,234,0.3)] space-y-4 backdrop-blur-xl">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2 border-b border-[#3A1C61] pb-3">
            <img src="/assets/images/trophy.png" className="w-5 h-5 object-contain" alt="Trophy" />
            <span>Final Detective Match Standings</span>
          </h3>

          <div className="space-y-3">
            {result.leaderboard.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  player.isChampion
                    ? "bg-gradient-to-r from-[#3A1054] via-[#1D0C3A] to-[#11052C] border-amber-500/60 shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                    : "bg-[#11052C] border-[#3A1C61]"
                }`}
              >
                <div className="flex items-center space-x-3.5 w-full sm:w-auto">
                  {player.rank <= 3 ? (
                    <img
                      src={`/assets/images/rank${player.rank}.png`}
                      alt={`Rank ${player.rank}`}
                      className="w-9 h-9 object-contain shrink-0 drop-shadow-md"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md bg-[#11052C] text-purple-300 border border-[#3A1C61]">
                      #{player.rank}
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                      <span>{player.name}</span>
                      {player.isChampion && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-400/40">
                          Champion
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-purple-300">
                      Correct: <strong className="text-emerald-400">{player.correctCount}</strong> | Wrong: <strong className="text-rose-400">{player.wrongCount}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#3A1C61]">
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Accuracy</span>
                    <span className="text-base font-black text-emerald-300">{player.accuracy}%</span>
                  </div>
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Avg Speed</span>
                    <span className="text-base font-black text-cyan-300">{player.avgGuessTime.toFixed(2)}s</span>
                  </div>
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Max Streak</span>
                    <span className="text-base font-black text-amber-300">{player.longestStreak}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
            {onHome && (
              <button
                onClick={onHome}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#11052C] hover:bg-[#2A1154] text-purple-200 border border-[#5A2C81] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            )}
            {onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#7B1FA2] to-[#4A148C] hover:from-cyan-500 hover:to-blue-600 border border-[#9C27B0]/50 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Detective Challenge Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from "react";
import {
  Shield,
  Target,
  XCircle,
  TrendingUp,
  Award,
  Zap,
  RotateCcw,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Star,
  Activity,
  Flame
} from "lucide-react";
import confetti from "canvas-confetti";
import { Player, RoundSummaryLog } from "../types/game";
import { getAvatarSrc } from "../utils/avatarUtils";

interface PoliceThiefResultDashboardProps {
  leaderboard: Player[];
  roundSummaries?: RoundSummaryLog[];
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const PoliceThiefResultDashboard: React.FC<PoliceThiefResultDashboardProps> = ({
  leaderboard,
  roundSummaries = [],
  onPlayAgain,
  onBackToHome,
}) => {
  useEffect(() => {
    // Confetti burst on load for victorious champion
    confetti({
      particleCount: 160,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#3b82f6", "#eab308", "#a855f7", "#10b981"],
    });

    const victoryAudio = new Audio("https://actions.google.com/sounds/v1/cartoon/cling_1.ogg");
    victoryAudio.volume = 0.5;
    victoryAudio.play().catch(() => {});
  }, []);

  const winner = leaderboard[0];

  // Calculate Performance Panel Highlights
  const mostAccuratePlayer = [...leaderboard].sort(
    (a, b) => (b.accuracy || 0) - (a.accuracy || 0)
  )[0];

  const mostEscapesPlayer = [...leaderboard].sort(
    (a, b) => (b.thiefEscaped || 0) - (a.thiefEscaped || 0)
  )[0];

  const fastestCatchPlayer = [...leaderboard]
    .filter((p) => (p.fastestCatch || 0) > 0)
    .sort((a, b) => (a.fastestCatch || 999) - (b.fastestCatch || 999))[0];

  return (
    <div className="min-h-screen text-white font-sans bg-[#090314] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#24084c] via-[#090314] to-[#04010a] flex items-center justify-center p-3 sm:p-6 relative overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Background Particles/Glow Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-400 animate-pulse"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDuration: Math.random() * 3 + 2 + "s",
              animationDelay: Math.random() * 2 + "s",
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl w-full my-6 space-y-6">
        {/* Header Title Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Police vs Thief • Final Championship</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-blue-300 via-amber-200 to-purple-300 bg-clip-text text-transparent tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            MATCH RESULTS
          </h1>
        </div>

        {/* 1. TOP WINNER CARD (AAA Mobile Style Champion Display) */}
        {winner && (
          <div className="relative p-[2px] rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_50px_rgba(234,179,8,0.35)] animate-fade-in">
            <div className="bg-gradient-to-b from-[#210c44] via-[#14062c] to-[#0d031e] rounded-[calc(1.5rem-2px)] p-6 sm:p-8 relative overflow-hidden text-center flex flex-col items-center">
              
              {/* Champion Badge */}
              <div className="inline-flex items-center space-x-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg mb-4 transform hover:scale-105 transition-transform">
                <img src="/assets/images/trophy.png" className="w-4 h-4 object-contain" alt="Trophy" />
                <span>🥇 DETECTIVE CHAMPION</span>
              </div>

              {/* Avatar & Glow */}
              <div className="relative mb-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-purple-600 p-[3px] shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                  <div className="w-full h-full rounded-full bg-[#12052b] flex items-center justify-center overflow-hidden border-2 border-amber-300">
                    <img
                      src={getAvatarSrc(winner.avatar)}
                      alt={winner.name}
                      className="w-full h-full object-cover"
                    />
                    <User className="w-12 h-12 text-amber-300" />
                  </div>
                </div>

                {/* MVP Tag */}
                <div className="absolute -bottom-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full border border-blue-400/50 shadow-md">
                  MVP
                </div>
              </div>

              {/* Player Name & Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide drop-shadow-md">
                {winner.name}
              </h2>
              <span className="inline-block mt-1 px-3 py-1 bg-purple-900/60 border border-purple-500/40 rounded-full text-xs font-bold text-purple-200 tracking-wide">
                {winner.title || "Master Detective"}
              </span>

              {/* Winner Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 w-full max-w-2xl">
                <div className="p-3 bg-[#170836] border border-blue-500/30 rounded-2xl text-center">
                  <div className="flex items-center justify-center space-x-1 text-blue-400 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Correct</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white">{winner.correctCatches || 0}</span>
                </div>

                <div className="p-3 bg-[#170836] border border-rose-500/30 rounded-2xl text-center">
                  <div className="flex items-center justify-center space-x-1 text-rose-400 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Wrong</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white">{winner.wrongGuesses || 0}</span>
                </div>

                <div className="p-3 bg-[#170836] border border-emerald-500/30 rounded-2xl text-center">
                  <div className="flex items-center justify-center space-x-1 text-emerald-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Accuracy</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-emerald-300">{winner.accuracy || 0}%</span>
                </div>

                <div className="p-3 bg-[#170836] border border-purple-500/30 rounded-2xl text-center">
                  <div className="flex items-center justify-center space-x-1 text-purple-400 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Police Turns</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white">{winner.policeTurnsCompleted || 0}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. LEADERBOARD CARDS (NO POINTS DISPLAYED - ICONS ONLY) */}
        <div className="space-y-3">
          <h3 className="text-lg font-black text-slate-200 flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Detective Standings</span>
          </h3>

          <div className="space-y-3">
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              const isTop = rank === 1;

              return (
                <div
                  key={player.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isTop
                      ? "bg-gradient-to-r from-[#2a134a] via-[#1d0a36] to-[#120427] border-amber-400/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                      : "bg-[#14062e]/90 border-purple-900/40 hover:border-purple-600/50"
                  }`}
                >
                  {/* Left Section: Rank, Avatar, Name & Title */}
                  <div className="flex items-center space-x-3.5 w-full sm:w-auto">
                    {/* Rank Badge */}
                    {rank <= 3 ? (
                      <img
                        src={`/assets/images/rank${rank}.png`}
                        alt={`Rank ${rank}`}
                        className="w-9 h-9 object-contain flex-shrink-0 drop-shadow-md"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl flex flex-shrink-0 items-center justify-center font-black text-sm shadow-md bg-purple-950 border border-purple-800 text-purple-300">
                        #{rank}
                      </div>
                    )}

                    {/* Avatar & Online Dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-purple-900/60 border border-purple-400/40 flex items-center justify-center overflow-hidden">
                        <img
                          src={getAvatarSrc(player.avatar)}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                        <User className="w-6 h-6 text-purple-300" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#14062e] rounded-full shadow-sm" title="Online" />
                    </div>

                    {/* Name & Title */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className={`font-bold text-base ${isTop ? 'text-amber-300' : 'text-slate-100'}`}>
                          {player.name}
                        </p>
                        {isTop && (
                          <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black rounded-full uppercase">
                            Winner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-purple-300/80 font-medium">
                        {player.title || "Recruit Detective"} • <span className="text-slate-400">Last: {player.role || 'Player'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Section: Stats Icons (NO POINTS) */}
                  <div className="flex items-center space-x-3 sm:space-x-4 text-xs font-bold w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-purple-900/40">
                    <div className="text-center px-2 py-1 bg-[#0d0320] border border-blue-500/20 rounded-xl" title="Correct Catches">
                      <span className="block text-[10px] text-blue-400 uppercase font-semibold">🎯 Correct</span>
                      <span className="text-slate-100 text-sm font-black">{player.correctCatches || 0}</span>
                    </div>

                    <div className="text-center px-2 py-1 bg-[#0d0320] border border-rose-500/20 rounded-xl" title="Wrong Guesses">
                      <span className="block text-[10px] text-rose-400 uppercase font-semibold">❌ Wrong</span>
                      <span className="text-slate-100 text-sm font-black">{player.wrongGuesses || 0}</span>
                    </div>

                    <div className="text-center px-2 py-1 bg-[#0d0320] border border-emerald-500/20 rounded-xl" title="Accuracy %">
                      <span className="block text-[10px] text-emerald-400 uppercase font-semibold">📈 Accuracy</span>
                      <span className="text-emerald-300 text-sm font-black">{player.accuracy || 0}%</span>
                    </div>

                    <div className="text-center px-2 py-1 bg-[#0d0320] border border-amber-500/20 rounded-xl" title="Detective Wins">
                      <span className="block text-[10px] text-amber-400 uppercase font-semibold">🏆 Wins</span>
                      <span className="text-amber-300 text-sm font-black">{player.detectiveScore || 0}</span>
                    </div>

                    <div className="text-center px-2 py-1 bg-[#0d0320] border border-purple-500/20 rounded-xl" title="Police Turns">
                      <span className="block text-[10px] text-purple-400 uppercase font-semibold">👮 Turns</span>
                      <span className="text-slate-100 text-sm font-black">{player.policeTurnsCompleted || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. PLAYER PERFORMANCE PANEL (Bottom Match Highlights) */}
        <div className="p-6 rounded-3xl bg-[#14062e]/90 border border-purple-900/60 backdrop-blur-xl space-y-4">
          <h3 className="text-base font-black text-amber-300 flex items-center space-x-2 uppercase tracking-wide">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Match Performance Panel</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Most Accurate */}
            <div className="p-3.5 bg-[#0e0422] border border-emerald-500/30 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Most Accurate Detective</span>
                <p className="font-bold text-slate-100 text-sm">{mostAccuratePlayer?.name || 'N/A'}</p>
                <span className="text-emerald-400 font-bold">{mostAccuratePlayer?.accuracy || 0}% Accuracy</span>
              </div>
            </div>

            {/* Most Escapes */}
            <div className="p-3.5 bg-[#0e0422] border border-cyan-500/30 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Most Escapes</span>
                <p className="font-bold text-slate-100 text-sm">{mostEscapesPlayer?.name || 'N/A'}</p>
                <span className="text-cyan-300 font-bold">{mostEscapesPlayer?.thiefEscaped || 0} Escapes</span>
              </div>
            </div>

            {/* Fastest Catch */}
            <div className="p-3.5 bg-[#0e0422] border border-yellow-500/30 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Fastest Correct Catch</span>
                <p className="font-bold text-slate-100 text-sm">{fastestCatchPlayer?.name || 'N/A'}</p>
                <span className="text-yellow-300 font-bold">{fastestCatchPlayer?.fastestCatch ? `${fastestCatchPlayer.fastestCatch}s` : 'N/A'}</span>
              </div>
            </div>

            {/* Longest Detective Streak */}
            <div className="p-3.5 bg-[#0e0422] border border-purple-500/30 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Longest Detective Streak</span>
                <p className="font-bold text-slate-100 text-sm">{winner?.name || 'N/A'}</p>
                <span className="text-purple-300 font-bold">{winner?.correctCatches || 0} Consecutive</span>
              </div>
            </div>

            {/* Longest Escape Streak */}
            <div className="p-3.5 bg-[#0e0422] border border-indigo-500/30 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Longest Escape Streak</span>
                <p className="font-bold text-slate-100 text-sm">{mostEscapesPlayer?.name || 'N/A'}</p>
                <span className="text-indigo-300 font-bold">{mostEscapesPlayer?.thiefEscaped || 0} Streak</span>
              </div>
            </div>

            {/* Match MVP */}
            <div className="p-3.5 bg-[#0e0422] border border-amber-500/30 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Match MVP</span>
                <p className="font-bold text-amber-300 text-sm">{winner?.name || 'N/A'}</p>
                <span className="text-amber-400 font-bold">{winner?.title || 'Master Detective'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. ROUND SUMMARY LOG TABLE */}
        {roundSummaries.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#14062e]/90 border border-purple-900/60 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-black text-slate-200 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Round-by-Round Summary</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-purple-800/40 text-purple-300 text-[11px] font-bold uppercase">
                    <th className="py-2.5 px-3">Round</th>
                    <th className="py-2.5 px-3">Police</th>
                    <th className="py-2.5 px-3">Actual Thief</th>
                    <th className="py-2.5 px-3">Police Selected</th>
                    <th className="py-2.5 px-3">Result</th>
                    <th className="py-2.5 px-3 text-right">Time Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30">
                  {roundSummaries.map((round) => (
                    <tr key={round.roundNumber} className="hover:bg-purple-950/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-100">Round {round.roundNumber}</td>
                      <td className="py-3 px-3 font-medium text-blue-300">{round.policeName}</td>
                      <td className="py-3 px-3 font-medium text-emerald-300">{round.actualThief}</td>
                      <td className="py-3 px-3 font-medium text-slate-200">{round.policeSelected}</td>
                      <td className="py-3 px-3">
                        {round.isCorrect ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Correct Catch</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>Wrong Guess</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-400">
                        {round.guessTime}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-purple-600/30 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onBackToHome}
            className="w-full py-4 px-6 rounded-2xl bg-[#0f0424] hover:bg-[#1b083b] border border-purple-800/60 text-slate-200 hover:text-white font-bold text-base shadow-lg transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

      </div>
    </div>
  );
};

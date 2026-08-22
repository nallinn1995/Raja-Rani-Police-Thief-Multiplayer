import React from 'react';
import { motion } from 'framer-motion';
import { Award, ArrowLeft, Sparkles } from 'lucide-react';
import { ModernRoundResultData } from '../../types/modernMode';

interface ModernLeaderboardProps {
  resultData: ModernRoundResultData;
  onReturnHome: () => void;
}

export const ModernLeaderboard: React.FC<ModernLeaderboardProps> = ({
  resultData,
  onReturnHome,
}) => {
  const { scores, winner, currentRound } = resultData;

  // Determine total number of rounds played (e.g. 1 to 10)
  const maxRoundsPlayed = Math.max(
    currentRound || 1,
    ...scores.map((p) => (p.roundHistory ? p.roundHistory.length : 1))
  );

  const roundsArray = Array.from({ length: maxRoundsPlayed }, (_, i) => i + 1);

  const getRankBadge = (rank?: number) => {
    if (rank === 1) return { label: '#1 👑', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/60' };
    if (rank === 2) return { label: '#2 🥈', color: 'bg-slate-400/20 text-slate-200 border-slate-400/60' };
    if (rank === 3) return { label: '#3 🥉', color: 'bg-amber-700/20 text-amber-300 border-amber-600/60' };
    return { label: `#${rank || '-'}`, color: 'bg-purple-900/40 text-purple-300 border-purple-700/40' };
  };

  return (
    <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex flex-col items-center justify-center p-4 text-white font-sans py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-[#1A0B2E]/95 backdrop-blur-xl border-2 border-yellow-500/50 rounded-3xl p-4 sm:p-8 shadow-[0_0_80px_rgba(234,179,8,0.4)] text-center relative my-6"
      >
        {/* Top Trophy & Champion Banner */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-4 border-yellow-300 flex items-center justify-center p-2 shadow-[0_0_50px_rgba(250,204,21,0.7)] mb-4 animate-bounce">
            <img src="/assets/images/trophy.png" className="w-full h-full object-contain drop-shadow-md" alt="Kingdom Trophy" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2">
            <img src="/assets/images/trophy.png" className="w-4 h-4 object-contain" alt="Trophy" />
            Kingdom Champion Spotlight
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-300 to-yellow-500 title-font tracking-wide">
            {winner.name}
          </h1>
          <p className="text-gray-300 text-sm mt-1 font-sans flex items-center gap-1.5 justify-center">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Crowned Champion with{' '}
            <span className="text-yellow-400 font-mono font-black text-base">{winner.score} pts</span>!
          </p>
        </div>

        {/* Standings Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 text-left title-font tracking-wide flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Final Standings & Round Breakdown
          </h2>
          <span className="text-xs text-purple-300 bg-purple-900/60 px-3 py-1 rounded-full border border-purple-700/50 font-mono">
            {maxRoundsPlayed} {maxRoundsPlayed === 1 ? 'Round' : 'Rounds'} Played
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-purple-800/50 mb-8 shadow-inner">
          <table className="w-full text-left text-sm font-sans min-w-[700px]">
            <thead className="bg-purple-950/90 text-xs text-purple-300 uppercase tracking-wider font-semibold border-b border-purple-800/60">
              <tr>
                <th className="p-3.5 text-center w-16">Rank</th>
                <th className="p-3.5 min-w-[140px]">Player</th>
                {roundsArray.map((r) => (
                  <th key={r} className="p-3.5 text-center min-w-[65px] font-mono text-amber-300">
                    R{r}
                  </th>
                ))}
                <th className="p-3.5 text-center min-w-[80px]">Bonus</th>
                <th className="p-3.5 text-center min-w-[100px]">Final Score</th>
                <th className="p-3.5 min-w-[160px]">Match Rewards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-800/40">
              {scores.map((p) => {
                const rankInfo = getRankBadge(p.rank);
                const totalBonus = p.totalBonusPoints ?? p.bonusPoints ?? 0;

                return (
                  <tr
                    key={p.playerId}
                    className={
                      p.rank === 1
                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20 font-bold transition'
                        : 'bg-purple-950/40 hover:bg-purple-900/40 transition'
                    }
                  >
                    {/* Rank Badge */}
                    <td className="p-3.5 text-center">
                      {p.rank && p.rank <= 3 ? (
                        <img
                          src={`/assets/images/rank${p.rank}.png`}
                          alt={`Rank ${p.rank}`}
                          className="w-8 h-8 object-contain mx-auto drop-shadow-md"
                        />
                      ) : (
                        <span className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${rankInfo.color}`}>
                          {rankInfo.label}
                        </span>
                      )}
                    </td>

                    {/* Player Name */}
                    <td className="p-3.5 font-bold text-white text-base">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {p.rank === 1 && <span className="text-yellow-400 text-sm">👑</span>}
                      </div>
                    </td>

                    {/* Round Breakdown Cells */}
                    {roundsArray.map((r) => {
                      const roundData = p.roundHistory?.find((h) => h.round === r);
                      const roundPts = roundData ? roundData.roundScore : (r === 1 ? p.finalScore - totalBonus : null);

                      return (
                        <td key={r} className="p-3.5 text-center font-mono">
                          {roundPts !== null && roundPts !== undefined ? (
                            <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 text-xs font-semibold border border-purple-700/40">
                              {roundPts}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Bonus */}
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                      +{totalBonus}
                    </td>

                    {/* Final Score */}
                    <td className="p-3.5 text-center font-mono font-black text-yellow-300 text-base">
                      {p.finalScore}
                    </td>

                    {/* Match Rewards */}
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {p.awards && p.awards.length > 0 ? (
                          p.awards.map((award, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-bold tracking-wide"
                            >
                              {award}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="sm:hidden flex flex-col gap-3 mb-8 text-left">
          {scores.map((p) => {
            const rankInfo = getRankBadge(p.rank);
            const totalBonus = p.totalBonusPoints ?? p.bonusPoints ?? 0;

            return (
              <div
                key={p.playerId}
                className={`p-4 rounded-2xl border transition ${
                  p.rank === 1
                    ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                    : 'bg-purple-950/60 border-purple-800/60'
                }`}
              >
                {/* Top Row: Rank, Player Name, Final Score */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {p.rank && p.rank <= 3 ? (
                      <img
                        src={`/assets/images/rank${p.rank}.png`}
                        alt={`Rank ${p.rank}`}
                        className="w-7 h-7 object-contain drop-shadow-md"
                      />
                    ) : (
                      <span className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-bold ${rankInfo.color}`}>
                        {rankInfo.label}
                      </span>
                    )}
                    <span className="font-bold text-white text-base">{p.name}</span>
                  </div>
                  <div className="text-right font-mono font-black text-yellow-300 text-lg">
                    {p.finalScore} <span className="text-xs text-purple-300 font-sans font-normal">pts</span>
                  </div>
                </div>

                {/* Round Breakdown Pills */}
                <div className="mt-2 pt-2 border-t border-purple-800/40 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-purple-300 font-medium mr-1">Rounds:</span>
                  {roundsArray.map((r) => {
                    const roundData = p.roundHistory?.find((h) => h.round === r);
                    const roundPts = roundData ? roundData.roundScore : (r === 1 ? p.finalScore - totalBonus : null);

                    return (
                      <span key={r} className="px-2 py-0.5 rounded-md bg-purple-900/80 text-purple-200 font-mono text-[11px] border border-purple-700/50">
                        R{r}: <span className="text-yellow-300 font-bold">{roundPts ?? '-'}</span>
                      </span>
                    );
                  })}
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 font-mono text-[11px] border border-emerald-700/50 ml-auto">
                    Bonus: +{totalBonus}
                  </span>
                </div>

                {/* Match Rewards */}
                {p.awards && p.awards.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {p.awards.map((award, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-bold"
                      >
                        {award}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <button
          onClick={onReturnHome}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base tracking-widest uppercase shadow-[0_0_25px_rgba(147,51,234,0.4)] transition flex items-center justify-center gap-2 cursor-pointer mx-auto active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>RETURN TO HOME</span>
        </button>
      </motion.div>
    </div>
  );
};

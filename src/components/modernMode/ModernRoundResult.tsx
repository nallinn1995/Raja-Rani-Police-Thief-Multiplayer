import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { ModernRoundResultData, ModernRole, MODERN_ROLES_CONFIG } from '../../types/modernMode';

interface ModernRoundResultProps {
  resultData: ModernRoundResultData;
  isHost: boolean;
  onNextRound: () => void;
  onViewLeaderboard: () => void;
}

export const ModernRoundResult: React.FC<ModernRoundResultProps> = ({
  resultData,
  isHost,
  onNextRound,
  onViewLeaderboard,
}) => {
  const {
    currentRound,
    totalRounds,
    winCondition,
    targetScore,
    isGameOver,
    rajaResult,
    raniResult,
    policeResult,
    villagerResult,
    mantriResult,
    thiefResult,
    scores,
    winner,
  } = resultData;

  return (
    <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex flex-col items-center justify-center p-4 text-white font-sans py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-[#1A0B2E]/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.4)] relative my-6"
      >
        {/* Round Badge Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/60 border border-yellow-500/40 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2">
            <img src="/assets/images/trophy.png" className="w-4 h-4 object-contain" alt="Trophy" />
            <span>
              Modern Mode • Round {currentRound || 1}{' '}
              {winCondition === 'target_score'
                ? `(Target: ${targetScore || 5000} pts)`
                : `of ${totalRounds || 3}`}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 title-font tracking-wide flex items-center justify-center gap-3">
            <img src="/assets/images/trophy.png" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" alt="Trophy" />
            <span>Round Winner: {winner.name} ({winner.role})</span>
          </h1>
          <p className="text-sm text-purple-300 mt-1 font-sans">
            Score Earned This Round: <span className="text-yellow-400 font-bold font-mono">{winner.score} pts</span>
          </p>
        </div>

        {/* Story / Timeline Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Mantri Shield Outcome */}
          <div className="p-4 rounded-2xl bg-purple-950/70 border border-indigo-500/40">
            <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-sm">
              <span>🏛️ Royal Protection Order</span>
            </div>
            {mantriResult.isShieldSuccessful ? (
              <div className="text-xs text-green-400 font-semibold flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>🛡️ Royal Protection Saved {mantriResult.protectedTargetName} ({mantriResult.protectedTargetRole})!</span>
                </div>
                <div className="text-[11px] text-gray-300">
                  Loot Prevented: <span className="text-emerald-300 font-bold">100 Pts</span> | Minister Bonus: <span className="text-yellow-300 font-bold">+100</span>
                </div>
              </div>
            ) : (mantriResult.protectedThief || mantriResult.protectedTargetRole === 'Thief') ? (
              <div className="text-xs text-rose-400 font-semibold flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>⚠️ Royal Protection Failed! Minister protected 🕵️ Thief!</span>
                </div>
                <div className="text-[11px] text-rose-300">
                  Thief gained <span className="text-rose-200 font-bold">+100 Extra Loot</span>! No Minister Bonus.
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-gray-500" />
                <span>Royal Shield wasn't issued or target wasn't attacked. No bonus.</span>
              </div>
            )}
          </div>

          {/* Thief Loot Outcome */}
          <div className="p-4 rounded-2xl bg-purple-950/70 border border-emerald-500/40">
            <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-sm">
              <span>🕵️ Thief Secret Loot</span>
            </div>
            <div className="text-xs text-purple-200">
              Thief {thiefResult.thiefName} looted{' '}
              <span className="text-emerald-400 font-bold font-mono">{thiefResult.stolenTotal} pts</span> from kingdom!
            </div>
          </div>

          {/* Raja Result */}
          <div className="p-4 rounded-2xl bg-purple-950/70 border border-amber-500/40">
            <div className="flex items-center gap-2 mb-2 text-yellow-300 font-bold text-sm">
              <span>👑 Raja Intuition</span>
            </div>
            {rajaResult.isCorrect ? (
              <div className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Found Queen {rajaResult.targetName}! (+100 Bonus)</span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Guessed incorrectly ({rajaResult.targetName || 'None'}). No bonus.</span>
              </div>
            )}
          </div>

          {/* Rani Result */}
          <div className="p-4 rounded-2xl bg-purple-950/70 border border-pink-500/40">
            <div className="flex items-center gap-2 mb-2 text-pink-300 font-bold text-sm">
              <span>👸 Rani Intuition</span>
            </div>
            {raniResult.isCorrect ? (
              <div className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Found King {raniResult.targetName}! (+100 Bonus)</span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Guessed incorrectly ({raniResult.targetName || 'None'}). No bonus.</span>
              </div>
            )}
          </div>

          {/* Police Result */}
          <div className="p-4 rounded-2xl bg-purple-950/70 border border-blue-500/40">
            <div className="flex items-center gap-2 mb-2 text-cyan-300 font-bold text-sm">
              <span>👮 Police Investigation</span>
            </div>
            {policeResult.isCorrect ? (
              <div className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>CAUGHT Thief {policeResult.thiefName}! (+500 + 100 Catch Bonus)</span>
              </div>
            ) : (
              <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>THIEF ESCAPED! Police score = 0 pts.</span>
              </div>
            )}
          </div>

          {/* Villager Result */}
          <div className="p-4 rounded-2xl bg-purple-950/70 border border-amber-600/40">
            <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold text-sm">
              <span>👨 Villager Witness</span>
            </div>
            {villagerResult.isBonusEarned ? (
              <div className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Selected {villagerResult.choice?.toUpperCase()} (+100 {villagerResult.bonusType} bonus)
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-gray-500" />
                <span>No witness bonus awarded.</span>
              </div>
            )}
          </div>
        </div>

        {/* Final Standings Table */}
        <h3 className="text-xl font-bold text-yellow-400 mb-4 title-font tracking-wide text-left">
          📊 Cumulative Standings Breakdown
        </h3>
        <div className="space-y-3 font-sans mb-8">
          {scores.map((p) => {
            const roleConfig = MODERN_ROLES_CONFIG[p.role as ModernRole];
            return (
              <div
                key={p.playerId}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  p.rank === 1
                    ? 'bg-gradient-to-r from-amber-900/80 via-yellow-950/80 to-purple-950/80 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                    : 'bg-purple-950/60 border-purple-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {p.rank && p.rank <= 3 ? (
                    <img
                      src={`/assets/images/rank${p.rank}.png`}
                      alt={`Rank ${p.rank}`}
                      className="w-8 h-8 object-contain drop-shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-900 border border-purple-600 flex items-center justify-center font-bold text-xs text-yellow-300">
                      #{p.rank}
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-purple-900/80 border border-purple-500/50 overflow-hidden flex items-center justify-center p-1 shrink-0">
                    {roleConfig?.image ? (
                      <img src={roleConfig.image} alt={p.role} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl">{roleConfig?.emoji || '👑'}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{p.name}</span>
                      {p.awards && p.awards.map((award, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-bold">
                          🏆 {award}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-purple-300">
                      Role: {p.role} • Round Score: <span className="text-amber-300 font-bold">+{p.roundScore || p.finalScore}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-yellow-300">
                    {p.cumulativeScore || p.finalScore} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        {isGameOver ? (
          <button
            onClick={onViewLeaderboard}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black font-black text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:scale-[1.02] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <img src="/assets/images/trophy.png" className="w-6 h-6 object-contain" alt="Trophy" />
            <span>VIEW FINAL MATCH LEADERBOARD</span>
          </button>
        ) : isHost ? (
          <button
            onClick={onNextRound}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black font-black text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:scale-[1.02] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-6 h-6 text-black" />
            <span>START NEXT ROUND ({(currentRound || 1) + 1} / {totalRounds || 3})</span>
          </button>
        ) : (
          <div className="w-full py-4 rounded-2xl bg-purple-900/60 border border-purple-700/50 text-center font-bold text-base text-purple-200">
            ⏳ Waiting for Host to start Next Round ({(currentRound || 1) + 1} / {totalRounds || 3})...
          </div>
        )}
      </motion.div>
    </div>
  );
};

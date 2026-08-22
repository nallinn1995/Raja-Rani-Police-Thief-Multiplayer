import React from 'react';
import { Star, Zap, Award, Crown, Trophy, Sparkles } from 'lucide-react';
import { MatchXPBreakdown } from '../../config/xpConfig';

interface XpBreakdownCardProps {
  matchXP?: MatchXPBreakdown | null;
  levelUpInfo?: {
    oldLevel: number;
    newLevel: number;
    isLevelUp: boolean;
  } | null;
}

export const XpBreakdownCard: React.FC<XpBreakdownCardProps> = ({ matchXP, levelUpInfo }) => {
  if (!matchXP) return null;

  return (
    <div className="space-y-3 my-4">
      {/* Level Up Announcement Banner */}
      {levelUpInfo?.isLevelUp && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 p-4 rounded-2xl text-center shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce">
          <div className="inline-flex items-center space-x-2 bg-amber-400 text-slate-950 font-black text-xs uppercase px-3 py-1 rounded-full mb-1">
            <Crown className="w-4 h-4 fill-slate-950" />
            <span>Level Up!</span>
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">
            Level {levelUpInfo.oldLevel} → <span className="text-white text-3xl font-extrabold">Level {levelUpInfo.newLevel}</span>
          </p>
          <p className="text-xs font-semibold text-yellow-200/90 mt-0.5">Congratulations! You unlocked higher detective status!</p>
        </div>
      )}

      {/* Match XP Breakdown Container */}
      <div className="bg-[#11052C]/90 border border-[#3A1C61] rounded-2xl p-4 space-y-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-[#3A1C61] pb-2.5">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-black uppercase text-amber-300 tracking-wider">Match XP Breakdown</span>
          </div>
          <span className="text-xl font-black text-cyan-300 drop-shadow">+{matchXP.totalXP} XP</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          {matchXP.participationXP > 0 && (
            <div className="flex items-center justify-between bg-[#1A0C3B] p-2.5 rounded-xl border border-[#3A1C61]">
              <span className="text-purple-300">Participation</span>
              <span className="text-emerald-400">+{matchXP.participationXP} XP</span>
            </div>
          )}
          {matchXP.completionXP > 0 && (
            <div className="flex items-center justify-between bg-[#1A0C3B] p-2.5 rounded-xl border border-[#3A1C61]">
              <span className="text-purple-300">Completion</span>
              <span className="text-emerald-400">+{matchXP.completionXP} XP</span>
            </div>
          )}
          {matchXP.scoreXP > 0 && (
            <div className="flex items-center justify-between bg-[#1A0C3B] p-2.5 rounded-xl border border-[#3A1C61]">
              <span className="text-purple-300">Score Bonus</span>
              <span className="text-emerald-400">+{matchXP.scoreXP} XP</span>
            </div>
          )}
          {matchXP.winnerBonus > 0 && (
            <div className="flex items-center justify-between bg-[#1A0C3B] p-2.5 rounded-xl border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <span className="text-amber-300 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Winner Bonus
              </span>
              <span className="text-amber-400">+{matchXP.winnerBonus} XP</span>
            </div>
          )}
          {matchXP.policeBonus > 0 && (
            <div className="flex items-center justify-between bg-[#1A0C3B] p-2.5 rounded-xl border border-[#3A1C61]">
              <span className="text-purple-300 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                Police Catch Bonus
              </span>
              <span className="text-emerald-400">+{matchXP.policeBonus} XP</span>
            </div>
          )}
          {matchXP.accuracyBonus > 0 && (
            <div className="flex items-center justify-between bg-[#1A0C3B] p-2.5 rounded-xl border border-[#3A1C61]">
              <span className="text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Accuracy Bonus
              </span>
              <span className="text-cyan-300">+{matchXP.accuracyBonus} XP</span>
            </div>
          )}
          {matchXP.speedBonus > 0 && (
            <div className="flex items-center justify-between bg-[#1A0C3B] p-2.5 rounded-xl border border-[#3A1C61]">
              <span className="text-purple-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Fast Guess Bonus
              </span>
              <span className="text-yellow-300">+{matchXP.speedBonus} XP</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

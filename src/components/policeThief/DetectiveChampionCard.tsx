import React from "react";
import { Crown, Shield, Target, Zap } from "lucide-react";
import { Player } from "../../types/game";

interface DetectiveChampionCardProps {
  champion: Player;
}

export const DetectiveChampionCard: React.FC<DetectiveChampionCardProps> = ({ champion }) => {
  if (!champion) return null;

  const accuracy = champion.accuracy || 0;
  const catches = champion.correctCatches || 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#3D1A04] via-[#240F03] to-[#120701] border-2 border-amber-400 rounded-3xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.3)] text-center space-y-4">
      {/* Background Animated Crown Light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />

      {/* Top Champion Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase tracking-widest shadow-md">
        <Crown className="w-4 h-4 fill-current text-black" />
        <span>Detective Champion</span>
      </div>

      {/* Champion Name & Title */}
      <div className="space-y-1">
        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-500 tracking-wide title-font drop-shadow-md">
          {champion.name}
        </h2>
        <p className="text-sm font-bold text-amber-300 tracking-wider">
          {champion.title || "Master Detective"}
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center pt-2">
        <div className="bg-[#120701]/80 p-3 rounded-2xl border border-amber-500/30 shadow-inner">
          <Shield className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <span className="text-[10px] text-amber-200 font-bold uppercase block">Correct Catches</span>
          <span className="text-xl font-black text-white">{catches}</span>
        </div>

        <div className="bg-[#120701]/80 p-3 rounded-2xl border border-amber-500/30 shadow-inner">
          <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <span className="text-[10px] text-amber-200 font-bold uppercase block">Accuracy</span>
          <span className="text-xl font-black text-emerald-300">{accuracy}%</span>
        </div>

        <div className="bg-[#120701]/80 p-3 rounded-2xl border border-amber-500/30 shadow-inner">
          <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <span className="text-[10px] text-amber-200 font-bold uppercase block">Fastest Catch</span>
          <span className="text-xl font-black text-yellow-300">
            {champion.fastestCatch ? `${champion.fastestCatch}s` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

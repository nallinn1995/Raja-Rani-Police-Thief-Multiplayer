import React from "react";
import { Player } from "../../types/game";
import { PerformanceBadge } from "./PerformanceBadge";

interface PlayerPerformanceCardProps {
  player: Player;
  rank: number;
}

export const PlayerPerformanceCard: React.FC<PlayerPerformanceCardProps> = ({ player, rank }) => {
  const accuracy = player.accuracy || 0;
  const catches = player.correctCatches || 0;
  const wrong = player.wrongGuesses || 0;
  const escapes = player.thiefEscaped || 0;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 ${
        rank === 1
          ? "bg-gradient-to-r from-[#3D1A04] to-[#1E0D02] border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
          : "bg-[#11052C] border-[#3A1C61]"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {rank <= 3 ? (
            <img
              src={`/assets/images/rank${rank}.png`}
              alt={`Rank ${rank}`}
              className="w-9 h-9 object-contain shrink-0 drop-shadow-md"
            />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white shadow-md bg-purple-900/60">
              {rank}
            </div>
          )}
          <div>
            <h4 className="font-extrabold text-white text-sm tracking-wide">{player.name}</h4>
            <p className="text-xs text-purple-300 font-medium">{player.title || "Recruit Detective"}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block">Detective Accuracy</span>
          <span className="text-lg font-black text-emerald-400">{accuracy}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-t border-purple-900/40">
        <div className="bg-[#1D0C3A] p-2 rounded-xl border border-purple-900/50">
          <span className="text-slate-400 block text-[10px]">Catches</span>
          <span className="font-extrabold text-emerald-400">{catches}</span>
        </div>
        <div className="bg-[#1D0C3A] p-2 rounded-xl border border-purple-900/50">
          <span className="text-slate-400 block text-[10px]">Wrong</span>
          <span className="font-extrabold text-rose-400">{wrong}</span>
        </div>
        <div className="bg-[#1D0C3A] p-2 rounded-xl border border-purple-900/50">
          <span className="text-slate-400 block text-[10px]">Escapes</span>
          <span className="font-extrabold text-fuchsia-400">{escapes}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {accuracy >= 80 && <PerformanceBadge type="perfect_accuracy" />}
        {catches >= 3 && <PerformanceBadge type="sharp_shooter" />}
        {escapes >= 2 && <PerformanceBadge type="ghost_thief" />}
        {player.fastestCatch && player.fastestCatch <= 5 && <PerformanceBadge type="quick_catch" />}
      </div>
    </div>
  );
};

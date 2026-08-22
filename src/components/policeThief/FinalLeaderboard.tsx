import React from "react";
import { Player } from "../../types/game";
import { PlayerPerformanceCard } from "./PlayerPerformanceCard";

interface FinalLeaderboardProps {
  leaderboard: Player[];
}

export const FinalLeaderboard: React.FC<FinalLeaderboardProps> = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-white flex items-center gap-2 tracking-wide">
          <img src="/assets/images/trophy.png" className="w-5 h-5 object-contain" alt="Trophy" />
          <span>Final Detective Leaderboard</span>
        </h3>
        <span className="text-xs font-bold text-blue-300 bg-blue-950/60 border border-blue-500/30 px-3 py-1 rounded-full uppercase">
          Ranked by Detective Score
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {leaderboard.map((player, index) => (
          <PlayerPerformanceCard key={player.id || index} player={player} rank={index + 1} />
        ))}
      </div>
    </div>
  );
};

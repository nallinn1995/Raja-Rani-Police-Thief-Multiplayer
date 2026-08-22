import React from "react";
import { LeaderboardEntry } from "../../services/policeThiefService";
import { Shield, Target, Zap, Flame, Ghost, Crown } from "lucide-react";

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  category: string;
  onCategoryChange?: (cat: string) => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  leaderboard,
  category,
  onCategoryChange,
}) => {
  const categories = [
    { id: "top_detective", label: "Top Detective", icon: <Shield className="w-3.5 h-3.5" /> },
    { id: "highest_accuracy", label: "Highest Accuracy", icon: <Target className="w-3.5 h-3.5" /> },
    { id: "most_catches", label: "Most Catches", icon: <Crown className="w-3.5 h-3.5" /> },
    { id: "fastest_detective", label: "Fastest Catch", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "most_escapes", label: "Most Escapes", icon: <Ghost className="w-3.5 h-3.5" /> },
    { id: "longest_streak", label: "Longest Streak", icon: <Flame className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      {onCategoryChange && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const isActive = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onCategoryChange(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-400"
                    : "bg-[#12072B] text-purple-300 hover:text-white border border-[#3A1C61]"
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Table Display */}
      {(!leaderboard || leaderboard.length === 0) ? (
        <div className="p-8 text-center text-xs text-purple-300 bg-[#12072B] border border-[#3A1C61] rounded-2xl">
          No leaderboard data available for this category yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#3A1C61] bg-[#12072B]">
          <table className="w-full text-left text-xs text-purple-200">
            <thead className="bg-[#1A0C3B] text-purple-300 uppercase tracking-wider font-extrabold border-b border-[#3A1C61]">
              <tr>
                <th className="p-3 text-center w-12">Rank</th>
                <th className="p-3">Detective</th>
                <th className="p-3 text-center">Wins</th>
                <th className="p-3 text-center">Accuracy</th>
                <th className="p-3 text-center">Catches</th>
                <th className="p-3 text-center">Escapes</th>
                <th className="p-3 text-center">Fastest Catch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {leaderboard.map((item) => (
                <tr
                  key={item.userId || item.rank}
                  className="hover:bg-[#1C0B3B]/60 transition-colors font-medium"
                >
                  <td className="p-3 text-center">
                    {item.rank <= 3 ? (
                      <img
                        src={`/assets/images/rank${item.rank}.png`}
                        alt={`Rank ${item.rank}`}
                        className="w-7 h-7 object-contain inline-block drop-shadow-md"
                      />
                    ) : (
                      <span className="inline-flex w-7 h-7 rounded-full items-center justify-center font-extrabold text-xs text-purple-300 bg-purple-950">
                        {item.rank}
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <div>
                      <span className="font-extrabold text-white text-sm block">{item.username}</span>
                      <span className="text-[10px] text-amber-300 font-semibold">{item.title || "Recruit Detective"}</span>
                    </div>
                  </td>

                  <td className="p-3 text-center font-bold text-amber-300">{item.metrics?.detectiveWins || 0}</td>
                  <td className="p-3 text-center font-extrabold text-emerald-400">{item.metrics?.accuracy || 0}%</td>
                  <td className="p-3 text-center font-bold text-blue-300">{item.metrics?.correctCatches || 0}</td>
                  <td className="p-3 text-center font-bold text-fuchsia-300">{item.metrics?.thiefEscaped || 0}</td>
                  <td className="p-3 text-center font-bold text-yellow-300">
                    {item.metrics?.fastestCatch ? `${item.metrics.fastestCatch}s` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

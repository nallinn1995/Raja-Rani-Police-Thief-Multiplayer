import React from "react";
import { Trophy, CheckCircle2 } from "lucide-react";

interface AchievementGridProps {
  achievements: Array<{
    _id?: string;
    code: string;
    title: string;
    description: string;
    icon?: string;
    unlockedAt?: string;
  }>;
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({ achievements }) => {
  if (!achievements || achievements.length === 0) {
    return (
      <div className="p-8 text-center bg-[#12072B] border border-[#3A1C61] rounded-3xl">
        <Trophy className="w-10 h-10 text-purple-400 opacity-40 mx-auto mb-2" />
        <h4 className="text-white font-bold text-base">No Police vs Thief Trophies Yet</h4>
        <p className="text-purple-300 text-xs mt-1">
          Play Police vs Thief matches, maintain high accuracy, and escape to unlock achievements!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {achievements.map((ach, idx) => (
        <div
          key={ach._id || ach.code || idx}
          className="p-4 bg-[#12072B] border border-amber-500/30 rounded-2xl flex items-center gap-3 shadow-md hover:border-amber-400 transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-yellow-400 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
            {ach.icon || "🏆"}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h5 className="font-extrabold text-white text-sm truncate">{ach.title}</h5>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 inline" />
            </div>
            <p className="text-purple-300 text-xs line-clamp-2 mt-0.5">{ach.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

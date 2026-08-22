import React from "react";
import { Award, Shield, Target, Ghost, Zap } from "lucide-react";
import { Player } from "../../types/game";

interface MatchAwardsProps {
  leaderboard: Player[];
}

export const MatchAwards: React.FC<MatchAwardsProps> = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0) return null;

  const mostAccurate = [...leaderboard].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0];
  const mostCatches = [...leaderboard].sort((a, b) => (b.correctCatches || 0) - (a.correctCatches || 0))[0];
  const mostEscapes = [...leaderboard].sort((a, b) => (b.thiefEscaped || 0) - (a.thiefEscaped || 0))[0];
  const fastestCatch = [...leaderboard]
    .filter((p) => (p.fastestCatch || 0) > 0)
    .sort((a, b) => (a.fastestCatch || 999) - (b.fastestCatch || 999))[0];

  const awards = [
    {
      title: "Master Investigator",
      player: mostAccurate,
      metric: `${mostAccurate?.accuracy || 0}% Accuracy`,
      icon: <Target className="w-5 h-5 text-emerald-400" />,
      borderColor: "border-emerald-500/40",
      bgColor: "bg-emerald-950/40",
    },
    {
      title: "Sharp Shooter",
      player: mostCatches,
      metric: `${mostCatches?.correctCatches || 0} Catches`,
      icon: <Shield className="w-5 h-5 text-blue-400" />,
      borderColor: "border-blue-500/40",
      bgColor: "bg-blue-950/40",
    },
    {
      title: "Ghost Thief",
      player: mostEscapes,
      metric: `${mostEscapes?.thiefEscaped || 0} Escapes`,
      icon: <Ghost className="w-5 h-5 text-fuchsia-400" />,
      borderColor: "border-fuchsia-500/40",
      bgColor: "bg-fuchsia-950/40",
    },
    {
      title: "Speed Detective",
      player: fastestCatch,
      metric: fastestCatch ? `${fastestCatch.fastestCatch}s Catch` : "N/A",
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      borderColor: "border-yellow-500/40",
      bgColor: "bg-yellow-950/40",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest">
        <Award className="w-4 h-4 text-amber-400" />
        <span>Match Special Awards</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {awards.map((award, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border ${award.borderColor} ${award.bgColor} flex items-center gap-3 shadow-inner`}
          >
            <div className="p-2.5 rounded-xl bg-[#11052C] border border-purple-900/60 shrink-0">
              {award.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-300 uppercase block tracking-wide truncate">
                {award.title}
              </span>
              <p className="font-extrabold text-white text-sm truncate">
                {award.player?.name || "None"}
              </p>
              <span className="text-xs font-semibold text-amber-300 block">
                {award.metric}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

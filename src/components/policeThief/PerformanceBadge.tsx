import React from "react";
import { Zap, Target, Flame, Ghost, Crown, CheckCircle2 } from "lucide-react";

interface PerformanceBadgeProps {
  type: "quick_catch" | "perfect_accuracy" | "master_detective" | "ghost_thief" | "escape_streak" | "sharp_shooter";
  label?: string;
}

export const PerformanceBadge: React.FC<PerformanceBadgeProps> = ({ type, label }) => {
  const getBadgeConfig = () => {
    switch (type) {
      case "quick_catch":
        return {
          icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
          text: label || "Quick Catch (<5s)",
          bgColor: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
        };
      case "perfect_accuracy":
        return {
          icon: <Target className="w-3.5 h-3.5 text-emerald-400" />,
          text: label || "100% Accuracy",
          bgColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
        };
      case "master_detective":
        return {
          icon: <Crown className="w-3.5 h-3.5 text-amber-400" />,
          text: label || "Master Detective",
          bgColor: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        };
      case "ghost_thief":
        return {
          icon: <Ghost className="w-3.5 h-3.5 text-fuchsia-400" />,
          text: label || "Ghost Escape",
          bgColor: "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300",
        };
      case "escape_streak":
        return {
          icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
          text: label || "Escape Streak",
          bgColor: "bg-orange-500/10 border-orange-500/30 text-orange-300",
        };
      case "sharp_shooter":
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />,
          text: label || "Sharp Shooter",
          bgColor: "bg-blue-500/10 border-blue-500/30 text-blue-300",
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tracking-wide shadow-sm ${config.bgColor}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};

import React from "react";

interface DetectiveBadgeProps {
  badge: string;
  icon?: string;
  size?: "sm" | "md" | "lg";
}

export const DetectiveBadge: React.FC<DetectiveBadgeProps> = ({ badge, icon, size = "md" }) => {
  const getBadgeStyle = (name: string) => {
    if (name.includes("Lightning")) {
      return "from-amber-500/20 to-yellow-600/30 border-amber-400/60 text-yellow-300 shadow-amber-500/20";
    }
    if (name.includes("Sharp")) {
      return "from-orange-500/20 to-rose-600/30 border-orange-400/60 text-orange-300 shadow-orange-500/20";
    }
    if (name.includes("Master")) {
      return "from-purple-500/20 to-indigo-600/30 border-purple-400/60 text-purple-300 shadow-purple-500/20";
    }
    if (name.includes("Wrong")) {
      return "from-rose-500/20 to-red-600/30 border-rose-400/60 text-rose-300 shadow-rose-500/20";
    }
    if (name.includes("Quick")) {
      return "from-cyan-500/20 to-blue-600/30 border-cyan-400/60 text-cyan-300 shadow-cyan-500/20";
    }
    return "from-blue-500/20 to-indigo-600/30 border-blue-400/60 text-blue-300 shadow-blue-500/20";
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm font-black",
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 bg-gradient-to-r ${getBadgeStyle(
        badge
      )} border rounded-full font-bold shadow-md backdrop-blur-md ${sizeClasses[size]}`}
    >
      {icon && <span>{icon}</span>}
      <span>{badge}</span>
    </span>
  );
};

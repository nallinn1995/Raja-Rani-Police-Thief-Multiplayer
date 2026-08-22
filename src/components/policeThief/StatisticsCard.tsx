import React from "react";

interface StatisticsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  borderColor?: string;
  bgColor?: string;
  textColor?: string;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  label,
  value,
  subValue,
  icon,
  borderColor = "border-purple-800/40",
  bgColor = "bg-[#14062e]",
  textColor = "text-white",
}) => {
  return (
    <div className={`p-4 rounded-2xl border ${borderColor} ${bgColor} shadow-md transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide truncate">{label}</span>
        <div className="p-1.5 rounded-xl bg-[#090314] border border-purple-900/50 text-purple-300">
          {icon}
        </div>
      </div>
      <div className={`text-2xl sm:text-3xl font-black ${textColor} tracking-tight`}>
        {value}
      </div>
      {subValue && <p className="text-[11px] font-semibold text-purple-300 mt-1">{subValue}</p>}
    </div>
  );
};

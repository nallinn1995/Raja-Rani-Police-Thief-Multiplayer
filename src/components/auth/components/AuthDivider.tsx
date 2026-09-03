import React from "react";

interface AuthDividerProps {
  text?: string;
  className?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({
  text = "OR",
  className = "my-3",
}) => {
  return (
    <div className={`flex items-center justify-center relative select-none ${className}`}>
      {/* Left gold gradient line */}
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#F4C542]/60 to-[#F4C542]/80" />
      
      {/* Center diamond & text */}
      <div className="px-3 flex items-center gap-1.5 text-[11px] font-royal font-bold text-[#F4C542] tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
        <span className="text-[9px] text-[#F4C542]">✦</span>
        <span>{text}</span>
        <span className="text-[9px] text-[#F4C542]">✦</span>
      </div>

      {/* Right gold gradient line */}
      <div className="flex-1 h-[1px] bg-gradient-to-r from-[#F4C542]/80 via-[#F4C542]/60 to-transparent" />
    </div>
  );
};

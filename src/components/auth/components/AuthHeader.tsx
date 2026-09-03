import React from "react";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
}) => {
  return (
    <div className="text-center mb-3 relative z-20 select-none">
      {/* 3D Royal Crown Game Logo */}
      {showLogo && (
        <div className="flex justify-center mb-1.5 transform hover:scale-[1.02] transition-transform duration-300">
          <img
            src="/assets/images/Auth/section_centered_iimage.png"
            alt="Raja Rani Police Thief Logo"
            className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
            draggable={false}
          />
        </div>
      )}

      {/* Royal Heading with Decorative Wing Flourishes */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1">
        <img
          src="/assets/images/Auth/title_decor.png"
          alt=""
          aria-hidden="true"
          className="h-3 sm:h-3.5 object-contain opacity-90"
          draggable={false}
        />
        <h2 className="text-xl sm:text-2xl font-bold font-royal tracking-wider auth-gold-gradient-text">
          {title}
        </h2>
        <img
          src="/assets/images/Auth/title_decor.png"
          alt=""
          aria-hidden="true"
          className="h-3 sm:h-3.5 object-contain scale-x-[-1] opacity-90"
          draggable={false}
        />
      </div>

      {/* Subtitle / Supporting Reassurance */}
      {subtitle && (
        <p className="text-xs sm:text-[13px] text-[#D8C7E0] font-body font-normal leading-relaxed max-w-[340px] sm:max-w-sm mx-auto px-2">
          {subtitle}
        </p>
      )}
    </div>
  );
};

import React from 'react';
import { BookOpen } from 'lucide-react';
import { UserProfile } from './UserProfile';
import { User } from '../services/authService';

interface AppHeaderProps {
  currentUser: User | null;
  onOpenAuth?: () => void;
  onOpenGameInfo?: () => void;
  onLogout?: () => void;
  onOpenDashboard?: () => void;
  onGoHome?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  onOpenAuth: _onOpenAuth,
  onOpenGameInfo,
  onLogout,
  onOpenDashboard,
  onGoHome,
}) => {
  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080320]/95 backdrop-blur-md border-b border-[#3F1152]/70 shadow-2xl px-3 sm:px-8 md:px-12 py-2 sm:py-2.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Crown Logo */}
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
          onClick={() => {
            if (onGoHome) onGoHome();
          }}
        >
          <img
            src="/assets/images/Landing Page/section_centered_iimage.png"
            alt="Raja Rani Police Thief Logo"
            className="h-8 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_16px_rgba(172,65,215,0.4)]"
          />
        </div>

        {/* Right: Game Info & User Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-4 flex-nowrap flex-shrink-0">
          {onOpenGameInfo && (
            <button
              onClick={onOpenGameInfo}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-1.5 bg-[#0c0524]/90 hover:bg-[#21073F] border border-[#FBE278]/70 rounded-full text-[11px] sm:text-xs md:text-sm font-bold text-[#FBE278] hover:text-white shadow-[0_0_12px_rgba(251,226,120,0.2)] hover:shadow-[0_0_20px_rgba(251,226,120,0.4)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
              title="Game Rules & Info"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FBE278]" />
              <span>Game Info</span>
            </button>
          )}

          <UserProfile
            user={currentUser}
            onLogout={onLogout || (() => {})}
            onOpenDashboard={onOpenDashboard || (() => {})}
          />
        </div>
      </div>
    </header>
  );
};

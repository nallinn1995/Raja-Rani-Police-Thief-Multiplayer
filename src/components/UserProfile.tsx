import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { User } from '../services/authService';
import { getAvatarSrc } from '../utils/avatarUtils';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onOpenDashboard?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onOpenDashboard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const avatarUrl = getAvatarSrc((user as any).avatar);

  return (
    <div className="relative z-40" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition duration-200 cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden border border-yellow-400/80 shadow-inner flex-shrink-0">
          <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" />
        </div>
        <span className="text-sm font-semibold max-w-[100px] truncate">
          {user.username}
        </span>
        {user.isGuest && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
            Guest
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden py-1 text-white z-50">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-sm font-bold truncate text-purple-300">{user.username}</p>
          </div>

          {!user.isGuest && onOpenDashboard && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenDashboard();
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-600/20 flex items-center gap-2.5 transition"
            >
              <UserIcon className="w-4 h-4 text-purple-400" />
              <span>Profile & Stats</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-600/20 text-red-400 flex items-center gap-2.5 transition"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

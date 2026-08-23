import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User as UserIcon, Shield } from 'lucide-react';
import { User } from '../services/authService';
import { adminService } from '../services/adminService';
import { getAvatarSrc } from '../utils/avatarUtils';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onOpenDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onLogout,
  onOpenDashboard,
  onOpenAdminDashboard,
}) => {
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
  const isAdmin = user.role === 'admin' || user.username?.toLowerCase() === 'admin' || adminService.isAdminLoggedIn();

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
        {isAdmin && !user.isGuest && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/40 text-amber-300 border border-amber-400/60 font-bold">
            Admin
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden py-1 text-white z-50">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-sm font-bold truncate text-purple-300 flex items-center justify-between">
              <span>{user.username}</span>
              {isAdmin && <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">ADMIN</span>}
            </p>
          </div>

          {isAdmin && onOpenAdminDashboard && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAdminDashboard();
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-amber-500/20 text-amber-300 font-bold flex items-center gap-2.5 transition border-b border-gray-800 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Admin Control Panel</span>
            </button>
          )}

          {!user.isGuest && onOpenDashboard && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenDashboard();
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-600/20 flex items-center gap-2.5 transition cursor-pointer"
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
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-600/20 text-red-400 flex items-center gap-2.5 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

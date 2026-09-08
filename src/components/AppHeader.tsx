import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Mic, MicOff, Crown, Volume2, VolumeX, Menu, X, User as UserIcon, Shield, Bell, LogOut } from 'lucide-react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { soundService } from '../services/soundService';
import { UserProfile } from './UserProfile';
import { User } from '../services/authService';
import { Room } from '../types/game';
import { VoiceControlsState } from './VoiceChatManager';
import { PWAHeaderButton } from './pwa/PWAHeaderButton';
import { adminService } from '../services/adminService';

interface AppHeaderProps {
  currentUser: User | null;
  room?: Room | null;
  appState?: string;
  voiceControls?: VoiceControlsState | null;
  onOpenAuth?: () => void;
  onOpenGameInfo?: () => void;
  onLogout?: () => void;
  onOpenDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenNotificationSettings?: () => void;
  onGoHome?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  room,
  appState,
  voiceControls,
  onOpenAuth: _onOpenAuth,
  onOpenGameInfo,
  onLogout,
  onOpenDashboard,
  onOpenAdminDashboard,
  onOpenNotificationSettings,
  onGoHome,
}) => {
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(() => soundService.isMuted());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return soundService.subscribe((muted) => setIsSfxMuted(muted));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleToggleSfx = () => {
    const next = soundService.toggleMute();
    setIsSfxMuted(next);
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.username?.toLowerCase() === 'admin' || adminService.isAdminLoggedIn();

  const isClassicMode =
    !room?.gameMode ||
    room.gameMode === 'CLASSIC' ||
    room.gameMode === 'CLASSIC_POINTS' ||
    room.gameMode === 'classic';

  const isClassicInRoom =
    Boolean(room) &&
    isClassicMode &&
    (appState === 'waiting' ||
      appState === 'playing' ||
      appState === 'result' ||
      appState === 'leaderboard');

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080320]/95 backdrop-blur-md border-b border-[#3F1152]/70 shadow-2xl px-2.5 sm:px-6 md:px-10 py-2 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Left: Crown Logo & Room / Team Name */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
          <div
            className="flex items-center cursor-pointer group flex-shrink-0"
            onClick={() => {
              if (onGoHome) onGoHome();
            }}
            title="Go to Home"
          >
            <img
              src="/assets/images/Landing Page/section_centered_iimage.png"
              alt="Raja Rani Police Thief Logo"
              className="h-7 sm:h-9 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_16px_rgba(172,65,215,0.4)]"
            />
          </div>

          {/* In Classic Mode: Show Room / Team Name on Top-Left */}
          {isClassicInRoom && (
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#2A0845] via-[#21073F] to-[#18042E] border border-[#FFD700]/60 shadow-[0_0_12px_rgba(255,215,0,0.25)] min-w-0">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-[#FBE278] shrink-0 animate-pulse" />
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[7px] sm:text-[9px] uppercase font-black text-[#E9D5FF]/80 tracking-wider">
                  Room
                </span>
                <span className="text-[11px] sm:text-sm font-extrabold text-[#FBE278] truncate max-w-[80px] xs:max-w-[140px] sm:max-w-[200px] md:max-w-[260px] drop-shadow-sm">
                  {room?.name || `Room ${room?.id}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right - Desktop & Tablet (>= md): Full Controls Row */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-nowrap flex-shrink-0">
          {/* Classic Mode Voice Controls on Top-Right */}
          {isClassicInRoom && voiceControls && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Mic Toggle Button */}
              <button
                onClick={voiceControls.toggleMute}
                disabled={voiceControls.isMicAcquiring}
                className={`p-1.5 sm:p-2 rounded-full border shadow-md transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
                  voiceControls.isMuted
                    ? 'bg-red-500/90 hover:bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                    : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-2 ring-emerald-300/60'
                }`}
                title={voiceControls.isMuted ? 'Unmute Microphone (Click to speak)' : 'Mute Microphone'}
                aria-label="Toggle Microphone"
              >
                {voiceControls.isMuted ? (
                  <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
                )}
              </button>

              {/* Speaker Toggle Button */}
              <button
                onClick={voiceControls.toggleSpeaker}
                className={`p-1.5 sm:p-2 rounded-full border shadow-md transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
                  voiceControls.isSpeakerMuted
                    ? 'bg-red-500/90 hover:bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                    : 'bg-blue-500/90 hover:bg-blue-600 border-blue-300 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                }`}
                title={voiceControls.isSpeakerMuted ? 'Unmute Peer Voice Audio' : 'Mute Peer Voice Audio'}
                aria-label="Toggle Speaker"
              >
                {voiceControls.isSpeakerMuted ? (
                  <SpeakerXMarkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <SpeakerWaveIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                )}
              </button>
            </div>
          )}

          {onOpenGameInfo && (
            <button
              onClick={onOpenGameInfo}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 bg-[#0c0524]/90 hover:bg-[#21073F] border border-[#FBE278]/70 rounded-full text-xs md:text-sm font-bold text-[#FBE278] hover:text-white shadow-[0_0_12px_rgba(251,226,120,0.2)] hover:shadow-[0_0_20px_rgba(251,226,120,0.4)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
              title="Game Rules & Info"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FBE278]" />
              <span>Game Info</span>
            </button>
          )}

          {/* Sound Effects (SFX) Toggle */}
          <button
            onClick={handleToggleSfx}
            className={`p-1.5 sm:p-2 rounded-full border shadow-md transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
              isSfxMuted
                ? 'bg-rose-500/80 hover:bg-rose-600 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                : 'bg-purple-900/80 hover:bg-purple-800 border-yellow-500/50 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
            }`}
            title={isSfxMuted ? 'Unmute Game Sound Effects' : 'Mute Game Sound Effects'}
            aria-label="Toggle Game Sound Effects"
          >
            {isSfxMuted ? (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" />
            )}
          </button>

          {/* PWA Install Button */}
          <PWAHeaderButton />

          <UserProfile
            user={currentUser}
            onLogout={onLogout || (() => {})}
            onOpenDashboard={onOpenDashboard || (() => {})}
            onOpenAdminDashboard={onOpenAdminDashboard}
            onOpenNotificationSettings={onOpenNotificationSettings}
          />
        </div>

        {/* Right - Mobile (< md): Voice Controls + Profile + Menu Button */}
        <div className="flex md:hidden items-center gap-1.5 flex-nowrap flex-shrink-0 relative" ref={mobileMenuRef}>
          {/* In Classic Room: Keep live voice controls accessible */}
          {isClassicInRoom && voiceControls && (
            <div className="flex items-center gap-1">
              <button
                onClick={voiceControls.toggleMute}
                disabled={voiceControls.isMicAcquiring}
                className={`p-1.5 rounded-full border shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                  voiceControls.isMuted
                    ? 'bg-red-500/90 border-red-400 text-white'
                    : 'bg-emerald-500 border-emerald-300 text-white ring-2 ring-emerald-300/60'
                }`}
                title={voiceControls.isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {voiceControls.isMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
                )}
              </button>

              <button
                onClick={voiceControls.toggleSpeaker}
                className={`p-1.5 rounded-full border shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                  voiceControls.isSpeakerMuted
                    ? 'bg-red-500/90 border-red-400 text-white'
                    : 'bg-blue-500/90 border-blue-300 text-white'
                }`}
                title={voiceControls.isSpeakerMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {voiceControls.isSpeakerMuted ? (
                  <SpeakerXMarkIcon className="w-3.5 h-3.5 text-white" />
                ) : (
                  <SpeakerWaveIcon className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
          )}

          {/* Compact UserProfile avatar button */}
          <UserProfile
            user={currentUser}
            onLogout={onLogout || (() => {})}
            onOpenDashboard={onOpenDashboard || (() => {})}
            onOpenAdminDashboard={onOpenAdminDashboard}
            onOpenNotificationSettings={onOpenNotificationSettings}
          />

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-full bg-[#1A0B3B]/90 border border-purple-500/40 text-yellow-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Open Quick Menu"
            aria-label="Open Quick Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Mobile Secondary Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#120424]/95 backdrop-blur-xl border border-purple-500/40 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 space-y-1 text-white">
              {/* Game Rules & Info */}
              {onOpenGameInfo && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenGameInfo();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-yellow-300 hover:text-white hover:bg-purple-900/40 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Game Rules & Info</span>
                </button>
              )}

              {/* SFX Mute/Unmute Toggle */}
              <button
                onClick={handleToggleSfx}
                className="w-full px-3 py-2 text-left text-xs font-bold text-purple-200 hover:text-white hover:bg-purple-900/40 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {isSfxMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-yellow-400 shrink-0" />
                  )}
                  <span>Game Audio</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isSfxMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {isSfxMuted ? 'MUTED' : 'ON'}
                </span>
              </button>

              {/* Install App (if available) */}
              <PWAHeaderButton
                asMenuItem
                onActionTriggered={() => setIsMobileMenuOpen(false)}
              />

              <div className="my-1 border-t border-purple-800/40" />

              {/* Profile & Stats */}
              {!currentUser.isGuest && onOpenDashboard && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenDashboard();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-purple-200 hover:text-white hover:bg-purple-900/40 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Profile & Stats</span>
                </button>
              )}

              {/* Notification Settings */}
              {onOpenNotificationSettings && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenNotificationSettings();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-purple-200 hover:text-white hover:bg-purple-900/40 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Notification Settings</span>
                </button>
              )}

              {/* Admin Panel */}
              {isAdmin && onOpenAdminDashboard && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAdminDashboard();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-amber-300 hover:text-white hover:bg-amber-500/20 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  <span>Admin Control Panel</span>
                </button>
              )}

              {/* Logout */}
              {onLogout && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/20 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

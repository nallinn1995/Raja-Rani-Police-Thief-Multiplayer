import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Menu, X, ArrowLeft, Volume2, VolumeX, Crown, Mic, MicOff } from 'lucide-react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { soundService } from '../services/soundService';
import { UserProfile } from './UserProfile';
import { PWAHeaderButton } from './pwa/PWAHeaderButton';
import { User } from '../services/authService';
import { Room } from '../types/game';
import { VoiceControlsState } from './VoiceChatManager';

interface MainHeaderProps {
  currentUser: User | null;
  appState: string;
  room?: Room | null;
  voiceControls?: VoiceControlsState | null;
  onOpenAuth: () => void;
  onOpenGameInfo: () => void;
  onGoHome: () => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
  onOpenAdminDashboard: () => void;
  onOpenNotificationSettings: () => void;
  onStartGame?: () => void;
  isInRoomOrGame?: boolean;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentUser,
  appState,
  room,
  voiceControls,
  onOpenAuth,
  onOpenGameInfo,
  onGoHome,
  onLogout,
  onOpenDashboard,
  onOpenAdminDashboard,
  onOpenNotificationSettings,
  onStartGame,
  isInRoomOrGame = false,
}) => {
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(() => soundService.isMuted());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return soundService.subscribe((muted) => setIsSfxMuted(muted));
  }, []);

  // Close mobile dropdown on outside click
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

  const handleLogoClick = () => {
    if (appState === 'welcome') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (isInRoomOrGame) {
      if (window.confirm('Return to Home? You may leave the current room/investigation.')) {
        onGoHome();
      }
      return;
    }
    onGoHome();
  };

  const handlePlayClick = () => {
    if (onStartGame) {
      onStartGame();
    } else {
      onOpenAuth();
    }
  };

  const handleToggleSfx = () => {
    const next = soundService.toggleMute();
    setIsSfxMuted(next);
  };

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
    <header className="sticky top-0 z-50 w-full bg-[#080320]/95 backdrop-blur-md border-b border-[#3F1152]/70 shadow-2xl px-2.5 sm:px-6 md:px-10 py-1.5 sm:py-2 transition-all duration-300 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Header Left: Crown Logo & optional Home Link / Room Badge */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
          <div 
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group flex-shrink-0" 
            onClick={handleLogoClick}
            title={appState === 'welcome' ? 'Raja Rani Police Thief' : 'Return to Home'}
          >
            {appState !== 'welcome' && (
              <button
                type="button"
                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-amber-400 hover:text-white transition sm:hidden"
                aria-label="Home"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <img 
              src="/assets/images/Landing Page/section_centered_iimage.png" 
              alt="Raja Rani Police Thief Logo" 
              className="h-7 xs:h-8 sm:h-10 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_12px_rgba(172,65,215,0.4)]"
            />
          </div>

          {/* If in a Classic or Multiplayer room: Show room badge */}
          {isClassicInRoom && (
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-gradient-to-r from-[#2A0845] via-[#21073F] to-[#18042E] border border-[#FFD700]/60 shadow-[0_0_12px_rgba(255,215,0,0.25)] min-w-0">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-[#FBE278] shrink-0 animate-pulse" />
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[7px] sm:text-[9px] uppercase font-black text-[#E9D5FF]/80 tracking-wider">
                  Room
                </span>
                <span className="text-[11px] sm:text-sm font-extrabold text-[#FBE278] truncate max-w-[80px] xs:max-w-[130px] sm:max-w-[180px] md:max-w-[240px] drop-shadow-sm">
                  {room?.name || `Room ${room?.id}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Header Right - Desktop & Tablet (>= md): Full Inline Controls */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-nowrap flex-shrink-0">
          {/* Classic Mode Voice Controls */}
          {isClassicInRoom && voiceControls && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={voiceControls.toggleMute}
                disabled={voiceControls.isMicAcquiring}
                className={`p-1.5 sm:p-2 rounded-full border shadow-md transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
                  voiceControls.isMuted
                    ? 'bg-red-500/90 hover:bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                    : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-2 ring-emerald-300/60'
                }`}
                title={voiceControls.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                aria-label="Toggle Microphone"
              >
                {voiceControls.isMuted ? (
                  <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
                )}
              </button>

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

          <button
            onClick={onOpenGameInfo}
            className="flex items-center space-x-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-[#0c0524]/90 hover:bg-[#21073F] border border-[#FBE278]/70 rounded-full text-xs md:text-sm font-bold text-[#FBE278] hover:text-white shadow-[0_0_12px_rgba(251,226,120,0.2)] hover:shadow-[0_0_20px_rgba(251,226,120,0.4)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
            title="Game Rules & Info"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FBE278]" />
            <span>Game Info</span>
          </button>

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

          {currentUser ? (
            <UserProfile
              user={currentUser}
              onLogout={onLogout}
              onOpenDashboard={onOpenDashboard}
              onOpenAdminDashboard={onOpenAdminDashboard}
              onOpenNotificationSettings={onOpenNotificationSettings}
            />
          ) : (
            <button
              onClick={handlePlayClick}
              className="px-4 sm:px-5 py-1 sm:py-1.5 bg-gradient-to-r from-[#AC41D7] via-[#9B2ECB] to-[#782287] hover:opacity-95 text-white font-bold text-xs md:text-sm rounded-full shadow-[0_0_16px_rgba(172,65,215,0.5)] hover:shadow-[0_0_24px_rgba(172,65,215,0.8)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              Play Now
            </button>
          )}
        </div>

        {/* Header Right - Mobile (< md): Primary Action + Voice + Menu Button */}
        <div className="flex md:hidden items-center gap-1.5 flex-nowrap flex-shrink-0 relative" ref={mobileMenuRef}>
          {/* In Classic Room: Live voice controls */}
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

          {currentUser ? (
            <UserProfile
              user={currentUser}
              onLogout={onLogout}
              onOpenDashboard={onOpenDashboard}
              onOpenAdminDashboard={onOpenAdminDashboard}
              onOpenNotificationSettings={onOpenNotificationSettings}
            />
          ) : (
            <button
              onClick={handlePlayClick}
              className="px-2.5 py-1 bg-gradient-to-r from-[#AC41D7] via-[#9B2ECB] to-[#782287] hover:opacity-95 text-white font-bold text-xs rounded-full shadow-[0_0_10px_rgba(172,65,215,0.5)] active:scale-95 whitespace-nowrap flex-shrink-0 cursor-pointer"
            >
              Play
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-full bg-[#1A0B3B]/90 border border-purple-500/40 text-yellow-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Mobile Secondary Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#120424]/95 backdrop-blur-xl border border-purple-500/40 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1">
              {/* Home Option if away from home */}
              {appState !== 'welcome' && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogoClick();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:text-white hover:bg-purple-900/40 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Return to Home</span>
                </button>
              )}

              {/* Game Info Option */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenGameInfo();
                }}
                className="w-full px-3 py-2 text-left text-xs text-yellow-300 hover:text-white hover:bg-purple-900/40 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>Game Rules & Info</span>
              </button>

              {/* SFX Mute/Unmute Toggle */}
              <button
                onClick={handleToggleSfx}
                className="w-full px-3 py-2 text-left text-xs font-bold text-purple-200 hover:text-white hover:bg-purple-900/40 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isSfxMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  )}
                  <span>Game Audio</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isSfxMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {isSfxMuted ? 'MUTED' : 'ON'}
                </span>
              </button>

              {/* Install App Option (if installable) */}
              <PWAHeaderButton
                asMenuItem
                onActionTriggered={() => setIsMobileMenuOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

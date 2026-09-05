import React from 'react';
import { BookOpen, Mic, MicOff, Crown } from 'lucide-react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { UserProfile } from './UserProfile';
import { User } from '../services/authService';
import { Room } from '../types/game';
import { VoiceControlsState } from './VoiceChatManager';
import { PWAHeaderButton } from './pwa/PWAHeaderButton';

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
  if (!currentUser) return null;

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
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Crown Logo & Room / Team Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
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
              className="h-7 sm:h-10 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_16px_rgba(172,65,215,0.4)]"
            />
          </div>

          {/* In Classic Mode: Show Room / Team Name on Top-Left */}
          {isClassicInRoom && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#2A0845] via-[#21073F] to-[#18042E] border border-[#FFD700]/60 shadow-[0_0_12px_rgba(255,215,0,0.25)] min-w-0">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FBE278] shrink-0 animate-pulse" />
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[8px] sm:text-[9px] uppercase font-black text-[#E9D5FF]/80 tracking-wider">
                  Room / Team
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-[#FBE278] truncate max-w-[100px] sm:max-w-[180px] md:max-w-[260px] drop-shadow-sm">
                  {room?.name || `Room ${room?.id}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Mic & Speaker (Classic Mode), Game Info, PWA Install & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-nowrap flex-shrink-0">
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
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 bg-[#0c0524]/90 hover:bg-[#21073F] border border-[#FBE278]/70 rounded-full text-[11px] sm:text-xs md:text-sm font-bold text-[#FBE278] hover:text-white shadow-[0_0_12px_rgba(251,226,120,0.2)] hover:shadow-[0_0_20px_rgba(251,226,120,0.4)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
              title="Game Rules & Info"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FBE278]" />
              <span className={isClassicInRoom ? 'hidden md:inline' : 'hidden xs:inline'}>Game Info</span>
            </button>
          )}

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
      </div>
    </header>
  );
};

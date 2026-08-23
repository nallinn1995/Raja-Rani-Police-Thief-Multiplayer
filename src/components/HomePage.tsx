import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, SlidersHorizontal } from 'lucide-react';
import { configService, FullSystemConfig } from '../services/configService';

interface HomePageProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onBack?: () => void;
  onOpenGameInfo?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onCreateRoom,
  onJoinRoom,
  onBack,
  onOpenGameInfo,
}) => {
  const [config, setConfig] = useState<FullSystemConfig>(configService.getConfig());

  useEffect(() => {
    return configService.subscribe(setConfig);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-4 relative text-white font-sans bg-cover bg-center bg-no-repeat select-none overflow-y-auto"
      style={{ backgroundImage: "url('/assets/images/background.png')" }}
    >
      {/* Subtle Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/25 via-transparent to-purple-950/35 pointer-events-none" />

      {/* Floating Back Navigation Arrow (Left Side) */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-1/2 left-3 sm:left-6 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1D0C3A]/80 hover:bg-[#2A1452] border-2 border-[#FFD700] text-gray-200 hover:text-white shadow-[0_0_20px_rgba(255,215,0,0.4)] backdrop-blur-md transition-all duration-200 flex items-center justify-center group cursor-pointer"
          title="Back to Landing Page"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Main Container with Dedicated Home Gold Frame */}
      <div className="home-gold-frame backdrop-blur-2xl relative z-10 max-w-[440px] sm:max-w-md w-full flex flex-col items-center shadow-2xl">

        {/* Top Centered Title Image Asset */}
        <div className="text-center mb-3 sm:mb-4 relative w-full flex flex-col items-center pt-1">
          <img
            src="/assets/images/Auth/section_centered_iimage.png"
            alt="Raja Rani Police Thief"
            className="w-full max-w-[210px] sm:max-w-[240px] object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)] transform hover:scale-105 transition-transform duration-300"
          />
          {/* Subtitle with Golden Arrow Flourishes */}
          <div className="flex items-center justify-center gap-2 mt-2 text-[#D8C7E0] text-[11px] sm:text-xs font-semibold tracking-wide">
            <span className="text-[#FFD700]">⇥</span>
            <span>{config.screenTexts?.homePage?.welcomeSubtext || "A thrilling multiplayer card game for 4 players"}</span>
            <span className="text-[#FFD700]">⇤</span>
          </div>
        </div>

        {/* ACTION BUTTONS WITH CLEAN IMAGE GRAPHICS */}
        <div className="w-full space-y-3 mb-4 sm:mb-5 max-w-sm">
          {/* Create Room Button */}
          <button
            onClick={onCreateRoom}
            className="w-full relative group cursor-pointer transition-transform duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.7)]">
              <img
                src="/assets/images/create_room.png"
                alt="Create Room"
                className="w-full h-auto max-h-[72px] sm:max-h-[85px] object-cover group-hover:brightness-110 transition-all duration-300"
              />
            </div>
          </button>

          {/* Join Room Button */}
          <button
            onClick={onJoinRoom}
            className="w-full relative group cursor-pointer transition-transform duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.7)]">
              <img
                src="/assets/images/join_room.png"
                alt="Join Room"
                className="w-full h-auto max-h-[72px] sm:max-h-[85px] object-cover group-hover:brightness-110 transition-all duration-300"
              />
            </div>
          </button>
        </div>

        {/* GAME RULES & ROLE SCORING BOTTOM CONTAINER */}
        <div className="w-full max-w-sm bg-[#0D031F]/90 border border-purple-500/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl backdrop-blur-md">
          <div className="text-left space-y-0.5">
            <h4 className="text-[11px] sm:text-xs font-black text-[#FFD700] tracking-wider uppercase font-serif drop-shadow-md">
              GAME RULES & ROLE SCORING
            </h4>
            <p className="text-[10px] sm:text-xs text-gray-300 font-medium leading-snug max-w-xs">
              Learn how the game works, role abilities, scoring system & mode details.
            </p>
          </div>

          {onOpenGameInfo && (
            <button
              onClick={onOpenGameInfo}
              className="flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#2A1047] to-[#160628] hover:from-[#3D1866] hover:to-[#220A3D] border border-[#FFD700]/70 text-[#FFD700] text-[11px] sm:text-xs font-bold transition-all duration-200 shadow-md flex items-center gap-1.5 cursor-pointer transform hover:scale-105"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFD700]" />
              <span>View Game Info</span>
            </button>
          )}
        </div>

      </div>

      {/* Floating Action / Settings Button (Bottom Right) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          onClick={onOpenGameInfo}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-yellow-500 border-2 border-[#FFD700] text-white shadow-[0_0_20px_rgba(255,215,0,0.6)] transition-transform duration-200 hover:scale-110 flex items-center justify-center cursor-pointer"
          title="Game Info & Settings"
        >
          <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>
      </div>
    </div>
  );
};
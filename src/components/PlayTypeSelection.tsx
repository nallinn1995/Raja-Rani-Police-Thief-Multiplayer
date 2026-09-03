import React from 'react';
import { ArrowLeft, Bot, Users, Sparkles, Zap, Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlayTypeSelectionProps {
  onSelectOffline: () => void;
  onSelectOnline: () => void;
  onBack: () => void;
  onOpenGameInfo?: () => void;
}

export const PlayTypeSelection: React.FC<PlayTypeSelectionProps> = ({
  onSelectOffline,
  onSelectOnline,
  onBack,
  onOpenGameInfo,
}) => {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 relative text-white font-sans bg-[#0A041A] bg-cover bg-center bg-no-repeat select-none overflow-y-auto"
      style={{ backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')" }}
    >
      {/* Subtle Vignette & Royal Ambient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080320]/60 via-[#160628]/40 to-[#080320]/80 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-b from-purple-700/15 via-fuchsia-600/10 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Floating Back Navigation Arrow (Left Side) */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1D0C3A]/90 hover:bg-[#2A1452] border-2 border-[#FFD700] text-gray-200 hover:text-white shadow-[0_0_20px_rgba(255,215,0,0.4)] backdrop-blur-md transition-all duration-200 flex items-center justify-center group cursor-pointer"
        title="Back to Landing Page"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Main Container */}
      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center my-auto py-6 px-2 sm:px-4">
        
        {/* Top Centered Title Image Asset */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5 sm:mb-7 flex flex-col items-center"
        >
          <img
            src="/assets/images/Auth/section_centered_iimage.png"
            alt="Raja Rani Police Thief"
            className="w-full max-w-[200px] sm:max-w-[240px] object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]"
          />
          <h1 className="mt-3 text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider bg-gradient-to-r from-[#FFD700] via-[#FFF3A8] to-[#FFD700] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,215,0,0.4)] font-serif">
            HOW DO YOU WANT TO PLAY?
          </h1>
          <p className="text-[#D8C7E0] text-xs sm:text-sm font-medium mt-1">
            Choose your preferred gaming experience
          </p>
        </motion.div>

        {/* 2 MAIN SELECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-3xl">
          
          {/* CARD 1: PLAY OFFLINE */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-[#14082B]/90 hover:bg-[#1A0A38] border-2 border-amber-500/40 hover:border-[#FFD700] shadow-[0_10px_35px_rgba(0,0,0,0.7)] hover:shadow-[0_0_35px_rgba(255,215,0,0.35)] backdrop-blur-xl transition-all duration-300 overflow-hidden"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-all duration-300 pointer-events-none" />
            
            <div className="space-y-4">
              {/* Badge & Icon Header */}
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                  <div className="w-full h-full bg-[#170930] rounded-[14px] flex items-center justify-center text-amber-400 group-hover:text-yellow-300 transition-colors">
                    <Bot className="w-7 h-7" />
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Instant Play
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#FFD700] transition-colors flex items-center gap-2">
                  <span>🎮 PLAY OFFLINE</span>
                </h2>
                <p className="text-amber-200/90 text-xs sm:text-sm font-semibold mt-1">
                  Play a quick game with AI.
                </p>
                <p className="text-gray-300 text-xs mt-2 leading-relaxed font-normal">
                  No multiplayer room required. Jump straight into casual, time-pass gameplay against 3 intelligent royal AI bots.
                </p>
              </div>

              {/* Features Pill List */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[11px] font-medium text-purple-200">
                  ⚡ 1 Human + 3 AI Bots
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[11px] font-medium text-purple-200">
                  🎯 Classic Points Mode
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[11px] font-medium text-purple-200">
                  ⏱️ Zero Wait Time
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-purple-900/60">
              <button
                onClick={onSelectOffline}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] group-hover:shadow-[0_0_35px_rgba(255,215,0,0.8)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PLAY OFFLINE</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* CARD 2: PLAY WITH FRIENDS */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-[#14082B]/90 hover:bg-[#1A0A38] border-2 border-purple-500/40 hover:border-fuchsia-400 shadow-[0_10px_35px_rgba(0,0,0,0.7)] hover:shadow-[0_0_35px_rgba(192,38,211,0.35)] backdrop-blur-xl transition-all duration-300 overflow-hidden"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-fuchsia-600/15 rounded-full blur-2xl group-hover:bg-fuchsia-600/25 transition-all duration-300 pointer-events-none" />
            
            <div className="space-y-4">
              {/* Badge & Icon Header */}
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 p-0.5 shadow-[0_0_20px_rgba(192,38,211,0.5)]">
                  <div className="w-full h-full bg-[#170930] rounded-[14px] flex items-center justify-center text-fuchsia-400 group-hover:text-pink-300 transition-colors">
                    <Users className="w-7 h-7" />
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-fuchsia-400" />
                  Multiplayer
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-fuchsia-300 transition-colors flex items-center gap-2">
                  <span>👥 PLAY WITH FRIENDS</span>
                </h2>
                <p className="text-fuchsia-200/90 text-xs sm:text-sm font-semibold mt-1">
                  Create or join an online multiplayer game.
                </p>
                <p className="text-gray-300 text-xs mt-2 leading-relaxed font-normal">
                  Create private rooms, invite your friends with shareable room codes, chat with live voice & text, and compete on the global leaderboard.
                </p>
              </div>

              {/* Features Pill List */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[11px] font-medium text-purple-200">
                  🌐 Online Room Codes
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[11px] font-medium text-purple-200">
                  🎙️ Voice & Text Chat
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[11px] font-medium text-purple-200">
                  🏆 XP & Achievements
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-purple-900/60">
              <button
                onClick={onSelectOnline}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(192,38,211,0.5)] group-hover:shadow-[0_0_35px_rgba(236,72,153,0.8)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PLAY WITH FRIENDS</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* Quick Game Rules Footer Bar */}
        {onOpenGameInfo && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 w-full max-w-3xl bg-[#0D031F]/90 border border-purple-500/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl backdrop-blur-md"
          >
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-black text-[#FFD700] tracking-wider uppercase font-serif">
                GAME RULES & ROLE GUIDE
              </h4>
              <p className="text-[11px] text-gray-300 font-medium">
                Learn how Raja, Rani, Police & Thief work along with the points system.
              </p>
            </div>
            <button
              onClick={onOpenGameInfo}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-[#FFD700]/60 text-[#FFD700] text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>View Rules</span>
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
};

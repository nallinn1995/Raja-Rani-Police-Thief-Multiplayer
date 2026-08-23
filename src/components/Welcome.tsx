import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ShieldCheck, Instagram, Youtube, Facebook, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile } from './UserProfile';
import { configService, FullSystemConfig } from '../services/configService';

interface WelcomeProps {
  startGame: () => void;
  onOpenGameInfo?: () => void;
  onOpenAuth?: () => void;
  currentUser?: any;
  onLogout?: () => void;
  onOpenDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({
  startGame,
  onOpenGameInfo,
  onOpenAuth,
  currentUser,
  onLogout,
  onOpenDashboard,
  onOpenAdminDashboard,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<FullSystemConfig>(configService.getConfig());

  useEffect(() => {
    return configService.subscribe(setConfig);
  }, []);

  // IntersectionObserver for smooth scroll reveal animations
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elements = containerRef.current?.querySelectorAll('.scroll-reveal, .scroll-reveal-zoom');

    elements?.forEach((el) => observer.observe(el));

    return () => {
      elements?.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  // Handle Play Now click: opens Auth Modal if not logged in, or starts game if logged in
  const handlePlayNow = () => {
    if (!currentUser) {
      if (onOpenAuth) {
        onOpenAuth();
      }
    } else {
      startGame();
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#080320] text-[#F1ECEC] font-sans overflow-x-hidden relative selection:bg-[#782287] selection:text-white">
      
      {/* Pinned Sticky Header Navigation - ALWAYS VISIBLE ON SCROLL */}
      <header className="sticky top-0 z-50 w-full bg-[#080320]/95 backdrop-blur-md border-b border-[#3F1152]/70 shadow-2xl px-3 sm:px-8 md:px-12 py-2.5 sm:py-3 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Header Left: Crown Logo (section_centered_iimage.png) */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img 
              src="/assets/images/Landing Page/section_centered_iimage.png" 
              alt="Raja Rani Police Thief Logo" 
              className="h-9 sm:h-12 md:h-14 lg:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_16px_rgba(172,65,215,0.4)]"
            />
          </div>

          {/* Header Right: Game Info & Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-4 flex-nowrap flex-shrink-0">
            <button
              onClick={() => {
                if (onOpenGameInfo) {
                  onOpenGameInfo();
                } else {
                  sessionStorage.setItem("appState", "game-info");
                  window.location.reload();
                }
              }}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-1.5 sm:py-2 bg-[#0c0524]/90 hover:bg-[#21073F] border border-[#FBE278]/70 rounded-full text-[11px] sm:text-xs md:text-sm font-bold text-[#FBE278] hover:text-white shadow-[0_0_12px_rgba(251,226,120,0.2)] hover:shadow-[0_0_20px_rgba(251,226,120,0.4)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
              title="Game Rules & Info"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FBE278]" />
              <span>Game Info</span>
            </button>

            {currentUser ? (
              <UserProfile
                user={currentUser}
                onLogout={onLogout || (() => {})}
                onOpenDashboard={onOpenDashboard || (() => {})}
                onOpenAdminDashboard={onOpenAdminDashboard}
              />
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth();
                  }
                }}
                className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-[#AC41D7] via-[#9B2ECB] to-[#782287] hover:opacity-95 text-white font-bold text-[11px] sm:text-xs md:text-sm rounded-full shadow-[0_0_16px_rgba(172,65,215,0.5)] hover:shadow-[0_0_24px_rgba(172,65,215,0.8)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO SECTION & FEATURE PILL BAR (BACKGROUND VIDEO SCOPED STRICTLY TO THIS SECTION ONLY) */}
      <section className="relative w-full overflow-hidden min-h-[calc(100vh-70px)] flex flex-col justify-between pt-2 sm:pt-4 pb-8 sm:pb-10 border-b border-[#3F1152]/50">
        
        {/* Background Video Scoped Strictly to Section 1 */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-95 scale-100 filter brightness-[1.15] contrast-[1.1] saturate-[1.1]"
          >
            <source src="/assets/images/Landing%20Page/section1_bg_video.mp4" type="video/mp4" />
            <source src="/assets/images/Landing Page/section1_bg_video.mp4" type="video/mp4" />
          </video>

          {/* Light Vignette Gradient for Section 1 Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080320]/50 via-transparent to-[#080320]/85" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[350px] bg-gradient-to-b from-[#782287]/20 via-[#AC41D7]/10 to-transparent blur-3xl rounded-full" />

          {/* Animated Ambient Particles */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-[#FBE278] animate-pulse"
                style={{
                  width: Math.random() * 2 + 1 + 'px',
                  height: Math.random() * 2 + 1 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animationDuration: Math.random() * 4 + 2 + 's',
                  animationDelay: Math.random() * 3 + 's',
                  opacity: Math.random() * 0.7 + 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Section 1 Main Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 w-full flex flex-col justify-between my-auto space-y-6">
          
          {/* Centered Hero Content Block */}
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center space-y-3 pt-2">
            
            {/* Crown Icon + 3D Logo Header Image with Framer Motion Entrance & Floating Animation */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.85, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-[180px] sm:w-[260px] md:w-[300px] max-w-full mx-auto p-3 sm:p-4"
            >
              <motion.img 
                src="/assets/images/Landing Page/section_centered_iimage.png" 
                alt="Raja Rani Police Thief Crown Title" 
                className="w-full h-auto object-contain drop-shadow-[0_0_30px_rgba(172,65,215,0.6)] select-none cursor-pointer p-1"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.97 }}
              />
            </motion.div>

            {/* Tagline 1: Gold Bold Statement */}
            <h2 className="text-[11px] sm:text-sm md:text-base font-extrabold uppercase tracking-wider text-[#FBE278] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-lg leading-snug px-2 whitespace-pre-line">
              {config.screenTexts?.welcome?.heroTitle || "THE CLASSIC PLAYGROUND GAME,\nNOW A THRILLING DIGITAL SHOWDOWN!"}
            </h2>

            {/* Tagline 2: Descriptive Subtext */}
            <p className="text-[11px] sm:text-xs text-white max-w-sm mx-auto font-medium px-4 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {config.screenTexts?.welcome?.heroSubtext || "Strategy, bluff and deduction come together in this timeless game of kingdoms and secrets."}
            </p>

            {/* Interactive PLAY NOW Button with Backlight Ambient Glow */}
            <div 
              onClick={handlePlayNow}
              className="relative group/btn cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 pt-1 pb-1"
              role="button"
              tabIndex={0}
              title="Click to Play Now!"
            >
              {/* Backlight Ambient Radial Glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#EB9C09]/50 via-[#F9C933]/80 to-[#EB9C09]/50 blur-lg opacity-80 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all duration-300 animate-pulse pointer-events-none" />

              {/* PLAY NOW Image Asset */}
              <img 
                src="/assets/images/Landing Page/play_now_button.png" 
                alt="PLAY NOW" 
                className="w-40 sm:w-52 md:w-56 h-auto object-contain relative z-10 drop-shadow-[0_0_18px_rgba(249,201,51,0.85)] group-hover/btn:drop-shadow-[0_0_30px_rgba(251,226,120,1)] transition-all duration-300 p-0.5"
              />
            </div>

            {/* Quick Feature Subtext */}
            <p className="text-[10px] sm:text-[11px] text-white/95 tracking-wide font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {config.screenTexts?.welcome?.featureSubtext || "Quick Match • No Download • Play Anywhere"}
            </p>
          </div>

          {/* Bottom Feature Pill Bar (Section 1 Bottom Container) */}
          <div className="w-full max-w-4xl mx-auto mt-4">
            <div className="w-full bg-[#21073F]/90 backdrop-blur-md border border-[#3F1152] hover:border-[#AC41D7]/50 rounded-2xl sm:rounded-full px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-[0_0_25px_rgba(33,7,63,0.8)] transition-all duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#3F1152]">
                
                {/* Item 1: 4 - 6 PLAYERS */}
                <div className="flex items-center justify-center space-x-2 sm:space-x-2.5 p-1.5 md:px-3">
                  <img 
                    src="/assets/images/Landing Page/members.png" 
                    alt="Players Icon" 
                    className="w-5 h-5 sm:w-7 sm:h-7 object-contain filter drop-shadow-[0_0_6px_rgba(39,185,232,0.6)]"
                  />
                  <div className="text-left">
                    <div className="text-[11px] sm:text-xs font-extrabold text-[#FBE278] tracking-wider leading-none">
                      4 – 6
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-[#C2A6B9] tracking-wider mt-0.5">
                      PLAYERS
                    </div>
                  </div>
                </div>

                {/* Item 2: MULTIPLAYER ONLINE */}
                <div className="flex items-center justify-center space-x-2 sm:space-x-2.5 p-1.5 md:px-3 pt-3 md:pt-1.5">
                  <img 
                    src="/assets/images/Landing Page/globe.png" 
                    alt="Multiplayer Icon" 
                    className="w-5 h-5 sm:w-7 sm:h-7 object-contain filter drop-shadow-[0_0_6px_rgba(235,156,9,0.6)]"
                  />
                  <div className="text-left">
                    <div className="text-[11px] sm:text-xs font-extrabold text-[#FBE278] tracking-wider leading-none">
                      MULTIPLAYER
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-[#C2A6B9] tracking-wider mt-0.5">
                      ONLINE
                    </div>
                  </div>
                </div>

                {/* Item 3: QUICK MATCH FAST & FUN */}
                <div className="flex items-center justify-center space-x-2 sm:space-x-2.5 p-1.5 md:px-3 pt-3 md:pt-1.5">
                  <img 
                    src="/assets/images/Landing Page/Thunder.png" 
                    alt="Quick Match Icon" 
                    className="w-5 h-5 sm:w-7 sm:h-7 object-contain filter drop-shadow-[0_0_6px_rgba(249,201,51,0.7)]"
                  />
                  <div className="text-left">
                    <div className="text-[11px] sm:text-xs font-extrabold text-[#FBE278] tracking-wider leading-none">
                      QUICK MATCH
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-[#C2A6B9] tracking-wider mt-0.5">
                      FAST & FUN
                    </div>
                  </div>
                </div>

                {/* Item 4: FAIR PLAY 100% SECURE */}
                <div className="flex items-center justify-center space-x-2 sm:space-x-2.5 p-1.5 md:px-3 pt-3 md:pt-1.5">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#3F1152] border border-[#27B9E8]/60 flex items-center justify-center shadow-[0_0_8px_rgba(39,185,232,0.4)]">
                    <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-[#27B9E8]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] sm:text-xs font-extrabold text-[#FBE278] tracking-wider leading-none">
                      FAIR PLAY
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-[#C2A6B9] tracking-wider mt-0.5">
                      100% SECURE
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: WHY YOU'LL LOVE IT? (SEPARATE SECTION WITH --bg-secondary / #14072E BACKGROUND) */}
      <section className="relative w-full bg-[#14072E] py-8 sm:py-10 px-3 sm:px-6 md:px-8 z-10 border-t border-[#3F1152]/60">
        <div className="max-w-6xl mx-auto">
          
          {/* Section Header with Left & Right Flourish Decors */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-5 sm:mb-6">
            <img 
              src="/assets/images/Landing Page/left_decor.png" 
              alt="Decoration Left" 
              className="w-20 sm:w-36 md:w-[13rem] h-auto object-contain select-none opacity-90"
            />
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FBE278] font-serif tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {config.screenTexts?.welcome?.whyLoveTitle || "Why You'll Love It?"}
            </h3>
            <img 
              src="/assets/images/Landing Page/righ_decor.png" 
              alt="Decoration Right" 
              className="w-20 sm:w-36 md:w-[13rem] h-auto object-contain select-none opacity-90"
            />
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Card 1: CLASSIC FUN */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#782287]/50 hover:border-[#AC41D7] rounded-2xl p-5 sm:p-7 flex flex-col items-center text-center shadow-[0_0_20px_rgba(120,34,135,0.25)] hover:shadow-[0_0_35px_rgba(172,65,215,0.6)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-[#AC41D7]/15 blur-lg group-hover:bg-[#AC41D7]/30 transition-all duration-300 pointer-events-none" />
                <motion.img 
                  src="/assets/images/Landing Page/cards.png" 
                  alt="Classic Fun Cards" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(172,65,215,0.5)]"
                  animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
                  transition={{ duration: 3.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-base font-extrabold text-[#FBE278] uppercase tracking-wider mb-2">
                CLASSIC FUN
              </h4>
              <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-[200px]">
                The childhood game you know and love, digitized perfectly.
              </p>

              {/* Decorative Gradient Line below text */}
              <div className="w-9 h-1 rounded-full bg-gradient-to-r from-[#FBE278] via-[#EB9C09] to-[#AC41D7] mt-4 opacity-90 shadow-[0_0_8px_rgba(251,226,120,0.5)]" />
            </motion.div>

            {/* Card 2: SOCIAL & FUN */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#782287]/50 hover:border-[#AC41D7] rounded-2xl p-5 sm:p-7 flex flex-col items-center text-center shadow-[0_0_20px_rgba(120,34,135,0.25)] hover:shadow-[0_0_35px_rgba(172,65,215,0.6)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-[#E85BCF]/15 blur-lg group-hover:bg-[#E85BCF]/30 transition-all duration-300 pointer-events-none" />
                <motion.img 
                  src="/assets/images/Landing Page/people.png" 
                  alt="Social & Fun People" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(232,91,207,0.5)]"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-base font-extrabold text-[#FBE278] uppercase tracking-wider mb-2">
                SOCIAL & FUN
              </h4>
              <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-[200px]">
                Play with friends, chat, laugh and make memories together.
              </p>

              {/* Decorative Gradient Line below text */}
              <div className="w-9 h-1 rounded-full bg-gradient-to-r from-[#FBE278] via-[#EB9C09] to-[#AC41D7] mt-4 opacity-90 shadow-[0_0_8px_rgba(251,226,120,0.5)]" />
            </motion.div>

            {/* Card 3: STRATEGY & SKILL */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#782287]/50 hover:border-[#AC41D7] rounded-2xl p-5 sm:p-7 flex flex-col items-center text-center shadow-[0_0_20px_rgba(120,34,135,0.25)] hover:shadow-[0_0_35px_rgba(172,65,215,0.6)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-[#27B9E8]/15 blur-lg group-hover:bg-[#27B9E8]/30 transition-all duration-300 pointer-events-none" />
                <motion.img 
                  src="/assets/images/Landing Page/brain.png" 
                  alt="Strategy & Skill Brain" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(39,185,232,0.5)]"
                  animate={{ scale: [1, 1.06, 1], rotate: [-3, 3, -3] }}
                  transition={{ duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-base font-extrabold text-[#FBE278] uppercase tracking-wider mb-2">
                STRATEGY & SKILL
              </h4>
              <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-[200px]">
                Outsmart your friends with clever moves and quick thinking.
              </p>

              {/* Decorative Gradient Line below text */}
              <div className="w-9 h-1 rounded-full bg-gradient-to-r from-[#FBE278] via-[#EB9C09] to-[#AC41D7] mt-4 opacity-90 shadow-[0_0_8px_rgba(251,226,120,0.5)]" />
            </motion.div>

            {/* Card 4: COMPETE & WIN */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#782287]/50 hover:border-[#AC41D7] rounded-2xl p-5 sm:p-7 flex flex-col items-center text-center shadow-[0_0_20px_rgba(120,34,135,0.25)] hover:shadow-[0_0_35px_rgba(172,65,215,0.6)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-[#FBE278]/20 blur-lg group-hover:bg-[#FBE278]/35 transition-all duration-300 pointer-events-none" />
                <motion.img 
                  src="/assets/images/Landing Page/trophy.png" 
                  alt="Compete & Win Trophy" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain relative z-10 filter drop-shadow-[0_0_12px_rgba(251,226,120,0.6)]"
                  animate={{ y: [0, -6, 0], rotate: [0, 4, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-base font-extrabold text-[#FBE278] uppercase tracking-wider mb-2">
                COMPETE & WIN
              </h4>
              <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-[200px]">
                Climb the leaderboards, earn rewards and be the champion.
              </p>

              {/* Decorative Gradient Line below text */}
              <div className="w-9 h-1 rounded-full bg-gradient-to-r from-[#FBE278] via-[#EB9C09] to-[#AC41D7] mt-4 opacity-90 shadow-[0_0_8px_rgba(251,226,120,0.5)]" />
            </motion.div>

          </div>
        </div>
      </section>

      {/* SECTION 3: MEET THE CHARACTERS */}
      <section className="relative w-full bg-[#080320] py-8 sm:py-10 px-3 sm:px-6 md:px-8 z-10 border-t border-[#3F1152]/60">
        <div className="max-w-7xl mx-auto">
          
          {/* Section Header with Left & Right Flourish Decors */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-5 sm:mb-6">
            <img 
              src="/assets/images/Landing Page/left_decor.png" 
              alt="Decoration Left" 
              className="w-20 sm:w-36 md:w-[13rem] h-auto object-contain select-none opacity-90"
            />
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FBE278] font-serif tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {config.screenTexts?.welcome?.charactersTitle || "Meet the Characters"}
            </h3>
            <img 
              src="/assets/images/Landing Page/righ_decor.png" 
              alt="Decoration Right" 
              className="w-20 sm:w-36 md:w-[13rem] h-auto object-contain select-none opacity-90"
            />
          </div>

          {/* 6 Character Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
            
            {/* Card 1: RAJA */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#EB9C09]/50 hover:border-[#FBE278] rounded-2xl p-3.5 sm:p-5 flex flex-col items-center text-center shadow-[0_0_15px_rgba(235,156,9,0.2)] hover:shadow-[0_0_30px_rgba(251,226,120,0.55)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-full h-28 sm:h-36 mb-3 flex items-center justify-center relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-[#EB9C09]/10 group-hover:bg-[#EB9C09]/25 transition-all duration-300 pointer-events-none rounded-xl" />
                <motion.img 
                  src="/assets/images/Landing Page/raja.png" 
                  alt="Raja" 
                  className="w-auto h-full max-h-28 sm:max-h-36 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(235,156,9,0.5)]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-lg font-extrabold text-[#FBE278] tracking-wide mb-0.5">
                Raja
              </h4>
              <div className="text-[9px] sm:text-xs font-bold text-[#EB9C09] uppercase tracking-wider mb-1.5 sm:mb-2">
                THE DECIDER
              </div>
              <p className="text-[10px] sm:text-xs text-white/90 font-medium leading-relaxed">
                Holds all the power. The game can't start without His Majesty.
              </p>
            </motion.div>

            {/* Card 2: RANI */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#E85BCF]/50 hover:border-[#E85BCF] rounded-2xl p-3.5 sm:p-5 flex flex-col items-center text-center shadow-[0_0_15px_rgba(232,91,207,0.2)] hover:shadow-[0_0_30px_rgba(232,91,207,0.55)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-full h-28 sm:h-36 mb-3 flex items-center justify-center relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-[#E85BCF]/10 group-hover:bg-[#E85BCF]/25 transition-all duration-300 pointer-events-none rounded-xl" />
                <motion.img 
                  src="/assets/images/Landing Page/rani.png" 
                  alt="Rani" 
                  className="w-auto h-full max-h-28 sm:max-h-36 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(232,91,207,0.5)]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-lg font-extrabold text-[#E85BCF] tracking-wide mb-0.5">
                Rani
              </h4>
              <div className="text-[9px] sm:text-xs font-bold text-[#E85BCF]/80 uppercase tracking-wider mb-1.5 sm:mb-2">
                THE MYSTERY
              </div>
              <p className="text-[10px] sm:text-xs text-white/90 font-medium leading-relaxed">
                The only one the Raja truly trusts. A silent but critical observer.
              </p>
            </motion.div>

            {/* Card 3: POLICE */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#27B9E8]/50 hover:border-[#27B9E8] rounded-2xl p-3.5 sm:p-5 flex flex-col items-center text-center shadow-[0_0_15px_rgba(39,185,232,0.2)] hover:shadow-[0_0_30px_rgba(39,185,232,0.55)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-full h-28 sm:h-36 mb-3 flex items-center justify-center relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-[#27B9E8]/10 group-hover:bg-[#27B9E8]/25 transition-all duration-300 pointer-events-none rounded-xl" />
                <motion.img 
                  src="/assets/images/Landing Page/police.png" 
                  alt="Police" 
                  className="w-auto h-full max-h-28 sm:max-h-36 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(39,185,232,0.5)]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-lg font-extrabold text-[#27B9E8] tracking-wide mb-0.5">
                Police
              </h4>
              <div className="text-[9px] sm:text-xs font-bold text-[#27B9E8]/80 uppercase tracking-wider mb-1.5 sm:mb-2">
                THE INVESTIGATOR
              </div>
              <p className="text-[10px] sm:text-xs text-white/90 font-medium leading-relaxed">
                The one who brings justice. Can they spot the rogue in the lineup?
              </p>
            </motion.div>

            {/* Card 4: THIEF */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#36D978]/50 hover:border-[#36D978] rounded-2xl p-3.5 sm:p-5 flex flex-col items-center text-center shadow-[0_0_15px_rgba(54,217,120,0.2)] hover:shadow-[0_0_30px_rgba(54,217,120,0.55)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-full h-28 sm:h-36 mb-3 flex items-center justify-center relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-[#36D978]/10 group-hover:bg-[#36D978]/25 transition-all duration-300 pointer-events-none rounded-xl" />
                <motion.img 
                  src="/assets/images/Landing Page/thief.png" 
                  alt="Thief" 
                  className="w-auto h-full max-h-28 sm:max-h-36 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(54,217,120,0.5)]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.3, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-lg font-extrabold text-[#36D978] tracking-wide mb-0.5">
                Thief
              </h4>
              <div className="text-[9px] sm:text-xs font-bold text-[#36D978]/80 uppercase tracking-wider mb-1.5 sm:mb-2">
                THE SNEAKY ONE
              </div>
              <p className="text-[10px] sm:text-xs text-white/90 font-medium leading-relaxed">
                Their only job is to hide in plain sight. Keep your cool!
              </p>
            </motion.div>

            {/* Card 5: MANTRI */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#AC41D7]/50 hover:border-[#AC41D7] rounded-2xl p-3.5 sm:p-5 flex flex-col items-center text-center shadow-[0_0_15px_rgba(172,65,215,0.2)] hover:shadow-[0_0_30px_rgba(172,65,215,0.55)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-full h-28 sm:h-36 mb-3 flex items-center justify-center relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-[#AC41D7]/10 group-hover:bg-[#AC41D7]/25 transition-all duration-300 pointer-events-none rounded-xl" />
                <motion.img 
                  src="/assets/images/Landing Page/mantri.png" 
                  alt="Mantri" 
                  className="w-auto h-full max-h-28 sm:max-h-36 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(172,65,215,0.5)]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-lg font-extrabold text-[#AC41D7] tracking-wide mb-0.5">
                Mantri
              </h4>
              <div className="text-[9px] sm:text-xs font-bold text-[#AC41D7]/80 uppercase tracking-wider mb-1.5 sm:mb-2">
                THE ADVISOR
              </div>
              <p className="text-[10px] sm:text-xs text-white/90 font-medium leading-relaxed">
                A wise guardian of the kingdom with a secret strategy.
              </p>
            </motion.div>

            {/* Card 6: VILLAGER */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#AA521B]/50 hover:border-[#FBE278] rounded-2xl p-3.5 sm:p-5 flex flex-col items-center text-center shadow-[0_0_15px_rgba(170,82,27,0.2)] hover:shadow-[0_0_30px_rgba(251,226,120,0.55)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-full h-28 sm:h-36 mb-3 flex items-center justify-center relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-[#AA521B]/10 group-hover:bg-[#AA521B]/25 transition-all duration-300 pointer-events-none rounded-xl" />
                <motion.img 
                  src="/assets/images/Landing Page/villager.png" 
                  alt="Villager" 
                  className="w-auto h-full max-h-28 sm:max-h-36 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(170,82,27,0.5)]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <h4 className="text-sm sm:text-lg font-extrabold text-[#FBE278] tracking-wide mb-0.5">
                Villager
              </h4>
              <div className="text-[9px] sm:text-xs font-bold text-[#AA521B] uppercase tracking-wider mb-1.5 sm:mb-2">
                THE COMMONER
              </div>
              <p className="text-[10px] sm:text-xs text-white/90 font-medium leading-relaxed">
                A simple citizen with instincts that can change the game.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SECTION 4: GAME MODES */}
      <section className="relative w-full bg-[#14072E] py-8 sm:py-10 px-3 sm:px-6 md:px-8 z-10 border-t border-[#3F1152]/60">
        <div className="max-w-6xl mx-auto">
          
          {/* Section Header with Left & Right Flourish Decors */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-5 sm:mb-6">
            <img 
              src="/assets/images/Landing Page/left_decor.png" 
              alt="Decoration Left" 
              className="w-20 sm:w-36 md:w-[13rem] h-auto object-contain select-none opacity-90"
            />
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FBE278] font-serif tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {config.screenTexts?.welcome?.gameModesTitle || "Game Modes"}
            </h3>
            <img 
              src="/assets/images/Landing Page/righ_decor.png" 
              alt="Decoration Right" 
              className="w-20 sm:w-36 md:w-[13rem] h-auto object-contain select-none opacity-90"
            />
          </div>

          {/* 3 Game Mode Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Mode 1: CLASSIC MODE */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#EB9C09]/50 hover:border-[#FBE278] rounded-2xl p-4 sm:p-6 flex flex-row items-center space-x-3.5 sm:space-x-4 shadow-[0_0_20px_rgba(235,156,9,0.2)] hover:shadow-[0_0_35px_rgba(251,226,120,0.6)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-[#EB9C09]/15 blur-lg group-hover:bg-[#EB9C09]/30 transition-all duration-300 pointer-events-none" />
                <motion.img 
                  src="/assets/images/Landing Page/crown.png" 
                  alt="Classic Mode Crown" 
                  className="w-9 h-9 sm:w-12 sm:h-12 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(235,156,9,0.6)]"
                  animate={{ y: [0, -5, 0], rotate: [-3, 3, -3] }}
                  transition={{ duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <div className="text-left flex-1">
                <h4 className="text-xs sm:text-base font-extrabold text-[#FBE278] uppercase tracking-wider mb-1">
                  CLASSIC MODE
                </h4>
                <p className="text-[11px] sm:text-sm text-white/90 font-medium leading-relaxed">
                  The traditional game you grew up with. Pure strategy, trust and fun.
                </p>
              </div>
            </motion.div>

            {/* Mode 2: DETECTIVE CHALLENGE */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#27B9E8]/50 hover:border-[#27B9E8] rounded-2xl p-4 sm:p-6 flex flex-row items-center space-x-3.5 sm:space-x-4 shadow-[0_0_20px_rgba(39,185,232,0.2)] hover:shadow-[0_0_35px_rgba(39,185,232,0.6)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-[#27B9E8]/15 blur-lg group-hover:bg-[#27B9E8]/30 transition-all duration-300 pointer-events-none" />
                <motion.img 
                  src="/assets/images/Landing Page/glass.png" 
                  alt="Detective Challenge Magnifying Glass" 
                  className="w-9 h-9 sm:w-12 sm:h-12 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(39,185,232,0.6)]"
                  animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <div className="text-left flex-1">
                <h4 className="text-xs sm:text-base font-extrabold text-[#27B9E8] uppercase tracking-wider mb-1">
                  DETECTIVE CHALLENGE
                </h4>
                <p className="text-[11px] sm:text-sm text-white/90 font-medium leading-relaxed">
                  Find the culprit using clues, evidence and your detective skills.
                </p>
              </div>
            </motion.div>

            {/* Mode 3: MODERN MODE */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-[#21073F]/95 via-[#190632]/95 to-[#14072E]/95 border border-[#36D978]/50 hover:border-[#36D978] rounded-2xl p-4 sm:p-6 flex flex-row items-center space-x-3.5 sm:space-x-4 shadow-[0_0_20px_rgba(54,217,120,0.2)] hover:shadow-[0_0_35px_rgba(54,217,120,0.6)] transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-[#36D978]/15 blur-lg group-hover:bg-[#36D978]/30 transition-all duration-300 pointer-events-none" />
                <motion.img 
                  src="/assets/images/Landing Page/castle.png" 
                  alt="Modern Mode Castle" 
                  className="w-9 h-9 sm:w-12 sm:h-12 object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(54,217,120,0.6)]"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              <div className="text-left flex-1">
                <h4 className="text-xs sm:text-base font-extrabold text-[#36D978] uppercase tracking-wider mb-1">
                  MODERN MODE
                </h4>
                <p className="text-[11px] sm:text-sm text-white/90 font-medium leading-relaxed">
                  An advanced multiplayer experience with unique roles and twists.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SECTION 5: READY TO RULE THE KINGDOM? (CTA BANNER) */}
      <section className="relative w-full bg-[#080320] py-8 sm:py-12 px-3 sm:px-6 md:px-8 z-10 border-t border-[#3F1152]/60">
        <div className="max-w-6xl mx-auto">
          
          {/* CTA Banner Card Container */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-gradient-to-r from-[#21073F]/95 via-[#190632]/95 to-[#21073F]/95 border border-[#782287]/60 hover:border-[#AC41D7] rounded-3xl p-5 sm:p-8 md:p-10 shadow-[0_0_35px_rgba(172,65,215,0.4)] hover:shadow-[0_0_50px_rgba(172,65,215,0.7)] transition-all duration-300 overflow-hidden"
          >
            {/* Ambient Background Glow Spotlights */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-[#EB9C09]/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-48 h-48 bg-[#AC41D7]/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
              
              {/* Left Flank Graphic: Treasure Chest */}
              <div className="w-36 sm:w-52 md:w-64 lg:w-80 max-w-full h-auto flex-shrink-0 flex items-center justify-center">
                <motion.img 
                  src="/assets/images/Landing Page/treasure.png" 
                  alt="Treasure Chest" 
                  className="w-full h-auto object-contain filter drop-shadow-[0_0_24px_rgba(235,156,9,0.65)]"
                  animate={{ y: [0, -7, 0], rotate: [-2, 2, -2] }}
                  transition={{ duration: 3.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

              {/* Center Content: Title, Subtext & Play Button */}
              <div className="flex-1 text-center flex flex-col items-center space-y-2.5 sm:space-y-3 max-w-xl">
                <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#FBE278] font-serif tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {config.screenTexts?.welcome?.ctaTitle || "READY TO RULE THE KINGDOM?"}
                </h3>
                
                <p className="text-[11px] sm:text-sm text-white font-medium max-w-md leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  Gather your friends and jump into the ultimate battle of wit, trust and deception!
                </p>

                {/* PLAY NOW Button with Backlight Ambient Glow */}
                <div 
                  onClick={handlePlayNow}
                  className="relative group/cta cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 pt-1 sm:pt-2"
                  role="button"
                  tabIndex={0}
                  title="Click to Play Now!"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#EB9C09]/50 via-[#F9C933]/80 to-[#EB9C09]/50 blur-lg opacity-80 group-hover/cta:opacity-100 group-hover/cta:scale-110 transition-all duration-300 animate-pulse pointer-events-none" />
                  
                  <img 
                    src="/assets/images/Landing Page/play_now_button.png" 
                    alt="PLAY NOW" 
                    className="w-36 sm:w-48 md:w-52 h-auto object-contain relative z-10 drop-shadow-[0_0_18px_rgba(249,201,51,0.85)] group-hover/cta:drop-shadow-[0_0_30px_rgba(251,226,120,1)] transition-all duration-300"
                  />
                </div>
              </div>

              {/* Right Flank Graphic: Royal Crown Cushion */}
              <div className="w-36 sm:w-52 md:w-64 lg:w-80 max-w-full h-auto flex-shrink-0 flex items-center justify-center">
                <motion.img 
                  src="/assets/images/Landing Page/crown_coins.png" 
                  alt="Royal Crown Cushion" 
                  className="w-full h-auto object-contain filter drop-shadow-[0_0_24px_rgba(172,65,215,0.65)]"
                  animate={{ y: [0, -7, 0], rotate: [2, -2, 2] }}
                  transition={{ duration: 3.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="relative w-full bg-[#080320] py-6 sm:py-8 px-3 sm:px-6 md:px-8 z-10 border-t border-[#3F1152]/40 text-center">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center space-y-3.5 sm:space-y-4">
          
          {/* Tagline */}
          <p className="text-xs sm:text-sm font-semibold text-white/90 flex items-center justify-center gap-1.5">
            Made with <span className="text-red-500 animate-pulse text-sm">❤️</span> for '90s kids
          </p>

          {/* Social Media Links */}
          <div className="flex items-center space-x-3 sm:space-x-3.5">
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-[#21073F] border border-[#782287]/60 hover:border-[#AC41D7] flex items-center justify-center text-[#C2A6B9] hover:text-white shadow-[0_0_10px_rgba(120,34,135,0.3)] hover:shadow-[0_0_15px_rgba(172,65,215,0.6)] transition-all duration-200 transform hover:scale-110"
              title="Discord"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-[#21073F] border border-[#782287]/60 hover:border-[#AC41D7] flex items-center justify-center text-[#C2A6B9] hover:text-white shadow-[0_0_10px_rgba(120,34,135,0.3)] hover:shadow-[0_0_15px_rgba(172,65,215,0.6)] transition-all duration-200 transform hover:scale-110"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-[#21073F] border border-[#782287]/60 hover:border-[#AC41D7] flex items-center justify-center text-[#C2A6B9] hover:text-white shadow-[0_0_10px_rgba(120,34,135,0.3)] hover:shadow-[0_0_15px_rgba(172,65,215,0.6)] transition-all duration-200 transform hover:scale-110"
              title="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-[#21073F] border border-[#782287]/60 hover:border-[#AC41D7] flex items-center justify-center text-[#C2A6B9] hover:text-white shadow-[0_0_10px_rgba(120,34,135,0.3)] hover:shadow-[0_0_15px_rgba(172,65,215,0.6)] transition-all duration-200 transform hover:scale-110"
              title="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>

          {/* Copyright Notice */}
          <p className="text-[10px] sm:text-xs text-[#78779C] font-medium">
            © 2026 Raja Rani Police Thief. All rights reserved.
          </p>

        </div>
      </footer>

    </div>
  );
};

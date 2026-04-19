import React from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomeProps {
  startGame: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ startGame }) => {
  return (
    <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] text-white font-sans overflow-hidden relative">
      {/* Background Particles/Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 3 + 2 + 's',
              animationDelay: Math.random() * 2 + 's',
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 z-10">
        {/* Confetti Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none overflow-hidden">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 sm:w-3 sm:h-3 animate-fall transform rotate-45"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                backgroundColor: ['#fffc40', '#ff61b8', '#3498db', '#2ecc71', '#a855f7'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
        {/* Main Logo */}
        <div className="relative z-10 text-center mb-12">
          <div className="inline-block animate-float">
            <h1 className="flex flex-col items-center justify-center mb-6 pb-4">
              <span className="relative inline-block">
                <img 
                  src="/assets/crown1.png" 
                  className="absolute -top-5 sm:-top-8 md:-top-10 lg:-top-12 -left-2 sm:-left-4 md:-left-5 lg:-left-6 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 z-20 drop-shadow-md animate-orbit-slow pointer-events-none" 
                  alt="Crown" 
                />
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)] leading-tight block">
                  Raja Rani
                </span>
              </span>
              <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)] leading-tight block">
                Police Thief
              </span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-fuchsia-200 font-sans tracking-wide max-w-2xl mx-auto leading-relaxed px-4 text-center">
            The classic playground game, now a thrilling digital showdown.
          </p>
        </div>

        {/* CTA Button */}
        <button onClick={startGame} className="group relative z-10 px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-fuchsia-600 to-purple-600 border border-fuchsia-400 text-white text-xl sm:text-2xl font-bold rounded-full shadow-[0_0_40px_rgba(192,38,211,0.5)] transform hover:scale-105 active:scale-95 transition-all duration-300 animate-pulse-slow">
          <span className="relative z-10 flex items-center gap-3 tracking-wide">
            Start Game
            <Sparkles className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500 text-yellow-300" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </section>

      {/* Nostalgia Section */}
      <section className="relative py-20 px-6 bg-[#1D0C3A]/50 backdrop-blur-xl border-t border-b border-[#3A1C61] z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] mb-6 inline-block title-font text-center w-full">
              Remember the Rush?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 font-sans tracking-wide leading-relaxed max-w-3xl mx-auto px-4 text-center w-full">
              Before screens and streams, all you needed was four slips of paper and a group of friends.
               We've digitized that pure, unadulterated excitement. It's the same simple game you ruled the streets with, now ready for a new generation—or a nostalgic rematch!
            </p>
          </div>

          {/* Character Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Raja */}
            <div className="group relative bg-[#11052C] border border-[#5A2C81] rounded-3xl p-6 sm:p-8 shadow-[0_0_20px_rgba(250,204,21,0.1)] hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:-translate-y-2 transition-all duration-500 cursor-pointer">
              <div className="relative z-10">
                <div className="relative mb-4 sm:mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <img src="/assets/crown.png" className="w-20 h-20 sm:w-24 sm:h-24 object-contain animate-float drop-shadow-md" alt="Raja" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-yellow-500 mb-2 sm:mb-3 text-center tracking-wide">Raja</h3>
                <p className="text-xs sm:text-sm font-bold text-yellow-600 mb-2 text-center tracking-wider uppercase">The Decider</p>
                <p className="text-xs sm:text-sm text-gray-400 text-center leading-relaxed">Holds all the power. The game can't start without His Majesty.</p>
              </div>
            </div>

            {/* Rani */}
            <div className="group relative bg-[#11052C] border border-[#5A2C81] rounded-3xl p-6 sm:p-8 shadow-[0_0_20px_rgba(236,72,153,0.1)] hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:-translate-y-2 transition-all duration-500 cursor-pointer">
              <div className="relative z-10">
                <div className="relative mb-4 sm:mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <img src="/assets/queen.png" className="w-20 h-20 sm:w-24 sm:h-24 object-contain animate-float drop-shadow-md" style={{ animationDelay: '0.3s' }} alt="Rani" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-fuchsia-400 mb-2 sm:mb-3 text-center tracking-wide">Rani</h3>
                <p className="text-xs sm:text-sm font-bold text-pink-600 mb-2 text-center tracking-wider uppercase">The Mystery</p>
                <p className="text-xs sm:text-sm text-gray-400 text-center leading-relaxed">The only one the Raja truly trusts. A silent but critical observer.</p>
              </div>
            </div>

            {/* Police */}
             <div className="group relative bg-[#11052C] border border-[#5A2C81] rounded-3xl p-6 sm:p-8 shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-2 transition-all duration-500 cursor-pointer">
              <div className="relative z-10">
                <div className="relative mb-4 sm:mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <img src="/assets/police.png" className="w-20 h-20 sm:w-24 sm:h-24 object-contain animate-float drop-shadow-md" style={{ animationDelay: '0.6s' }} alt="Police" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-blue-400 mb-2 sm:mb-3 text-center tracking-wide">Police</h3>
                <p className="text-xs sm:text-sm font-bold text-blue-600 mb-2 text-center tracking-wider uppercase">The Investigator</p>
                <p className="text-xs sm:text-sm text-gray-400 text-center leading-relaxed">The one who brings justice. Can they spot the rogue in the lineup?</p>
              </div>
            </div>

            {/* Thief */}
             <div className="group relative bg-[#11052C] border border-[#5A2C81] rounded-3xl p-6 sm:p-8 shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:-translate-y-2 transition-all duration-500 cursor-pointer">
              <div className="relative z-10">
                <div className="relative mb-4 sm:mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <img src="/assets/robber.png" className="w-20 h-20 sm:w-24 sm:h-24 object-contain animate-float drop-shadow-md" style={{ animationDelay: '0.9s'}} alt="Thief" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-green-400 mb-2 sm:mb-3 text-center tracking-wide">Thief</h3>
                <p className="text-xs sm:text-sm font-bold text-green-600 mb-2 text-center tracking-wider uppercase">The Sneaky One</p>
                <p className="text-xs sm:text-sm text-gray-400 text-center leading-relaxed">Their only job is to hide in plain sight. Keep your cool!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 bg-[#0A0217] z-10">
        <div className="max-w-4xl mx-auto text-center font-sans tracking-wide">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 px-4 text-fuchsia-200">
            <span className="text-lg sm:text-xl text-center">Made with</span>
            <span className="text-xl sm:text-2xl text-red-500 animate-heartbeat">❤️</span>
            <span className="text-lg sm:text-xl text-center">for '90s kids</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 px-4">
            <span>© 2026 Raja Rani Police Thief. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Crown, Sparkles, Shield, Eye, Volume2, VolumeX } from 'lucide-react';
import { useState, useRef } from 'react';

interface WelcomeProps {
  startGame: () => void;
}


export const Welcome: React.FC<WelcomeProps> = ({ startGame}) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 animate-bounce-slow">
          <Crown className="w-24 h-24 text-yellow-600" />
        </div>
        <div className="absolute top-32 right-20 animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
          <Sparkles className="w-20 h-20 text-pink-600" />
        </div>
        <div className="absolute bottom-32 left-32 animate-bounce-slow" style={{ animationDelay: '1s' }}>
          <Shield className="w-28 h-28 text-blue-600" />
        </div>
        <div className="absolute bottom-20 right-40 animate-bounce-slow" style={{ animationDelay: '1.5s' }}>
          <Eye className="w-24 h-24 text-green-600" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {/* Confetti Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Main Logo */}
        <div className="relative z-10 text-center mb-12">
          <div className="inline-block animate-float">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6">
              <span className="text-yellow-500 drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)] inline-block animate-wiggle" style={{ animationDelay: '0s' }}>Raja</span>
              {' '}
              <span className="text-pink-500 drop-shadow-[0_4px_12px_rgba(236,72,153,0.5)] inline-block animate-wiggle" style={{ animationDelay: '0.2s' }}>Rani</span>
              <br />
              <span className="text-blue-500 drop-shadow-[0_4px_12px_rgba(59,130,246,0.5)] inline-block animate-wiggle" style={{ animationDelay: '0.4s' }}>Police</span>
              {' '}
              <span className="text-green-500 drop-shadow-[0_4px_12px_rgba(34,197,94,0.5)] inline-block animate-wiggle" style={{ animationDelay: '0.6s' }}>Thief</span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed px-4">
            The classic playground game, now a thrilling digital showdown.
          </p>
        </div>

        {/* CTA Button */}
        <button onClick={startGame} className="group relative z-10 px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xl sm:text-2xl font-bold rounded-full shadow-2xl hover:shadow-[0_20px_60px_rgba(239,68,68,0.5)] transform hover:scale-105 active:scale-95 transition-all duration-300 animate-pulse-slow">
          <span className="relative z-10 flex items-center gap-3">
            Start Game
            <Sparkles className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </section>

      {/* Nostalgia Section */}
      <section className="relative py-20 px-6 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-800 mb-6 inline-block">
              Remember the Rush?
              <div className="h-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 rounded-full mt-2" />
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto px-4">
              Before screens and streams, all you needed was four slips of paper and a group of friends.
              Remember the tension as the <span className="font-bold text-blue-500">Police</span> tried to find the <span className="font-bold text-green-500">Thief</span>?
              The power of the <span className="font-bold text-yellow-500">Raja</span>?
              The secrecy of the <span className="font-bold text-pink-500">Rani</span>?
              We've digitized that pure, unadulterated excitement. It\'s the same simple game you ruled the streets with,
              now ready for a new generation—or a nostalgic rematch!
            </p>
          </div>

          {/* Character Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Raja */}
            <div className="group relative bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer perspective-1000">
              <div className="absolute inset-0 bg-yellow-300 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-br from-yellow-300 to-yellow-700 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="relative mb-4 sm:mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full blur-2xl opacity-60 animate-pulse" />
                  <div className="relative transform group-hover:scale-110 group-hover:rotate-y-12 transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>
                    <span className="text-6xl sm:text-8xl block animate-float" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 60px rgba(250,204,21,0.5)' }}>🤴</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 text-center drop-shadow-lg">Raja</h3>
                <p className="text-xs sm:text-sm font-bold text-yellow-900 mb-2 text-center">The Decider</p>
                <p className="text-xs sm:text-sm text-yellow-100 text-center leading-relaxed">
                  Holds all the power. The game can't start without His Majesty.
                </p>
              </div>
            </div>

            {/* Rani */}
            <div className="group relative bg-gradient-to-br from-pink-400 to-pink-600 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer perspective-1000">
              <div className="absolute inset-0 bg-pink-300 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-br from-pink-300 to-pink-700 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="relative mb-4 sm:mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-pink-400 rounded-full blur-2xl opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="relative transform group-hover:scale-110 group-hover:rotate-y-12 transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>
                    <span className="text-6xl sm:text-8xl block animate-float" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 60px rgba(236,72,153,0.5)', animationDelay: '0.3s' }}>👸</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 text-center drop-shadow-lg">Rani</h3>
                <p className="text-xs sm:text-sm font-bold text-pink-900 mb-2 text-center">The Mystery</p>
                <p className="text-xs sm:text-sm text-pink-100 text-center leading-relaxed">
                  The only one the Raja truly trusts. A silent but critical observer.
                </p>
              </div>
            </div>

            {/* Police */}
            <div className="group relative bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer perspective-1000">
              <div className="absolute inset-0 bg-blue-300 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="relative mb-4 sm:mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400 rounded-full blur-2xl opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
                  <div className="relative transform group-hover:scale-110 group-hover:rotate-y-12 transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>
                    <span className="text-6xl sm:text-8xl block animate-float" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 60px rgba(59,130,246,0.5)', animationDelay: '0.6s' }}>👮</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 text-center drop-shadow-lg">Police</h3>
                <p className="text-xs sm:text-sm font-bold text-blue-900 mb-2 text-center">The Investigator</p>
                <p className="text-xs sm:text-sm text-blue-100 text-center leading-relaxed">
                  The one who brings justice. Can they spot the rogue in the lineup?
                </p>
              </div>
            </div>

            {/* Thief */}
            <div className="group relative bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer perspective-1000">
              <div className="absolute inset-0 bg-green-300 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-br from-green-300 to-green-700 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="relative mb-4 sm:mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-400 rounded-full blur-2xl opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }} />
                  <div className="relative transform group-hover:scale-110 group-hover:rotate-y-12 transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>
                    <span className="text-6xl sm:text-8xl block animate-float" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 60px rgba(34,197,94,0.5)', animationDelay: '0.9s' }}>🦹</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 text-center drop-shadow-lg">Thief</h3>
                <p className="text-xs sm:text-sm font-bold text-green-900 mb-2 text-center">The Sneaky One</p>
                <p className="text-xs sm:text-sm text-green-100 text-center leading-relaxed">
                  Their only job is to hide in plain sight. Keep your cool!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

     

      {/* Footer */}
      <footer className="relative py-12 px-6 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 px-4">
            <span className="text-lg sm:text-2xl text-center">Made with</span>
            <span className="text-2xl sm:text-3xl text-red-400 animate-heartbeat">❤️</span>
            <span className="text-lg sm:text-2xl text-center">for all the '90s kids who ruled the streets</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-purple-300 px-4">
            <div className="w-6 h-6 border-2 border-purple-300 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-300 rounded-full" />
            </div>
            <span>© 2025 Raja Rani Police Thief. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


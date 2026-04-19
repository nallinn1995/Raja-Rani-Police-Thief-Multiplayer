import React from 'react';
import { Sparkles, Star } from 'lucide-react';
import { PlayIcon, UsersIcon } from '@heroicons/react/24/solid';

interface HomePageProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onCreateRoom, onJoinRoom }) => {
  return (
    <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex flex-col items-center pt-[180px] pb-16 px-4 relative overflow-y-auto overflow-x-hidden text-white font-sans">
      {/* Background Particles/Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(40)].map((_, i) => (
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
      
      {/* Confetti graphics (CSS-only approximation) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[10%] left-[5%] w-4 h-4 bg-blue-500 rotate-45 transform"></div>
        <div className="absolute top-[20%] right-[10%] w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="absolute top-[15%] left-[80%] w-4 h-2 bg-yellow-400 rotate-12 transform"></div>
        <div className="absolute bottom-[20%] left-[15%] w-3 h-3 bg-green-400 rotate-45 transform"></div>
        <div className="absolute top-[40%] left-[90%] w-2 h-2 bg-pink-500 rounded-full"></div>
        <div className="absolute bottom-[10%] right-[20%] w-4 h-4 bg-purple-500 rotate-12 transform"></div>
      </div>

      <div className="max-w-lg w-full relative z-10 p-[2px] rounded-[2rem] bg-gradient-to-b from-yellow-400/50 via-purple-500/20 to-purple-900/40 shadow-[0_0_40px_rgba(147,51,234,0.3)]">
        <div className="bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] p-6 sm:p-8 border border-[#3A1C61] flex flex-col items-center">
          
          {/* Header Section */}
          <div className="text-center mb-8 relative w-full flex flex-col items-center">
            
            {/* Golden Sunburst Background */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] sunburst rounded-full animate-spin-slow mix-blend-screen pointer-events-none" style={{ WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)' }}></div>

            <div className="flex justify-center items-center gap-6 mb-2 absolute -top-16 left-0 right-0 z-20">
              <img src="/assets/trophy.png" className="w-14 h-14 drop-shadow-[0_0_15px_rgba(234,179,8,1)] -rotate-12" alt="Horn" />
              <div className="p-2 bg-gradient-to-b from-[#FFFDF2] via-[#FADE72] to-[#B8860B] rounded-full shadow-[0_0_25px_rgba(250,204,21,0.8)] border border-yellow-200">
                <img src="/assets/crown.png" className="w-12 h-12 drop-shadow-md" alt="Crown" />
              </div>
              <img src="/assets/trophy.png" className="w-14 h-14 drop-shadow-[0_0_15px_rgba(234,179,8,1)] rotate-12 transform scale-x-[-1]" alt="Horn" />
            </div>

            <div className="mt-10 relative z-10 w-full max-w-xs sm:max-w-sm flex flex-col items-center">
              
              {/* Back Ribbon Folds */}
              <div className="absolute top-8 -left-6 sm:-left-8 w-16 h-12 bg-gradient-to-b from-red-950 to-red-900 rounded-s-md shadow-2xl" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 25% 100%, 0 50%)' }}></div>
              <div className="absolute top-8 -right-6 sm:-right-8 w-16 h-12 bg-gradient-to-b from-red-950 to-red-900 rounded-e-md shadow-2xl" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 75% 100%, 0 100%)' }}></div>
              
              {/* Main Red Ribbon Box */}
              <div className="relative bg-gradient-to-b from-red-600 via-red-700 to-red-900 w-full rounded-lg shadow-2xl border-t border-b border-t-yellow-300 border-b-yellow-500 p-1">
                {/* Inner Border Line */}
                <div className="border border-yellow-500/50 rounded-lg px-4 py-2 sm:py-3 shadow-inner bg-gradient-to-b from-red-500/10 to-red-900/50">
                  <h1 className="relative text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] text-center title-font tracking-wide py-1" style={{ filter: 'drop-shadow(3px 3px 2px rgba(0,0,0,0.8)) stroke(1px #4a3000)' }}>
                    Raja Rani
                  </h1>
                </div>
              </div>
              
              <div className="relative z-10 flex items-center justify-center gap-3 mt-4 w-full">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Police Thief</h2>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              
              <div className="relative mt-2 flex justify-center w-full">
                 <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
              </div>
              
            </div>
            
            <p className="text-gray-300 mt-5 text-sm font-medium tracking-wide z-10 drop-shadow-md">A thrilling multiplayer card game for 4 players</p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-4 mb-8">
            <button
              onClick={onCreateRoom}
              className="w-full relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative w-full bg-gradient-to-r from-[#7B1FA2] to-[#4A148C] border border-[#9C27B0]/50 hover:from-[#8E24AA] hover:to-[#6A1B9A] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center space-x-3 shadow-xl">
                <img src="/assets/crown.png" className="w-6 h-6" alt="Crown" />
                <UsersIcon className="w-6 h-6 text-fuchsia-300" />
                <span className="text-xl tracking-wide">Create Room</span>
              </div>
            </button>
            
            <button
              onClick={onJoinRoom}
              className="w-full relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative w-full bg-gradient-to-r from-[#1E3A8A] to-[#1e1b4b] border border-[#3B82F6]/50 hover:from-[#1E40AF] hover:to-[#312e81] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center space-x-3 shadow-xl">
                <PlayIcon className="w-6 h-6 text-blue-300" />
                <span className="text-xl tracking-wide">Join Room</span>
              </div>
            </button>
          </div>

          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-6"></div>

          {/* How to Play Section */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              <h3 className="font-bold text-lg text-yellow-400 uppercase tracking-widest">How to Play:</h3>
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
            </div>
            
            <div className="space-y-4 text-sm text-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-[#1D0C3A] font-black text-xs">1</div>
                <p>4 players get random roles: <span className="text-yellow-400 font-semibold">Raja</span>, <span className="text-pink-400 font-semibold">Rani</span>, <span className="text-blue-400 font-semibold">Police</span>, <span className="text-green-400 font-semibold">Thief</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-[#1D0C3A] font-black text-xs">2</div>
                <p>The <span className="text-blue-400 font-semibold">Police</span> must find the <span className="text-green-400 font-semibold">Thief</span> before time runs out!</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-[#1D0C3A] font-black text-xs">3</div>
                <p><span className="text-white font-bold">Police gets ONLY ONE GUESS</span> to catch the Thief out of the 4 players.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-[#1D0C3A] font-black text-xs">4</div>
                <p>If Police fails, their 100 points go to <span className="text-green-400 font-semibold">Thief</span>!</p>
              </div>
            </div>
          </div>

          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-6"></div>

          {/* Scoring Section */}
          <div className="w-full">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              <h3 className="font-bold text-lg text-yellow-400 uppercase tracking-widest">Scoring:</h3>
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
            </div>
            
            <div className="bg-[#11052C]/80 rounded-xl p-4 border border-[#3A1C61]">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="flex flex-col items-center p-2 rounded-lg bg-[#1A0B2E]">
                  <img src="/assets/crown.png" className="w-8 h-8 mb-1 drop-shadow-md" alt="Raja" />
                  <span className="text-yellow-500 font-bold">Raja</span>
                  <span className="text-white">+10,000</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-[#1A0B2E]">
                  <img src="/assets/queen.png" className="w-8 h-8 mb-1 drop-shadow-md" alt="Rani" />
                  <span className="text-pink-400 font-bold">Rani</span>
                  <span className="text-white">+5,000</span>
                </div>
                <div className="flex flex-col flex-grow items-center justify-center space-y-2 col-span-1">
                  {/* Police wins */}
                  <div className="flex w-full justify-between items-center bg-blue-900/30 px-2 py-1 rounded text-xs border border-blue-500/30">
                    <span className="text-blue-400 flex items-center gap-1"><img src="/assets/police.png" className="w-4 h-4" alt="Police" /> +100</span>
                    <span className="text-gray-500 flex items-center gap-1"><img src="/assets/robber.png" className="w-4 h-4 opacity-50 grayscale" alt="Thief" /> 0</span>
                  </div>
                  {/* Thief wins */}
                  <div className="flex w-full justify-between items-center bg-green-900/30 px-2 py-1 rounded text-xs border border-green-500/30">
                    <span className="text-gray-500 flex items-center gap-1"><img src="/assets/police.png" className="w-4 h-4 opacity-50 grayscale" alt="Police" /> 0</span>
                    <span className="text-green-400 flex items-center gap-1"><img src="/assets/robber.png" className="w-4 h-4" alt="Thief" /> +100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Footer props decorations */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none opacity-50 blur-[1px]">
        <img src="/assets/coins.png" className="w-20 h-20" alt="Coins" />
        <img src="/assets/crown.png" className="w-20 h-20" alt="Crown" />
      </div>
    </div>
  );
};
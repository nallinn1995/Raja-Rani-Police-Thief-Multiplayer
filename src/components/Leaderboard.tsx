import React from 'react';
import { Trophy, Medal, Award, Home } from 'lucide-react';
import { Player } from '../types/game';

interface LeaderboardProps {
  leaderboard: Player[];
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard, onPlayAgain, onBackToHome }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />;
      case 3:
        return <Award className="w-8 h-8 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />;
      default:
        return <div className="w-8 h-8 rounded-full bg-[#1A0B2E] border border-[#3A1C61] flex items-center justify-center text-gray-400 font-bold">{rank}</div>;
    }
  };

  const getRankColors = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-[#5A2D0C] to-[#2E1805] border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] text-yellow-400';
      case 2:
        return 'bg-[#11052C] border-gray-400/50 shadow-inner text-gray-200';
      case 3:
        return 'bg-[#11052C] border-orange-500/50 shadow-inner text-orange-300';
      default:
        return 'bg-[#11052C] border-[#3A1C61] shadow-inner text-gray-400';
    }
  };

  return (
    <div className="min-h-screen text-white font-sans bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex items-center justify-center p-4 relative overflow-hidden">
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

      <div className="relative z-10 max-w-md w-full bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] shadow-[0_0_40px_rgba(147,51,234,0.3)] border border-[#3A1C61] p-8">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide mb-2 drop-shadow-md">Game Over!</h1>
          <p className="text-fuchsia-300 tracking-wide font-medium">Final Leaderboard</p>
        </div>

        <div className="space-y-3 mb-8">
          {leaderboard.map((player) => {
            const isFirst = player.rank === 1;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${isFirst ? 'bg-gradient-to-r' : ''} ${getRankColors(player.rank!)} transition-all duration-300 hover:scale-105`}
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(player.rank!)}
                  <div>
                    <p className={`font-bold text-lg tracking-wide ${isFirst ? 'text-yellow-400' : 'text-gray-200'}`}>{player.name}</p>
                    <p className="text-sm font-medium opacity-80">
                      {isFirst ? '🎉 Winner!' : `#${player.rank} Place`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-2xl title-font ${isFirst ? 'text-yellow-400 drop-shadow-md' : 'text-white'}`}>{player.score}</p>
                  <p className="text-xs uppercase tracking-wider opacity-70">points</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <button
            onClick={onPlayAgain}
            className="w-full relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
            <div className="relative w-full bg-[#11052C] border border-[#D946EF]/50 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:scale-105 shadow-xl flex items-center justify-center space-x-2">
              <span className="tracking-wide">Play Again</span>
            </div>
          </button>
          
          <button
            onClick={onBackToHome}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl bg-[#0A0217] border border-[#3A1C61] text-gray-400 hover:text-white hover:border-[#5A2C81] transition-all duration-300 transform hover:scale-105 shadow-md font-medium tracking-wide"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
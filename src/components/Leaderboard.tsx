import React from 'react';
import { ArrowLeft, Shield, Home } from 'lucide-react';
import { Player, GameMode } from '../types/game';

interface LeaderboardProps {
  leaderboard: Player[];
  gameMode?: GameMode;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  leaderboard,
  gameMode,
  onPlayAgain,
  onBackToHome,
}) => {
  const isPoliceMode = gameMode === GameMode.DETECTIVE_CHALLENGE || (gameMode as string) === 'POLICE_THIEF';
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <img src="/assets/images/rank1.png" alt="Rank 1" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
      case 2:
        return <img src="/assets/images/rank2.png" alt="Rank 2" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />;
      case 3:
        return <img src="/assets/images/rank3.png" alt="Rank 3" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />;
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
    <div
      className="min-h-screen text-white font-sans bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundImage: "url('/assets/images/background.png')" }}
    >
      {/* Dark Royal Vignette & Shadow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A021A]/70 via-transparent to-[#0A021A]/85 pointer-events-none" />
      <button
        onClick={onBackToHome}
        className="fixed top-6 left-6 z-40 p-3 bg-[#1D0C3A]/90 hover:bg-[#2A1452] border border-[#3A1C61] rounded-full text-gray-300 hover:text-white shadow-lg transition-all duration-200 flex items-center justify-center group"
        title="Back to Home"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>
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
          {isPoliceMode ? (
            <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          ) : (
            <img src="/assets/images/trophy.png" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 object-contain animate-bounce drop-shadow-[0_0_25px_rgba(250,204,21,0.8)]" alt="Trophy" />
          )}
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide mb-2 drop-shadow-md">
            Game Over!
          </h1>
          <p className="text-fuchsia-300 tracking-wide font-medium">
            {isPoliceMode ? 'Police vs Thief Final Results' : 'Final Leaderboard'}
          </p>
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
                    <p className="text-xs font-medium opacity-80">
                      {isFirst ? '🎉 Winner!' : `#${player.rank} Place`}
                    </p>
                  </div>
                </div>

                {isPoliceMode ? (
                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold text-blue-400">
                      {player.correctCatches || 0} Correct / {player.wrongGuesses || 0} Wrong
                    </p>
                    <p className="text-gray-400">
                      Accuracy: <span className="text-emerald-400 font-bold">{player.accuracy || 0}%</span>
                    </p>
                    <p className="text-gray-400 text-[10px]">
                      Turns: <span className="text-white font-bold">{player.policeTurnsCompleted || 0}</span>
                    </p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className={`font-black text-2xl title-font ${isFirst ? 'text-yellow-400 drop-shadow-md' : 'text-white'}`}>{player.score}</p>
                    <p className="text-xs uppercase tracking-wider opacity-70">points</p>
                  </div>
                )}
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
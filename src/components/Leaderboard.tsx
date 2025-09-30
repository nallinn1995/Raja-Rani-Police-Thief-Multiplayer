import React from 'react';
import { Trophy, Medal, Award, Home } from 'lucide-react';
import { Player } from '../types/game';

interface LeaderboardProps {
  leaderboard: Player[];
  onPlayAgain: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard, onPlayAgain }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-orange-500" />;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">{rank}</div>;
    }
  };

  const getRankColors = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-100 to-yellow-200 border-yellow-300';
      case 2:
        return 'from-gray-100 to-gray-200 border-gray-300';
      case 3:
        return 'from-orange-100 to-orange-200 border-orange-300';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h1>
          <p className="text-gray-600">Final Leaderboard</p>
        </div>

        <div className="space-y-3 mb-8">
          {leaderboard.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-r ${getRankColors(player.rank!)} transition-all duration-300 hover:scale-105`}
            >
              <div className="flex items-center space-x-3">
                {getRankIcon(player.rank!)}
                <div>
                  <p className="font-bold text-gray-800 text-lg">{player.name}</p>
                  <p className="text-sm text-gray-600">
                    {player.rank === 1 ? '🎉 Winner!' : `#${player.rank} Place`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-2xl text-gray-800">{player.score}</p>
                <p className="text-xs text-gray-600">points</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Play Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
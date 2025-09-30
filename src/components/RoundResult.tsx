import React from 'react';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import { RoundResult as RoundResultType } from '../types/game';

interface RoundResultProps {
  result: RoundResultType;
}

export const RoundResult: React.FC<RoundResultProps> = ({ result }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          {result.isCorrect ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          )}
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Round {result.currentRound} Results
          </h1>
          
          <p className={`text-lg font-medium ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {result.isCorrect ? 'Police found the Thief!' : 'Police guessed wrong!'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-red-800 font-medium">The Thief was:</span>
              <span className="text-red-900 font-bold">{result.thief.name}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-blue-800 font-medium">Police guessed:</span>
              <span className="text-blue-900 font-bold">{result.guessedPlayer.name}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center justify-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Current Scores
          </h2>
          
          <div className="space-y-2">
            {result.players
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    index === 0 ? 'bg-yellow-50 border-yellow-300 border-2' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      player.role === 'Raja' ? 'bg-yellow-500' :
                      player.role === 'Rani' ? 'bg-pink-500' :
                      player.role === 'Police' ? 'bg-blue-500' : 'bg-red-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{player.name}</p>
                      <p className="text-sm text-gray-600">{player.role}</p>
                    </div>
                  </div>
                  <span className="font-bold text-lg text-gray-800">{player.score}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="text-center">
          <div className="animate-pulse text-gray-600">
            {result.currentRound >= result.totalRounds 
              ? 'Preparing final results...' 
              : 'Next round starting soon...'
            }
          </div>
        </div>
      </div>
    </div>
  );
};
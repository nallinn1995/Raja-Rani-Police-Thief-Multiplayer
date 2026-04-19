import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RoundResult as RoundResultType } from '../types/game';

interface RoundResultProps {
  result: RoundResultType;
  isHost?: boolean;
  onNextRound?: () => void;
}

export const RoundResult: React.FC<RoundResultProps> = ({ result, isHost, onNextRound }) => {
  useEffect(() => {
    if (result.isCorrect) {
      // Confetti burst
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Success sound
      const successAudio = new Audio("https://actions.google.com/sounds/v1/cartoon/cling_1.ogg");
      successAudio.volume = 0.6;
      successAudio.play().catch(e => console.log("Audio play prevented", e));
    } else {
      // Wrong sound
      const wrongAudio = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
      wrongAudio.volume = 0.6;
      wrongAudio.play().catch(e => console.log("Audio play prevented", e));
    }
  }, [result.isCorrect]);

  return (
    <div className={`min-h-screen text-white font-sans transition-all duration-500 bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex items-center justify-center p-4 relative overflow-hidden ${result.isCorrect ? 'animate-flash-green' : 'animate-flash-red'}`}>
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
      <div className={`relative z-10 max-w-md w-full bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] shadow-[0_0_40px_rgba(147,51,234,0.3)] border border-[#3A1C61] p-8 ${!result.isCorrect ? 'animate-shake' : ''}`}>
        <div className="text-center mb-6">
          {result.isCorrect ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          )}
          
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide mb-2 drop-shadow-md">
            Round {result.currentRound} Results
          </h1>
          
          <p className={`text-lg font-bold tracking-wide ${result.isCorrect ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`}>
            {result.isCorrect ? 'Police found the Thief!' : 'Police guessed wrong!'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-[#11052C] rounded-xl border border-red-900/60 shadow-inner">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-red-300 font-medium tracking-wide">The Thief was:</span>
              <span className="text-red-400 font-black tracking-wider text-xl drop-shadow-md">{result.thief.name}</span>
            </div>
          </div>

          <div className="p-4 bg-[#11052C] rounded-xl border border-blue-900/60 shadow-inner">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-blue-300 font-medium tracking-wide">Police guessed:</span>
              <span className="text-blue-400 font-black tracking-wider text-xl drop-shadow-md">{result.guessedPlayer.name}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 flex items-center justify-center tracking-wide">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            Current Scores
          </h2>
          
          <div className="space-y-2">
            {result.players
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl shadow-md transition-all duration-300 ${
                    index === 0 ? 'bg-gradient-to-r from-[#5A2D0C] to-[#2E1805] border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-[#11052C] border border-[#3A1C61]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold drop-shadow-md ${
                      player.role === 'Raja' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      player.role === 'Rani' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                      player.role === 'Police' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-green-400 to-green-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className={`font-bold tracking-wide ${index === 0 ? 'text-yellow-400' : 'text-gray-200'}`}>{player.name}</p>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{player.role}</p>
                    </div>
                  </div>
                  <span className={`font-black text-xl title-font ${index === 0 ? 'text-yellow-400 drop-shadow-md' : 'text-white'}`}>{player.score}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="text-center mt-6">
          {result.currentRound >= result.totalRounds ? (
            <div className="animate-pulse text-gray-400 font-medium tracking-wide">
              Preparing final results...
            </div>
          ) : isHost ? (
            <button
               onClick={onNextRound}
               className="w-full relative group mt-2"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative w-full bg-[#11052C] border border-[#D946EF]/50 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:scale-105 shadow-xl flex items-center justify-center space-x-2">
                <span className="tracking-wide">Next Round</span>
              </div>
            </button>
          ) : (
            <div className="animate-pulse text-fuchsia-300 font-medium tracking-wide">
              Waiting for host to start next round...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
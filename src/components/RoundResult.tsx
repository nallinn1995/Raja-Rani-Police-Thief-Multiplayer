import React, { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RoundResult as RoundResultType } from '../types/game';
import { XpBreakdownCard } from './common/XpBreakdownCard';
import { playCardShuffleSound } from '../utils/soundUtils';

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

  const isGameOver =
    result.isGameOver ??
    (result.winCondition === 'target_score'
      ? result.players.some((p) => p.score >= (result.targetScore || 5000))
      : result.currentRound >= result.totalRounds);

  const policePlayer = result.police || result.players.find((p) => p.role === "Police");
  const policeName = policePlayer?.name || "Police";
  const thiefName = result.thief?.name || "Thief";
  const guessedName = result.guessedPlayer?.name || "Player";

  return (
    <div
      className={`min-h-screen text-white font-sans transition-all duration-500 bg-[#0A041A] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative overflow-hidden ${result.isCorrect ? 'animate-flash-green' : 'animate-flash-red'}`}
      style={{ backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')" }}
    >
      {/* Dark Royal Vignette & Shadow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A021A]/70 via-transparent to-[#0A021A]/85 pointer-events-none" />
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
            }}
          />
        ))}
      </div>

      <div className="bg-[#1D0C3A] border border-[#5A2C81] p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(147,51,234,0.3)] relative z-10 animate-fade-in backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="mb-2">
            <span className="px-3 py-1 rounded-full bg-[#11052C] border border-purple-500/40 text-xs font-bold text-yellow-300">
              {result.winCondition === 'target_score'
                ? `Round ${result.currentRound} • Target: ${(result.targetScore || 5000).toLocaleString()} pts`
                : `Round ${result.currentRound} of ${result.totalRounds}`}
            </span>
          </div>

          <div className="mb-4">
            <span className="text-7xl select-none">
              {result.isCorrect ? '🎉' : '❌'}
            </span>
          </div>

          <h1 className="text-2xl font-black text-[#FFD700] mb-2 tracking-wide title-font">
            {result.isCorrect ? 'POLICE CAUGHT THE THIEF!' : 'THIEF ESCAPED!'}
          </h1>
          
          <p className="text-sm font-bold text-gray-200 bg-[#11052C] border border-[#3A1C61] py-2 px-4 rounded-xl inline-block">
            {result.isCorrect ? (
              <span><strong className="text-blue-400 font-extrabold">{policeName}</strong> correctly identified <strong className="text-rose-400 font-extrabold">{thiefName}</strong> as Thief!</span>
            ) : (
              <span><strong className="text-blue-400 font-extrabold">{policeName}</strong> guessed wrong! (<strong className="text-amber-300 font-extrabold">{guessedName}</strong> was guessed, but <strong className="text-rose-400 font-extrabold">{thiefName}</strong> was the Thief)</span>
            )}
          </p>
        </div>

        {/* Current Leaderboard */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 flex items-center justify-center tracking-wide">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            Current Scores
          </h2>
          
          <div className="space-y-2">
            {[...result.players]
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl shadow-md transition-all duration-300 ${
                    index === 0 ? 'bg-gradient-to-r from-[#5A2D0C] to-[#2E1805] border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-[#11052C] border border-[#3A1C61]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {index < 3 ? (
                      <img
                        src={`/assets/images/rank${index + 1}.png`}
                        alt={`Rank ${index + 1}`}
                        className="w-8 h-8 object-contain drop-shadow-md shrink-0"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold drop-shadow-md ${
                        player.role === 'Raja' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        player.role === 'Rani' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                        player.role === 'Police' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-green-400 to-green-600'
                      }`}>
                        {index + 1}
                      </div>
                    )}
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

        {/* XP Breakdown Card & Level Up Announcement */}
        <XpBreakdownCard matchXP={(result as any).matchXP} levelUpInfo={(result as any).levelUpInfo} />

        <div className="text-center mt-6">
          {isGameOver ? (
            <div className="animate-pulse text-yellow-300 font-bold tracking-wide text-sm">
              🏆 Game Over! Preparing final leaderboard...
            </div>
          ) : isHost ? (
            <button
               onClick={() => {
                 playCardShuffleSound();
                 if (onNextRound) onNextRound();
               }}
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
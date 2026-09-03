import React, { useState } from 'react';
import { ArrowLeft, Bot, Play, Trophy, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';

export interface AiOpponent {
  id: string;
  name: string;
  title: string;
  color: string;
}

export interface OfflineGameConfig {
  playerName: string;
  avatar: string;
  winCondition: 'rounds' | 'target_score';
  totalRounds: number;
  targetScore: number;
  aiOpponents: AiOpponent[];
}

interface OfflineSetupProps {
  onBack: () => void;
  onStartGame: (config: OfflineGameConfig) => void;
}

export const AI_BOT_POOL: Array<Omit<AiOpponent, 'id'>> = [
  { name: 'Vikram', title: 'The Royal Strategist', color: 'from-amber-500 to-yellow-400' },
  { name: 'Maya', title: 'The Clever Courtier', color: 'from-fuchsia-500 to-pink-400' },
  { name: 'Kabir', title: 'The Bold Guard', color: 'from-blue-500 to-cyan-400' },
  { name: 'Arjun', title: 'The Royal Archer', color: 'from-emerald-500 to-teal-400' },
  { name: 'Ananya', title: 'The Mystic Oracle', color: 'from-purple-500 to-indigo-400' },
  { name: 'Rohan', title: 'The Iron Knight', color: 'from-red-500 to-orange-400' },
  { name: 'Priya', title: 'The Palace Scholar', color: 'from-pink-500 to-rose-400' },
  { name: 'Devraj', title: 'The Silent Infiltrator', color: 'from-violet-500 to-purple-400' },
  { name: 'Meera', title: 'The Shadow Whisperer', color: 'from-cyan-500 to-blue-400' },
  { name: 'Samar', title: 'The Desert Falcon', color: 'from-yellow-500 to-amber-400' },
  { name: 'Tara', title: 'The Star Seer', color: 'from-indigo-500 to-sky-400' },
  { name: 'Karan', title: 'The Golden Blade', color: 'from-amber-600 to-yellow-300' },
];

export function getRandomAiOpponents(count = 3): AiOpponent[] {
  const shuffled = [...AI_BOT_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((bot, idx) => ({
    ...bot,
    id: `bot_${idx + 1}`,
  }));
}

export const OfflineSetup: React.FC<OfflineSetupProps> = ({ onBack, onStartGame }) => {
  const currentUser = authService.getCurrentUser();
  const [playerName, setPlayerName] = useState(() => currentUser?.username || 'You');
  const [winCondition, setWinCondition] = useState<'rounds' | 'target_score'>('rounds');
  const [totalRounds, setTotalRounds] = useState(3);
  const [targetScore, setTargetScore] = useState(3000);
  const [aiOpponents] = useState<AiOpponent[]>(() => getRandomAiOpponents(3));

  const handleStart = () => {
    const finalName = playerName.trim() || 'You';
    onStartGame({
      playerName: finalName,
      avatar: currentUser?.avatar || '1',
      winCondition,
      totalRounds,
      targetScore,
      aiOpponents,
    });
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 relative text-white font-sans bg-[#0A041A] bg-cover bg-center bg-no-repeat select-none overflow-y-auto"
      style={{ backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')" }}
    >
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080320]/60 via-[#160628]/40 to-[#080320]/80 pointer-events-none" />

      {/* Floating Back Navigation Arrow (Left Side) */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1D0C3A]/90 hover:bg-[#2A1452] border-2 border-[#FFD700] text-gray-200 hover:text-white shadow-[0_0_20px_rgba(255,215,0,0.4)] backdrop-blur-md transition-all duration-200 flex items-center justify-center group cursor-pointer"
        title="Back to Mode Selection"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 max-w-xl w-full bg-[#14082B]/95 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl my-auto"
      >
        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase mb-2">
            <Bot className="w-4 h-4" />
            <span>Casual AI Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-serif uppercase tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
            Offline Game Setup
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Configure your match settings and face 3 royal AI opponents
          </p>
        </div>

        {/* Player Name Config */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
            Your Player Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={16}
              className="w-full px-4 py-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 focus:border-[#FFD700] text-white text-sm outline-none transition-colors"
            />
            <UserIcon className="w-4 h-4 text-purple-400 absolute right-3.5 top-3" />
          </div>
        </div>

        {/* Match Win Condition Settings */}
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 mb-6 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Match Length</span>
            </span>
            <div className="flex rounded-lg bg-purple-950 border border-purple-500/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setWinCondition('rounds')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  winCondition === 'rounds' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Rounds
              </button>
              <button
                type="button"
                onClick={() => setWinCondition('target_score')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  winCondition === 'target_score' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Target Score
              </button>
            </div>
          </div>

          {winCondition === 'rounds' ? (
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTotalRounds(r)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    totalRounds === r
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-purple-900/40 hover:bg-purple-900/70 border-purple-500/30 text-gray-300'
                  }`}
                >
                  {r} Rounds
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[2000, 3000, 5000].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setTargetScore(pts)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    targetScore === pts
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-purple-900/40 hover:bg-purple-900/70 border-purple-500/30 text-gray-300'
                  }`}
                >
                  {pts} Pts
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3 AI Opponents Display */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Your 3 AI Royal Opponents</span>
            <span className="text-[10px] text-amber-400 font-semibold lowercase">randomized each game</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {aiOpponents.map((bot) => (
              <div
                key={bot.id}
                className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-center flex flex-col items-center hover:border-amber-400/50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${bot.color} text-black font-extrabold flex items-center justify-center shadow-md mb-2`}>
                  <Bot className="w-5 h-5 fill-black/20" />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-full">{bot.name}</span>
                <span className="text-[9px] text-amber-300/80 font-medium truncate max-w-full">{bot.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(255,215,0,0.6)] hover:shadow-[0_0_40px_rgba(255,215,0,0.9)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>START OFFLINE GAME</span>
        </button>
      </motion.div>
    </div>
  );
};

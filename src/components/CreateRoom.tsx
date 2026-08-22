import React, { useState } from 'react';
import { ArrowLeft, Shield, Crown } from 'lucide-react';
import { GameMode } from '../types/game';
import { authService } from '../services/authService';

interface CreateRoomProps {
  onBack: () => void;
  onRoomCreated: (roomCode: string, playerId: string, playerToken?: string) => void;
  createRoom: (
    roomName: string,
    playerName: string,
    totalRounds: number,
    options?: {
      gameMode?: string;
      winCondition?: string;
      targetScore?: number;
      policeTurnsPerPlayer?: number;
    },
    userId?: string
  ) => Promise<{ roomCode: string; playerId: string; playerToken?: string }>;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ onBack, onRoomCreated, createRoom }) => {
  const currentUser = authService.getCurrentUser();
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState(() => {
    return currentUser?.username || '';
  });
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CLASSIC_POINTS);

  React.useEffect(() => {
    if (currentUser?.username && !playerName) {
      setPlayerName(currentUser.username);
    }
  }, []);

  // Win condition options (applicable to Classic Points & Modern Mode)
  const [winCondition, setWinCondition] = useState<'rounds' | 'target_score'>('rounds');
  const [totalRounds, setTotalRounds] = useState(3);
  const [targetScore, setTargetScore] = useState(5000);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim() || !playerName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUser = authService.getCurrentUser();
      const isConfigurableMode = gameMode === GameMode.CLASSIC_POINTS || gameMode === GameMode.MODERN_MODE;

      const response = await createRoom(
        roomName.trim(),
        playerName.trim(),
        totalRounds,
        {
          gameMode,
          winCondition: isConfigurableMode ? winCondition : undefined,
          targetScore: isConfigurableMode && winCondition === 'target_score' ? targetScore : undefined,
        },
        currentUser?.id || currentUser?._id
      );

      onRoomCreated(response.roomCode, response.playerId, response.playerToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-2 sm:p-6 relative overflow-y-auto text-white font-sans select-none"
      style={{
        backgroundImage: "url('/assets/images/background.png')",
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    >
      {/* Subtle Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/25 via-transparent to-purple-950/35 pointer-events-none" />
      {/* Background Particles */}
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

      {/* Main Spacious Container with Dedicated Create Room Gold Frame */}
      <div className="create-room-gold-frame backdrop-blur-2xl relative z-10 my-1 sm:my-4 max-w-3xl w-full">
        <div className="relative z-10 flex items-center pt-6 sm:pt-0 mt-1 sm:mt-4 mb-2 sm:mb-5 pb-2 sm:pb-3 border-b border-purple-800/40">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 ml-1 sm:ml-2 text-purple-300 hover:text-white transition-colors bg-[#11052C] rounded-full border border-[#4A2078] hover:border-yellow-400 shrink-0 shadow-md cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-lg xs:text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] ml-2 sm:ml-3.5 title-font tracking-wide drop-shadow-md">
            Create Game Room
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
          {/* Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-purple-200 mb-1 sm:mb-2 font-sans tracking-wide">
                <img src="/assets/crown.png" className="w-3.5 h-3.5 sm:w-5 sm:h-5 inline mr-1 sm:mr-2 align-middle drop-shadow-md" alt="icon" />
                Team / Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3.5 bg-[#11052C] border border-[#5A2C81] text-xs sm:text-sm text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter team name"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-purple-200 mb-1 sm:mb-2 font-sans tracking-wide">
                <img src="/assets/police.png" className="w-3.5 h-3.5 sm:w-5 sm:h-5 inline mr-1 sm:mr-2 align-middle drop-shadow-md" alt="icon" />
                Your Host Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3.5 bg-[#11052C] border border-[#5A2C81] text-xs sm:text-sm text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>
          </div>

          {/* GAME MODE SELECTION */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-yellow-300 mb-1.5 sm:mb-3 font-sans tracking-wider uppercase">
              Select Game Mode
            </label>

            {/* MOBILE VIEW (<640px): Compact Segmented Tab Selector + Active Detail Card */}
            <div className="block sm:hidden">
              <div className="flex rounded-xl bg-[#11052C] p-1 border border-[#4A2078] mb-2">
                <button
                  type="button"
                  onClick={() => setGameMode(GameMode.CLASSIC_POINTS)}
                  className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    gameMode === GameMode.CLASSIC_POINTS
                      ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-yellow-300 border border-yellow-400/60 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <img src="/assets/images/trophy.png" className="w-3.5 h-3.5 object-contain" alt="Classic" />
                  <span>Classic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGameMode(GameMode.DETECTIVE_CHALLENGE)}
                  className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    gameMode === GameMode.DETECTIVE_CHALLENGE
                      ? 'bg-gradient-to-r from-cyan-950 to-blue-900 text-cyan-300 border border-cyan-400/60 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Detective</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-black">4P</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGameMode(GameMode.MODERN_MODE)}
                  className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    gameMode === GameMode.MODERN_MODE
                      ? 'bg-gradient-to-r from-amber-950 via-purple-950 to-indigo-950 text-yellow-300 border border-yellow-400/60 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Modern</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-yellow-400 text-black font-black">6P</span>
                </button>
              </div>

              {/* Mobile Active Mode Card Summary */}
              <div
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all duration-300 ${
                  gameMode === GameMode.CLASSIC_POINTS
                    ? 'bg-gradient-to-b from-purple-900/90 to-indigo-950/90 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                    : gameMode === GameMode.DETECTIVE_CHALLENGE
                    ? 'bg-gradient-to-b from-cyan-950/90 to-blue-950/90 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                    : 'bg-gradient-to-b from-amber-950/90 via-purple-950/90 to-indigo-950/90 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/20 flex items-center justify-center shrink-0 p-1">
                  {gameMode === GameMode.CLASSIC_POINTS && (
                    <img src="/assets/images/trophy.png" className="w-full h-full object-contain" alt="Classic" />
                  )}
                  {gameMode === GameMode.DETECTIVE_CHALLENGE && (
                    <Shield className="w-4 h-4 text-cyan-300" />
                  )}
                  {gameMode === GameMode.MODERN_MODE && (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white">
                      {gameMode === GameMode.CLASSIC_POINTS && "Classic Points"}
                      {gameMode === GameMode.DETECTIVE_CHALLENGE && "Detective Challenge"}
                      {gameMode === GameMode.MODERN_MODE && "Modern Mode"}
                    </h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/50 text-purple-200 uppercase">
                      {gameMode === GameMode.CLASSIC_POINTS && "Classic"}
                      {gameMode === GameMode.DETECTIVE_CHALLENGE && "4 Players"}
                      {gameMode === GameMode.MODERN_MODE && "6 Players"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-tight mt-0.5 font-sans">
                    {gameMode === GameMode.CLASSIC_POINTS && "Traditional paper game with custom score points & turn-based guessing."}
                    {gameMode === GameMode.DETECTIVE_CHALLENGE && "4 Detectives, 3 suspect cards, and secret Thief speed accusation."}
                    {gameMode === GameMode.MODERN_MODE && "6 Secret Roles, Mantri Shield, Thief Loot, and Villager Witness Statement."}
                  </p>
                </div>
              </div>
            </div>

            {/* DESKTOP VIEW (>=640px): 3-Column Grid Cards */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-3">
              {/* Classic Points */}
              <button
                type="button"
                onClick={() => setGameMode(GameMode.CLASSIC_POINTS)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  gameMode === GameMode.CLASSIC_POINTS
                    ? 'bg-gradient-to-b from-purple-900/90 to-indigo-950/90 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] ring-2 ring-yellow-400/50'
                    : 'bg-[#11052C]/90 border-[#4A2078] hover:border-purple-400 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-950 border border-yellow-400/40 flex items-center justify-center shrink-0 p-1">
                    <img src="/assets/images/trophy.png" className="w-full h-full object-contain" alt="Trophy" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-600 text-[10px] font-bold text-purple-300 uppercase">
                    Classic
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Classic Points</h3>
                  <p className="text-xs text-gray-300 leading-normal font-sans mt-1">
                    Traditional paper game with custom score points &amp; turn-based guessing.
                  </p>
                </div>
              </button>

              {/* Detective Challenge */}
              <button
                type="button"
                onClick={() => setGameMode(GameMode.DETECTIVE_CHALLENGE)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  gameMode === GameMode.DETECTIVE_CHALLENGE
                    ? 'bg-gradient-to-b from-cyan-900/90 to-blue-950/90 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/50'
                    : 'bg-[#11052C]/90 border-[#4A2078] hover:border-cyan-500 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400/40 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-cyan-300" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase">
                    4P
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Detective</h3>
                  <p className="text-xs text-gray-300 leading-normal font-sans mt-1">
                    4 Detectives, 3 suspect cards, and secret Thief speed accusation.
                  </p>
                </div>
              </button>

              {/* Modern Mode */}
              <button
                type="button"
                onClick={() => setGameMode(GameMode.MODERN_MODE)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  gameMode === GameMode.MODERN_MODE
                    ? 'bg-gradient-to-b from-amber-900/90 via-purple-900/90 to-indigo-950/90 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] ring-2 ring-yellow-400/50'
                    : 'bg-[#11052C]/90 border-[#4A2078] hover:border-yellow-500 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-950 border border-yellow-400/40 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase">
                    6P
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Modern Mode</h3>
                  <p className="text-xs text-gray-300 leading-normal font-sans mt-1">
                    6 Secret Roles, Mantri Shield, Thief Loot, and Villager Witness Statement.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* WIN CONDITION & ROUNDS SETTINGS (For Classic Points & Modern Mode) */}
          {(gameMode === GameMode.CLASSIC_POINTS || gameMode === GameMode.MODERN_MODE) && (
            <div className="p-2.5 sm:p-5 bg-[#11052C]/95 rounded-xl sm:rounded-2xl border border-[#5A2C81] space-y-2 sm:space-y-5 shadow-inner">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-purple-300 uppercase tracking-wider mb-1 sm:mb-2.5">
                  Win Condition Rule
                </label>
                <div className="flex rounded-lg sm:rounded-xl bg-[#1D0C3A] p-0.5 sm:p-1 border border-[#3A1C61]">
                  <button
                    type="button"
                    onClick={() => setWinCondition('rounds')}
                    className={`flex-1 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold rounded-md sm:rounded-lg transition ${
                      winCondition === 'rounds'
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Number of Rounds
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinCondition('target_score')}
                    className={`flex-1 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold rounded-md sm:rounded-lg transition ${
                      winCondition === 'target_score'
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Target Score
                  </button>
                </div>
              </div>

              {winCondition === 'rounds' ? (
                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-2 font-sans">
                    <label className="text-xs sm:text-sm font-semibold text-purple-200 flex items-center">
                      <img src="/assets/coins.png" className="w-3.5 h-3.5 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2 align-middle drop-shadow-md" alt="icon" />
                      Number of Rounds
                    </label>
                    <span className="text-yellow-400 font-black text-xs sm:text-base font-mono min-w-[70px] sm:min-w-[90px] text-right inline-block tabular-nums">
                      {totalRounds} Rounds
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                    className="custom-gem-slider"
                  />
                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mt-1 font-mono">
                    <span>1 Round</span>
                    <span>5 Rounds</span>
                    <span>10 Rounds</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-2 font-sans">
                    <label className="text-xs sm:text-sm font-semibold text-purple-200 flex items-center gap-1.5 sm:gap-2">
                      <img src="/assets/images/trophy.png" className="w-3.5 h-3.5 sm:w-5 sm:h-5 inline object-contain align-middle" alt="Trophy" />
                      Target Score Needed
                    </label>
                    <span className="text-yellow-400 font-black text-xs sm:text-base font-mono min-w-[85px] sm:min-w-[110px] text-right inline-block tabular-nums">
                      {targetScore.toLocaleString()} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="20000"
                    step="1000"
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseInt(e.target.value))}
                    className="custom-gem-slider"
                  />
                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mt-1 font-mono">
                    <span>2,000 pts</span>
                    <span>10,000 pts</span>
                    <span>20,000 pts</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-2 sm:p-3 bg-red-900/50 border border-red-500/50 text-red-200 rounded-xl text-xs sm:text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit Button with Graphic Asset & Ornate Glow Effect */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center relative group mt-2 sm:mt-6 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* Ambient Background Gold Glow */}
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-8 sm:h-10 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full blur-lg opacity-70 group-hover:opacity-100 group-hover:blur-xl transition-all duration-300 pointer-events-none" />

            <div className="relative transform group-hover:scale-[1.04] group-active:scale-[0.98] transition-all duration-300 drop-shadow-[0_4px_20px_rgba(234,179,8,0.5)] group-hover:drop-shadow-[0_6px_30px_rgba(250,204,21,0.85)]">
              <img
                src="/assets/images/creat-room-btn.png"
                alt="Create Game Room"
                className="w-full max-w-[220px] xs:max-w-[260px] sm:max-w-[520px] h-auto object-contain block mx-auto pointer-events-none"
              />
              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center gap-2 text-yellow-300 font-bold text-xs sm:text-lg">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Game Room...</span>
                </div>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Shield, Crown, Lock, Check, Sparkles } from 'lucide-react';
import { GameMode } from '../types/game';
import { authService } from '../services/authService';
import { configService, defaultConfig } from '../services/configService';

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
      maxPlayers?: number;
    },
    userId?: string
  ) => Promise<{ roomCode: string; playerId: string; playerToken?: string }>;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ onBack, onRoomCreated, createRoom }) => {
  const currentUser = authService.getCurrentUser();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState(() => {
    return currentUser?.username || '';
  });
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CLASSIC_POINTS);
  const [detectiveMaxPlayers, setDetectiveMaxPlayers] = useState<number>(1);

  // Detective mode is permanently enabled
  const detectiveEnabled = true;

  // Modern mode availability from admin config
  const [modernEnabled, setModernEnabled] = useState(
    defaultConfig.systemSettings!.modernEnabled
  );
  const [modernButtonText, setModernButtonText] = useState(
    defaultConfig.systemSettings!.modernButtonText
  );

  useEffect(() => {
    const unsub = configService.subscribe((cfg) => {
      const s = cfg.systemSettings;
      if (s) {
        setModernEnabled(!!s.modernEnabled);
        setModernButtonText(s.modernButtonText || 'Coming Soon');
        if (!s.modernEnabled && gameMode === GameMode.MODERN_MODE) {
          setGameMode(GameMode.CLASSIC_POINTS);
        }
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomName.trim()) {
      setError('Please enter a team or room name');
      return;
    }
    if (!playerName.trim()) {
      setError('Please enter your host name');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      handleNextStep();
      return;
    }

    if (!roomName.trim() || !playerName.trim()) {
      setError('Please fill in all fields');
      setCurrentStep(1);
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
          maxPlayers: gameMode === GameMode.DETECTIVE_CHALLENGE ? detectiveMaxPlayers : (gameMode === GameMode.MODERN_MODE ? 5 : 4),
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
        backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')",
        backgroundColor: "#0A041A",
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
        <div className="relative z-10 flex items-center pt-6 sm:pt-0 mt-1 sm:mt-4 mb-2 sm:mb-4 pb-2 sm:pb-3 border-b border-purple-800/40">
          <button
            onClick={() => {
              if (currentStep === 2) {
                setCurrentStep(1);
              } else {
                onBack();
              }
            }}
            className="p-1.5 sm:p-2 ml-1 sm:ml-2 text-purple-300 hover:text-white transition-colors bg-[#11052C] rounded-full border border-[#4A2078] hover:border-yellow-400 shrink-0 shadow-md cursor-pointer"
            title={currentStep === 2 ? "Back to Step 1" : "Back to Home"}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex-1 ml-2 sm:ml-3.5">
            <h1 className="text-lg xs:text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide drop-shadow-md">
              Create Game Room
            </h1>
          </div>
        </div>

        {/* STEPPER WIZARD INDICATOR */}
        <div className="relative z-10 flex items-center justify-between max-w-sm mx-auto mb-3 sm:mb-5 px-3 py-1.5 rounded-2xl bg-[#11052C]/70 border border-purple-800/50 backdrop-blur-sm">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black transition-all ${currentStep === 1
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_12px_rgba(250,204,21,0.6)] ring-2 ring-yellow-300'
                  : 'bg-emerald-500 text-black shadow-md'
                }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
            </div>
            <div className="text-left">
              <span className="block text-[9px] uppercase font-bold text-purple-300 tracking-wider">Step 1</span>
              <span className={`text-[11px] sm:text-xs font-bold transition-colors ${currentStep === 1 ? 'text-yellow-300' : 'text-white group-hover:text-yellow-300'}`}>
                Room & Host
              </span>
            </div>
          </button>

          {/* Connecting Line */}
          <div className="flex-1 mx-2 sm:mx-3 h-1 bg-purple-950/80 rounded-full overflow-hidden border border-purple-800/40 relative">
            <div
              className={`h-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-300 ${currentStep === 2 ? 'w-full shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'w-0'
                }`}
            />
          </div>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => {
              if (roomName.trim() && playerName.trim()) {
                setCurrentStep(2);
              } else {
                handleNextStep();
              }
            }}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black transition-all ${currentStep === 2
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_12px_rgba(250,204,21,0.6)] ring-2 ring-yellow-300'
                  : 'bg-[#180838] border border-[#5A2C81] text-purple-300'
                }`}
            >
              2
            </div>
            <div className="text-left">
              <span className="block text-[9px] uppercase font-bold text-purple-300 tracking-wider">Step 2</span>
              <span className={`text-[11px] sm:text-xs font-bold transition-colors ${currentStep === 2 ? 'text-yellow-300' : 'text-gray-400 group-hover:text-purple-200'}`}>
                Game Mode
              </span>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
          {/* STEP 1: ROOM NAME & HOST NAME */}
          {currentStep === 1 && (
            <div className="space-y-3 sm:space-y-4 transition-all duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-purple-200 mb-1 sm:mb-2 font-sans tracking-wide">
                    <img src="/assets/crown.png" className="w-3.5 h-3.5 sm:w-5 sm:h-5 inline mr-1 sm:mr-2 align-middle drop-shadow-md" alt="icon" />
                    Team / Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => {
                      setRoomName(e.target.value);
                      if (error) setError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNextStep();
                      }
                    }}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3.5 bg-[#11052C] border border-[#5A2C81] text-xs sm:text-sm text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 transition-all duration-200 placeholder:text-gray-500"
                    placeholder="Enter team name"
                    maxLength={30}
                    autoFocus
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
                    onChange={(e) => {
                      setPlayerName(e.target.value);
                      if (error) setError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNextStep();
                      }
                    }}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3.5 bg-[#11052C] border border-[#5A2C81] text-xs sm:text-sm text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 transition-all duration-200 placeholder:text-gray-500"
                    placeholder="Enter your name"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* Informative Tip Box */}
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#11052C]/80 border border-purple-800/40 flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                </div>
                <p className="text-[11px] sm:text-xs text-purple-200 leading-snug">
                  Set up your room identity and display name. In the next step, you will choose the game mode and customize rules!
                </p>
              </div>

              {error && (
                <div className="p-2 sm:p-2.5 bg-red-900/50 border border-red-500/50 text-red-200 rounded-xl text-xs text-center">
                  {error}
                </div>
              )}

              {/* Next Step Button */}
              <div className="pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-2.5 sm:py-3 px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_28px_rgba(250,204,21,0.7)] transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue: Select Game Mode</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT MODE & RULES */}
          {currentStep === 2 && (
            <div className="space-y-3 sm:space-y-4 transition-all duration-200">

              {/* GAME MODE SELECTION */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-yellow-300 mb-1.5 sm:mb-2 font-sans tracking-wider uppercase">
                  Select Game Mode
                </label>

                {/* MOBILE VIEW (<640px): Compact Segmented Tab Selector + Active Detail Card */}
                <div className="block sm:hidden">
                  <div className="flex rounded-xl bg-[#11052C] p-1 border border-[#4A2078] mb-2">
                    <button
                      type="button"
                      onClick={() => setGameMode(GameMode.CLASSIC_POINTS)}
                      className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${gameMode === GameMode.CLASSIC_POINTS
                          ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-yellow-300 border border-yellow-400/60 shadow-md'
                          : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      <img src="/assets/images/trophy.png" className="w-3.5 h-3.5 object-contain" alt="Classic" />
                      <span>Classic</span>
                    </button>
                    {/* Detective - mobile tab (permanently enabled) */}
                    <button
                      type="button"
                      onClick={() => setGameMode(GameMode.DETECTIVE_CHALLENGE)}
                      className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 relative cursor-pointer ${
                        gameMode === GameMode.DETECTIVE_CHALLENGE
                          ? 'bg-gradient-to-r from-cyan-950 to-blue-900 text-cyan-300 border border-cyan-400/60 shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Detective</span>
                    </button>
                    {/* Modern - mobile tab */}
                    <button
                      type="button"
                      onClick={() => modernEnabled && setGameMode(GameMode.MODERN_MODE)}
                      disabled={!modernEnabled}
                      className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 relative ${!modernEnabled
                          ? 'text-gray-600 cursor-not-allowed opacity-60'
                          : gameMode === GameMode.MODERN_MODE
                            ? 'bg-gradient-to-r from-amber-950 via-purple-950 to-indigo-950 text-yellow-300 border border-yellow-400/60 shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                      {modernEnabled ? (
                        <>
                          <span>Modern</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-yellow-400 text-black font-black">6P</span>
                        </>
                      ) : (
                        <span className="text-[9px] font-black text-orange-400">{modernButtonText}</span>
                      )}
                    </button>
                  </div>

                  {/* Mobile Active Mode Card Summary */}
                  <div
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all duration-300 ${gameMode === GameMode.CLASSIC_POINTS
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
                          {gameMode === GameMode.DETECTIVE_CHALLENGE && "Detective"}
                          {gameMode === GameMode.MODERN_MODE && "5 Players"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-tight mt-0.5 font-sans">
                        {gameMode === GameMode.CLASSIC_POINTS && "Traditional paper game with custom score points & turn-based guessing."}
                        {gameMode === GameMode.DETECTIVE_CHALLENGE && "The Door of Mystery: 10 Doors, 1 Thief, 4 Safe, 3 Bombs, 1 Clue, 1 Life, 60s Timer."}
                        {gameMode === GameMode.MODERN_MODE && "5 Secret Roles, Mantri Shield, and Thief Loot."}
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
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden cursor-pointer ${gameMode === GameMode.CLASSIC_POINTS
                        ? 'bg-gradient-to-b from-purple-900/90 to-indigo-950/90 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] ring-2 ring-yellow-400/50'
                        : 'bg-[#11052C]/90 border-[#4A2078] hover:border-purple-400 opacity-75 hover:opacity-100'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-400/40 flex items-center justify-center shrink-0">
                        <img src="/assets/images/trophy.png" className="w-5 h-5 object-contain" alt="Trophy" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase">
                        4P
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Classic Points</h3>
                      <p className="text-xs text-gray-300 leading-normal font-sans mt-1">
                        Traditional paper slips with custom score points & turn-based guessing.
                      </p>
                    </div>
                  </button>

                  {/* Detective Challenge */}
                  <button
                    type="button"
                    onClick={() => setGameMode(GameMode.DETECTIVE_CHALLENGE)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden cursor-pointer ${gameMode === GameMode.DETECTIVE_CHALLENGE
                        ? 'bg-gradient-to-b from-cyan-950/90 to-blue-950/90 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/50'
                        : 'bg-[#11052C]/90 border-[#4A2078] hover:border-cyan-400 opacity-75 hover:opacity-100'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400/40 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-cyan-300" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase">
                        Solo / Co-Op
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">The Door of Mystery</h3>
                      <p className="text-xs text-gray-300 leading-normal font-sans mt-1">
                        10 Doors, 1 Thief, 4 Safe, 3 Bombs, 1 Clue, 1 Life, 60s timer.
                      </p>
                    </div>
                  </button>

                  {/* Modern Mode - with Coming Soon overlay when disabled */}
                  <button
                    type="button"
                    onClick={() => modernEnabled && setGameMode(GameMode.MODERN_MODE)}
                    disabled={!modernEnabled}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${!modernEnabled
                        ? 'bg-[#0a0a1a]/90 border-[#2A1040] cursor-not-allowed opacity-70'
                        : gameMode === GameMode.MODERN_MODE
                          ? 'bg-gradient-to-b from-amber-900/90 via-purple-900/90 to-indigo-950/90 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] ring-2 ring-yellow-400/50'
                          : 'bg-[#11052C]/90 border-[#4A2078] hover:border-yellow-500 opacity-75 hover:opacity-100 cursor-pointer'
                      }`}
                  >
                    {!modernEnabled && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/55 backdrop-blur-[2px] rounded-2xl">
                        <Lock className="w-5 h-5 text-orange-400 mb-1" />
                        <span className="text-xs font-extrabold text-orange-400 tracking-wider uppercase">{modernButtonText}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-950 border border-yellow-400/40 flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5 text-yellow-400" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase">
                        5P
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Modern Mode</h3>
                      <p className="text-xs text-gray-300 leading-normal font-sans mt-1">
                        5 Secret Roles, Mantri Shield, and Thief Loot.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* DETECTIVE CHALLENGE SETTINGS: 1 to 6 Players Slider */}
              {gameMode === GameMode.DETECTIVE_CHALLENGE && (
                <div className="p-3 sm:p-4 bg-gradient-to-br from-[#0b1329]/95 via-[#11052C]/95 to-[#0b1f3a]/95 rounded-xl sm:rounded-2xl border border-cyan-500/50 space-y-2 sm:space-y-3 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-sans">
                    <label className="text-xs sm:text-sm font-bold text-cyan-200 flex items-center gap-2 shrink-0">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>How Many Detectives Can Join?</span>
                    </label>
                    <span className="text-cyan-300 font-black text-xs sm:text-sm font-mono bg-cyan-950/90 px-3 py-1 rounded-lg border border-cyan-400/50 shadow-sm tabular-nums shrink-0">
                      {detectiveMaxPlayers} {detectiveMaxPlayers === 1 ? 'Detective (Solo)' : 'Detectives'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={detectiveMaxPlayers}
                    onChange={(e) => setDetectiveMaxPlayers(parseInt(e.target.value))}
                    className="custom-gem-slider w-full"
                  />
                  <div className="flex justify-between text-[10px] sm:text-xs text-cyan-300/80 font-mono font-bold">
                    <span className={detectiveMaxPlayers === 1 ? 'text-yellow-300 font-black' : ''}>1 (Default)</span>
                    <span className={detectiveMaxPlayers === 2 ? 'text-yellow-300 font-black' : ''}>2</span>
                    <span className={detectiveMaxPlayers === 3 ? 'text-yellow-300 font-black' : ''}>3</span>
                    <span className={detectiveMaxPlayers === 4 ? 'text-yellow-300 font-black' : ''}>4</span>
                    <span className={detectiveMaxPlayers === 5 ? 'text-yellow-300 font-black' : ''}>5</span>
                    <span className={detectiveMaxPlayers === 6 ? 'text-yellow-300 font-black' : ''}>6 Max</span>
                  </div>
                  <div className="p-2 sm:p-2.5 bg-black/40 rounded-xl border border-cyan-500/30 text-[10px] sm:text-[11px] text-cyan-100 flex flex-wrap items-center justify-between gap-1.5">
                    <span>🚪 10 Doors (5x2)</span>
                    <span>🛡️ 4 Safe</span>
                    <span>💣 3 Bombs</span>
                    <span>🔍 1 Clue</span>
                    <span>❤️ 1 Life</span>
                    <span>⏱️ 60s</span>
                  </div>
                </div>
              )}

              {/* WIN CONDITION & ROUNDS SETTINGS (For Classic Points & Modern Mode) */}
              {(gameMode === GameMode.CLASSIC_POINTS || gameMode === GameMode.MODERN_MODE) && (
                <div className="p-2.5 sm:p-4 bg-[#11052C]/95 rounded-xl sm:rounded-2xl border border-[#5A2C81] space-y-2 sm:space-y-4 shadow-inner">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-purple-300 uppercase tracking-wider mb-1 sm:mb-2">
                      Win Condition Rule
                    </label>
                    <div className="flex rounded-lg sm:rounded-xl bg-[#1D0C3A] p-0.5 sm:p-1 border border-[#3A1C61]">
                      <button
                        type="button"
                        onClick={() => setWinCondition('rounds')}
                        className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-md sm:rounded-lg transition cursor-pointer ${winCondition === 'rounds'
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-md'
                            : 'text-gray-400 hover:text-white'
                          }`}
                      >
                        Number of Rounds
                      </button>
                      <button
                        type="button"
                        onClick={() => setWinCondition('target_score')}
                        className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-md sm:rounded-lg transition cursor-pointer ${winCondition === 'target_score'
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
                      <div className="flex items-center justify-between mb-1 font-sans">
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
                      <div className="flex items-center justify-between mb-1 font-sans">
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
                <div className="p-2 sm:p-2.5 bg-red-900/50 border border-red-500/50 text-red-200 rounded-xl text-xs text-center">
                  {error}
                </div>
              )}

              {/* Step 2 Actions Row */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#11052C] hover:bg-[#1D0C3A] border border-[#5A2C81] hover:border-yellow-400/70 text-purple-200 hover:text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer order-2 sm:order-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Back to Details</span>
                </button>

                {/* Submit Button with Graphic Asset & Ornate Glow Effect */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex-1 min-h-[48px] sm:min-h-[54px] flex justify-center items-center relative group focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed order-1 sm:order-2 cursor-pointer"
                >
                  {/* Ambient Background Gold Glow */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-10 sm:h-12 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full blur-xl opacity-75 group-hover:opacity-100 group-hover:blur-2xl transition-all duration-300 pointer-events-none" />

                  <div className="relative w-full flex items-center justify-center transform group-hover:scale-[1.03] group-active:scale-[0.98] transition-all duration-300 drop-shadow-[0_4px_20px_rgba(234,179,8,0.6)] group-hover:drop-shadow-[0_6px_30px_rgba(250,204,21,0.9)]">
                    <img
                      src="/assets/images/creat-room-btn.png"
                      alt="Create Game Room"
                      className="w-auto h-12 sm:h-14 max-w-[280px] xs:max-w-[320px] sm:max-w-[360px] object-contain block mx-auto pointer-events-none"
                    />
                    {loading && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center gap-2 text-yellow-300 font-black text-xs sm:text-sm">
                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        <span>Creating Room...</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
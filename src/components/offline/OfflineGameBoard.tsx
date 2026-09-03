import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Crown, Trophy, Bot, Sparkles, CheckCircle2, ArrowRight, RotateCcw, LogOut, Lock, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { OfflineGameConfig } from './OfflineSetup';

interface OfflinePlayer {
  id: string;
  name: string;
  avatar: string;
  isAi: boolean;
  score: number;
  role?: 'Raja' | 'Rani' | 'Police' | 'Thief' | null;
  selectedCardId?: string | null;
  roundScore?: number;
}

interface CardState {
  id: string;
  selectedBy: string | null;
  role: 'Raja' | 'Rani' | 'Police' | 'Thief';
}

interface OfflineGameBoardProps {
  config: OfflineGameConfig;
  onExit: () => void;
  onPlayAgain: () => void;
}

const ROLE_INFO: Record<
  string,
  { title: string; subtitle: string; colorClass: string; borderClass: string; points: number; imageSrc: string; videoSrc: string }
> = {
  Raja: {
    title: 'RAJA',
    subtitle: 'King of the Kingdom',
    colorClass: 'from-amber-400 via-yellow-400 to-amber-500 text-amber-950',
    borderClass: 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]',
    points: 1000,
    imageSrc: '/assets/images/raja.png',
    videoSrc: '/assets/raja.mp4',
  },
  Rani: {
    title: 'RANI',
    subtitle: 'Queen of the Kingdom',
    colorClass: 'from-pink-400 via-fuchsia-400 to-pink-500 text-white',
    borderClass: 'border-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.6)]',
    points: 800,
    imageSrc: '/assets/images/rani.png',
    videoSrc: '/assets/rani.mp4',
  },
  Police: {
    title: 'POLICE',
    subtitle: "The Kingdom's Investigator",
    colorClass: 'from-blue-400 via-cyan-400 to-blue-500 text-white',
    borderClass: 'border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)]',
    points: 500,
    imageSrc: '/assets/images/police.png',
    videoSrc: '/assets/police.mp4',
  },
  Thief: {
    title: 'THIEF',
    subtitle: 'The Secret Culprit',
    colorClass: 'from-emerald-400 via-teal-400 to-emerald-500 text-slate-950',
    borderClass: 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)]',
    points: 500,
    imageSrc: '/assets/images/thief.png',
    videoSrc: '/assets/thief.mp4',
  },
};

type OfflinePhase = 'card-selection' | 'role-reveal' | 'police-reveal' | 'guessing' | 'round-result' | 'game-over';

export const OfflineGameBoard: React.FC<OfflineGameBoardProps> = ({
  config,
  onExit,
  onPlayAgain,
}) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<OfflinePhase>('card-selection');

  // Initialize 4 players (1 Human + 3 AI with random names from config)
  const [players, setPlayers] = useState<OfflinePlayer[]>(() => {
    const defaultBots = [
      { id: 'bot_1', name: 'Vikram', color: 'from-amber-500 to-yellow-400' },
      { id: 'bot_2', name: 'Maya', color: 'from-fuchsia-500 to-pink-400' },
      { id: 'bot_3', name: 'Kabir', color: 'from-blue-500 to-cyan-400' },
    ];
    const bots = config.aiOpponents && config.aiOpponents.length === 3 ? config.aiOpponents : defaultBots;

    return [
      { id: 'human', name: config.playerName, avatar: config.avatar, isAi: false, score: 0 },
      { id: bots[0].id || 'bot_1', name: bots[0].name, avatar: 'bot', isAi: true, score: 0 },
      { id: bots[1].id || 'bot_2', name: bots[1].name, avatar: 'bot', isAi: true, score: 0 },
      { id: bots[2].id || 'bot_3', name: bots[2].name, avatar: 'bot', isAi: true, score: 0 },
    ];
  });

  const [cards, setCards] = useState<CardState[]>([]);
  const [policeId, setPoliceId] = useState<string>('');
  const [guessedThiefId, setGuessedThiefId] = useState<string>('');
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>('');
  const [, setIsAiThinking] = useState<boolean>(false);
  const [policeAnnouncement, setPoliceAnnouncement] = useState<string>('');

  // Initialize a new round
  const startNewRound = useCallback((_roundNum: number) => {
    // Shuffle roles
    const roles: ('Raja' | 'Rani' | 'Police' | 'Thief')[] = ['Raja', 'Rani', 'Police', 'Thief'];
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    const initialCards: CardState[] = [
      { id: 'card-0', selectedBy: null, role: roles[0] },
      { id: 'card-1', selectedBy: null, role: roles[1] },
      { id: 'card-2', selectedBy: null, role: roles[2] },
      { id: 'card-3', selectedBy: null, role: roles[3] },
    ];

    setCards(initialCards);
    setPoliceId('');
    setGuessedThiefId('');
    setSelectedSuspectId('');
    setIsAiThinking(false);
    setPoliceAnnouncement('');
    setPhase('card-selection');

    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        role: null,
        selectedCardId: null,
        roundScore: 0,
      }))
    );
  }, []);

  // Initialize on mount
  useEffect(() => {
    startNewRound(1);
  }, [startNewRound]);

  // Handle human selecting a card
  const handleSelectCard = (cardId: string) => {
    if (phase !== 'card-selection') return;
    const humanPlayer = players.find((p) => !p.isAi);
    if (!humanPlayer || humanPlayer.selectedCardId) return;

    const selectedCard = cards.find((c) => c.id === cardId);
    if (!selectedCard || selectedCard.selectedBy) return;

    // Human takes this card
    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, selectedBy: 'human' } : c
    );
    setCards(updatedCards);

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 'human'
          ? { ...p, selectedCardId: cardId, role: selectedCard.role }
          : p
      )
    );

    // AI players choose remaining cards sequentially with natural delays
    const aiBots = players.filter((p) => p.isAi).map((p) => p.id);

    aiBots.forEach((botId, index) => {
      setTimeout(() => {
        setCards((currCards) => {
          const available = currCards.filter((c) => c.selectedBy === null);
          if (available.length === 0) return currCards;
          const assigned = available[0];

          setPlayers((currPlayers) =>
            currPlayers.map((p) =>
              p.id === botId
                ? { ...p, selectedCardId: assigned.id, role: assigned.role }
                : p
            )
          );

          return currCards.map((c) =>
            c.id === assigned.id ? { ...c, selectedBy: botId } : c
          );
        });

        // When last bot finishes selecting
        if (index === aiBots.length - 1) {
          setTimeout(() => {
            setPhase('role-reveal');
          }, 600);
        }
      }, (index + 1) * 350);
    });
  };

  // Once role-reveal is shown, transition to police reveal phase
  useEffect(() => {
    if (phase === 'role-reveal') {
      const timer = setTimeout(() => {
        // Find who the police is
        const pol = players.find((p) => p.role === 'Police');
        if (pol) {
          setPoliceId(pol.id);
        }
        setPhase('police-reveal');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [phase, players]);

  // Handle police reveal logic
  useEffect(() => {
    if (phase === 'police-reveal') {
      const pol = players.find((p) => p.role === 'Police');
      if (pol && pol.isAi) {
        // AI is Police: announce after a brief pause
        const timer = setTimeout(() => {
          setPoliceAnnouncement(`${pol.name}: "I am Police and going to catch the thief Now 😎"`);
          setTimeout(() => {
            setPhase('guessing');
          }, 1800);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, players]);

  // Human Police clicks Reveal
  const handleHumanPoliceReveal = () => {
    setPoliceAnnouncement(`You: "I am Police and going to catch the thief Now 😎"`);
    setPhase('guessing');
  };

  // AI Police Guessing Logic
  useEffect(() => {
    if (phase === 'guessing') {
      const pol = players.find((p) => p.id === policeId);
      if (pol && pol.isAi) {
        setIsAiThinking(true);
        // AI chooses one of the non-police players after 2.2s thinking
        const suspects = players.filter((p) => p.id !== policeId);
        const timer = setTimeout(() => {
          // AI makes a guess (smart AI with 60% accuracy or random)
          const actualThief = players.find((p) => p.role === 'Thief');
          let chosenId = '';
          if (Math.random() < 0.6 && actualThief) {
            chosenId = actualThief.id;
          } else {
            const randomIndex = Math.floor(Math.random() * suspects.length);
            chosenId = suspects[randomIndex].id;
          }

          setIsAiThinking(false);
          handleFinalGuess(chosenId);
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, policeId, players]);

  // Human Police submits guess
  const handleHumanGuess = () => {
    if (!selectedSuspectId) return;
    handleFinalGuess(selectedSuspectId);
  };

  // Evaluate Round Result
  const handleFinalGuess = (guessedId: string) => {
    setGuessedThiefId(guessedId);

    const thiefPlayer = players.find((p) => p.role === 'Thief');
    const isCorrect = thiefPlayer ? thiefPlayer.id === guessedId : false;

    // Calculate round points
    const updatedPlayers = players.map((p) => {
      let earned = 0;
      if (p.role === 'Raja') {
        earned = 1000;
      } else if (p.role === 'Rani') {
        earned = 800;
      } else if (p.role === 'Police') {
        earned = isCorrect ? 500 : 0;
      } else if (p.role === 'Thief') {
        earned = isCorrect ? 0 : 500;
      }

      return {
        ...p,
        roundScore: earned,
        score: p.score + earned,
      };
    });

    setPlayers(updatedPlayers);
    setPhase('round-result');
  };

  // Next round or game over check
  const handleNextRound = () => {
    const isGameOver =
      config.winCondition === 'rounds'
        ? currentRound >= config.totalRounds
        : players.some((p) => p.score >= config.targetScore);

    if (isGameOver) {
      setPhase('game-over');
    } else {
      const nextRoundNum = currentRound + 1;
      setCurrentRound(nextRoundNum);
      startNewRound(nextRoundNum);
    }
  };

  const humanPlayer = players.find((p) => p.id === 'human');
  const myRole = humanPlayer?.role;
  const isHumanPolice = myRole === 'Police';

  // Sorted leaderboard for game over
  const sortedLeaderboard = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedLeaderboard[0];

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between p-3 sm:p-6 relative text-white font-sans bg-[#0A041A] bg-cover bg-center bg-no-repeat select-none overflow-y-auto"
      style={{ backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')" }}
    >
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080320]/70 via-[#160628]/40 to-[#080320]/85 pointer-events-none" />

      {/* TOP BAR: ROUND & LIVE SCOREBOARD */}
      <header className="relative z-30 w-full max-w-5xl mx-auto flex items-center justify-between gap-3 pb-3 border-b border-purple-900/60">
        {/* Left: Offline Mode Badge & Round */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase">
            <Bot className="w-3.5 h-3.5" />
            <span>Offline AI</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-bold text-gray-200">
            {config.winCondition === 'rounds'
              ? `Round ${currentRound} / ${config.totalRounds}`
              : `Target: ${config.targetScore} Pts`}
          </div>
        </div>

        {/* Center: Live Players Score Pill */}
        <div className="hidden md:flex items-center gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                p.id === 'human'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                  : 'bg-purple-950/60 border-purple-500/30 text-gray-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                p.isAi ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-900 text-white'
              }`}>
                {p.isAi ? <Bot className="w-3.5 h-3.5" /> : (p.avatar || '1')}
              </span>
              <span className="truncate max-w-[70px]">{p.name}</span>
              <span className="text-white font-extrabold">{p.score}</span>
            </div>
          ))}
        </div>

        {/* Right: Leave Game Button */}
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to exit this offline game?')) {
              onExit();
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          title="Exit Game"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </header>

      {/* MAIN GAMEPLAY CONTENT AREA */}
      <main className="relative z-20 w-full max-w-4xl mx-auto my-auto py-4 flex flex-col items-center">

        {/* PHASE 1: CARD SELECTION */}
        {phase === 'card-selection' && (
          <div className="w-full flex flex-col items-center text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Pick Your Secret Card</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif uppercase tracking-wider">
                Select A Card To Reveal Your Role
              </h2>
              <p className="text-xs text-gray-300">
                Cards will be dealt secretly among you and the 3 AI bots
              </p>
            </motion.div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl">
              {cards.map((card, idx) => {
                const isSelectedByHuman = card.selectedBy === 'human';
                const isTaken = card.selectedBy !== null;
                const selector = players.find((p) => p.id === card.selectedBy);

                return (
                  <motion.div
                    key={card.id}
                    whileHover={!isTaken ? { scale: 1.05, y: -6 } : {}}
                    whileTap={!isTaken ? { scale: 0.95 } : {}}
                    onClick={() => handleSelectCard(card.id)}
                    className={`relative aspect-[3/4] rounded-2xl p-4 flex flex-col items-center justify-between transition-all duration-300 select-none border-2 cursor-pointer ${
                      isSelectedByHuman
                        ? 'bg-gradient-to-b from-amber-500/30 to-purple-950 border-amber-400 shadow-[0_0_30px_rgba(255,215,0,0.6)]'
                        : isTaken
                        ? 'bg-purple-950/40 border-purple-800/40 opacity-70 cursor-not-allowed'
                        : 'bg-gradient-to-b from-[#2A0845] via-[#1B0530] to-[#120220] border-amber-500/50 hover:border-yellow-300 shadow-[0_8px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_0_25px_rgba(255,215,0,0.4)]'
                    }`}
                  >
                    <div className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                      CARD {idx + 1}
                    </div>

                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-inner">
                      {isTaken ? (
                        <Lock className="w-8 h-8 text-amber-400/80" />
                      ) : (
                        <HelpCircle className="w-8 h-8 text-amber-300 animate-pulse" />
                      )}
                    </div>

                    <div className="text-xs font-bold text-center">
                      {isTaken ? (
                        <span className="text-amber-300 flex items-center gap-1 justify-center">
                          {selector?.isAi ? <Bot className="w-3.5 h-3.5 text-amber-300" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {selector?.name || 'Selected'}
                        </span>
                      ) : (
                        <span className="text-gray-300">Tap to Choose</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHASE 2: ROLE REVEAL */}
        {phase === 'role-reveal' && humanPlayer?.role && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#1F0838] via-[#120324] to-[#1F0838] border-2 ${ROLE_INFO[humanPlayer.role].borderClass} rounded-3xl p-6 sm:p-7 text-center space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Your Secret Role</span>
            </div>

            {/* Graphical Role Character Presentation */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_30px_rgba(251,226,120,0.4)] bg-black/60 flex items-center justify-center">
              <video
                src={ROLE_INFO[humanPlayer.role].videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black tracking-wider text-amber-300 font-serif uppercase">
                {ROLE_INFO[humanPlayer.role].title}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-gray-300">
                {ROLE_INFO[humanPlayer.role].subtitle}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-xs font-extrabold shadow-md">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>
                {humanPlayer.role === 'Police'
                  ? 'Caught: 500 Pts | Missed: 0 Pts'
                  : humanPlayer.role === 'Thief'
                  ? 'Escaped: 500 Pts | Caught: 0 Pts'
                  : `Reward: ${ROLE_INFO[humanPlayer.role].points} Points`}
              </span>
            </div>

            <div className="text-[11px] text-amber-400/90 font-bold animate-pulse pt-1">
              Preparing Police Investigation phase...
            </div>
          </motion.div>
        )}

        {/* PHASE 3: POLICE REVEAL */}
        {phase === 'police-reveal' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg text-center space-y-6"
          >
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif uppercase tracking-wider">
                Police Reveal Phase
              </h2>
              <p className="text-xs text-gray-300">
                The Police must identify themselves and prepare to catch the Thief!
              </p>
            </div>

            {isHumanPolice ? (
              <div className="p-6 rounded-3xl bg-[#14082B]/90 border-2 border-blue-400/60 space-y-4 shadow-xl">
                <p className="text-sm font-bold text-blue-300">
                  You are the POLICE! Click below to announce yourself to the kingdom.
                </p>
                <button
                  onClick={handleHumanPoliceReveal}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-400 hover:to-cyan-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-all cursor-pointer transform hover:scale-105"
                >
                  I AM POLICE — FIND THE THIEF 🕵️
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-[#14082B]/90 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Waiting for Police to step forward...</span>
                </div>
                {policeAnnouncement && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3 rounded-xl bg-blue-950/80 border border-blue-400/50 text-blue-200 text-xs font-bold"
                  >
                    {policeAnnouncement}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* PHASE 4: GUESSING PHASE */}
        {phase === 'guessing' && (
          <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 text-xs font-black uppercase">
                <Shield className="w-3.5 h-3.5" />
                <span>Police Investigation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif uppercase tracking-wider">
                Who Is The Thief?
              </h2>
              {policeAnnouncement && (
                <p className="text-xs text-amber-300 font-bold">{policeAnnouncement}</p>
              )}
            </div>

            {/* If Human is Police */}
            {isHumanPolice ? (
              <div className="w-full space-y-6">
                <p className="text-xs text-gray-300">
                  Select one of the 3 suspects below and confirm your catch:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                  {players
                    .filter((p) => p.id !== 'human')
                    .map((suspect) => {
                      const isSelected = selectedSuspectId === suspect.id;
                      return (
                        <motion.div
                          key={suspect.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedSuspectId(suspect.id)}
                          className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-gradient-to-b from-red-950/80 to-purple-950 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                              : 'bg-purple-950/50 border-purple-500/30 hover:border-purple-400'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-800 to-indigo-900 border-2 border-purple-400/60 flex items-center justify-center text-amber-300 shadow-md">
                            <Bot className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-white">{suspect.name}</h4>
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Suspect</span>
                          </div>
                          <button
                            type="button"
                            className={`w-full py-2 rounded-xl text-xs font-black uppercase transition-all ${
                              isSelected
                                ? 'bg-red-500 text-white shadow'
                                : 'bg-purple-900/60 text-gray-300'
                            }`}
                          >
                            {isSelected ? 'Selected as Thief' : 'Choose Suspect'}
                          </button>
                        </motion.div>
                      );
                    })}
                </div>

                <button
                  onClick={handleHumanGuess}
                  disabled={!selectedSuspectId}
                  className={`py-3.5 px-8 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition-all ${
                    selectedSuspectId
                      ? 'bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:scale-105'
                      : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                  }`}
                >
                  CATCH AS THIEF 🚨
                </button>
              </div>
            ) : (
              /* AI is Police */
              <div className="p-8 rounded-3xl bg-[#14082B]/90 border-2 border-blue-500/40 w-full max-w-md text-center space-y-4 shadow-xl">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400">
                  <Bot className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white">
                    AI Police ({players.find((p) => p.id === policeId)?.name}) Is Analyzing Suspects...
                  </h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Examining bluffs, player expressions, and kingdom clues
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 5: ROUND RESULT */}
        {phase === 'round-result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-[#14082B]/95 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-8 space-y-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            {/* Header: Caught or Escaped */}
            {(() => {
              const thiefPlayer = players.find((p) => p.role === 'Thief');
              const polPlayer = players.find((p) => p.role === 'Police');
              const isCorrect = thiefPlayer ? thiefPlayer.id === guessedThiefId : false;

              return (
                <div className="text-center space-y-2">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase shadow-lg ${
                      isCorrect
                        ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                        : 'bg-red-500/20 border border-red-400 text-red-300'
                    }`}
                  >
                    {isCorrect ? '✅ POLICE CAUGHT THE THIEF!' : '🥷 THIEF ESCAPED!'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-serif uppercase tracking-wider">
                    Round {currentRound} Results
                  </h2>
                  <p className="text-xs text-gray-300">
                    Police ({polPlayer?.name}) guessed{' '}
                    <strong>{players.find((p) => p.id === guessedThiefId)?.name}</strong>. Actual Thief was{' '}
                    <strong>{thiefPlayer?.name}</strong>.
                  </p>
                </div>
              );
            })()}

            {/* 4 Players Revealed Roles & Points Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {players.map((p) => {
                const info = p.role ? ROLE_INFO[p.role] : null;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center text-center justify-between space-y-2 ${
                      p.id === 'human'
                        ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                        : 'bg-purple-950/60 border-purple-500/30'
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-md bg-purple-950 flex items-center justify-center">
                      {info?.imageSrc ? (
                        <img src={info.imageSrc} alt={p.role || ''} className="w-full h-full object-contain p-1" />
                      ) : p.isAi ? (
                        <Bot className="w-6 h-6 text-amber-300" />
                      ) : (
                        <span className="text-white font-bold">{p.avatar || '1'}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white truncate max-w-[90px]">{p.name}</h4>
                      <span className="text-[10px] font-extrabold uppercase text-amber-300">
                        {p.role || 'Unknown'}
                      </span>
                    </div>
                    <div className="w-full pt-1 border-t border-purple-800/40">
                      <div className="text-[11px] font-black text-emerald-400">
                        +{p.roundScore || 0} pts
                      </div>
                      <div className="text-[10px] text-gray-400">Total: {p.score}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Round Button */}
            <div className="pt-2">
              <button
                onClick={handleNextRound}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:scale-[1.02]"
              >
                <span>CONTINUE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 6: GAME OVER LEADERBOARD */}
        {phase === 'game-over' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-[#14082B]/95 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_50px_rgba(255,215,0,0.5)] backdrop-blur-2xl"
          >
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,215,0,0.8)]">
                <Crown className="w-9 h-9 fill-black" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif uppercase tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                Match Complete!
              </h2>
              <p className="text-xs text-amber-200 font-bold">
                Winner: {winner.name} ({winner.score} Points)
              </p>
            </div>

            {/* Final Standings */}
            <div className="space-y-2">
              {sortedLeaderboard.map((p, rank) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl flex items-center justify-between border ${
                    rank === 0
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold shadow-md'
                      : 'bg-purple-950/60 border-purple-500/30 text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-sm">#{rank + 1}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      p.isAi ? 'bg-gradient-to-tr from-amber-600/30 to-purple-900 border border-amber-400 text-amber-300' : 'bg-purple-900 border border-purple-400 text-white'
                    }`}>
                      {p.isAi ? <Bot className="w-4 h-4" /> : (p.avatar || '1')}
                    </div>
                    <span className="font-bold text-xs sm:text-sm">{p.name} {p.id === 'human' && '(You)'}</span>
                  </div>
                  <div className="font-black text-sm text-white">{p.score} pts</div>
                </div>
              ))}
            </div>

            {/* Action Buttons: Play Again & Exit */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onPlayAgain}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>

              <button
                onClick={onExit}
                className="py-3.5 rounded-2xl bg-purple-900/80 hover:bg-purple-800 border border-purple-500/50 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Menu</span>
              </button>
            </div>
          </motion.div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="relative z-20 text-center py-2 text-[10px] text-gray-400">
        Raja Rani Police Thief • Offline Casual Mode
      </footer>
    </div>
  );
};

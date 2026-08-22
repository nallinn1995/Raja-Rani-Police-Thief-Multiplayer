import React, { useState, useEffect, useRef } from "react";
import { SuspectCardData } from "../../types/detectiveChallenge";
import { SuspectCard } from "./SuspectCard";
import { Timer, Search, ShieldCheck, CheckCircle2 } from "lucide-react";

interface InvestigateGameViewProps {
  roundNumber: number;
  totalRounds: number;
  suspectCards: SuspectCardData[];
  onSubmitGuess: (cardId: string, guessTime: number) => void;
  submittedPlayersCount: number;
  totalPlayersCount: number;
  hasSubmitted: boolean;
}

export const InvestigateGameView: React.FC<InvestigateGameViewProps> = ({
  roundNumber,
  totalRounds,
  suspectCards,
  onSubmitGuess,
  submittedPlayersCount,
  totalPlayersCount,
  hasSubmitted,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<number>(0.0);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);

  // Live Timer Counter
  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsedTime(0.0);
    setTimerActive(true);
    setSelectedCardId("");

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = (now - startTimeRef.current) / 1000;
      setElapsedTime(parseFloat(diff.toFixed(2)));
    }, 50);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [roundNumber]);

  const handleCardSelection = (cardId: string) => {
    if (hasSubmitted || !timerActive) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerActive(false);

    const finalGuessTime = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(2));
    setSelectedCardId(cardId);
    onSubmitGuess(cardId, finalGuessTime);
  };

  return (
    <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto text-white font-sans">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDuration: Math.random() * 3 + 2 + "s",
              animationDelay: Math.random() * 2 + "s",
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-5xl space-y-6 relative z-10 my-4">
        {/* Game Header Bar */}
        <div className="bg-[#1D0C3A]/95 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(147,51,234,0.3)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#11052C] border border-[#5A2C81] flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-black rounded-full uppercase tracking-wider">
                  Detective Challenge
                </span>
                <span className="text-xs text-purple-300 font-bold">
                  Round {roundNumber} of {totalRounds}
                </span>
              </div>
              <h1
                className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide mt-1"
                style={{ filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.8))" }}
              >
                Identify the Secret Thief
              </h1>
            </div>
          </div>

          {/* Live Timer Display */}
          <div className="flex items-center space-x-6 bg-[#11052C] border border-[#5A2C81] px-5 py-3 rounded-2xl shadow-md">
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest block">
                Decision Speed
              </span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 flex items-center gap-1">
                <Timer className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span>{elapsedTime.toFixed(2)}s</span>
              </span>
            </div>

            <div className="border-l border-[#3A1C61] pl-5 text-right">
              <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest block">
                Submissions
              </span>
              <span className="text-base font-black text-emerald-400">
                {submittedPlayersCount} / {totalPlayersCount}
              </span>
            </div>
          </div>
        </div>

        {/* Hidden Selections Notice */}
        <div className="bg-[#1D0C3A]/90 border border-[#5A2C81] rounded-2xl p-4 text-center text-xs text-purple-200 flex items-center justify-center space-x-2 shadow-lg">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="tracking-wide">
            Selections remain hidden until all Detectives submit their suspect accusation.
          </span>
        </div>

        {/* 3 Suspect Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {suspectCards.map((card) => (
            <SuspectCard
              key={card.cardId}
              card={card}
              isSelected={selectedCardId === card.cardId}
              isDisabled={hasSubmitted}
              onSelect={handleCardSelection}
            />
          ))}
        </div>

        {/* Submission Waiting State */}
        {hasSubmitted && (
          <div className="p-5 rounded-2xl bg-[#1D0C3A]/95 border border-cyan-500/50 text-center space-y-2 animate-pulse shadow-[0_0_25px_rgba(34,211,238,0.3)]">
            <div className="flex items-center justify-center space-x-2 text-cyan-300 font-extrabold text-base">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span>Accusation Locked in {elapsedTime.toFixed(2)} seconds!</span>
            </div>
            <p className="text-xs text-purple-200">
              Waiting for remaining Detectives to complete their investigation ({submittedPlayersCount} / {totalPlayersCount} submitted)...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

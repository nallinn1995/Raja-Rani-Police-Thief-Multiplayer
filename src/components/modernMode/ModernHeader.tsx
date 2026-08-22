import React from 'react';
import { Crown, Clock, Users, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

interface ModernHeaderProps {
  roomCode: string;
  currentPhase: string;
  timerSeconds: number;
  maxTimerSeconds: number;
  playerCount: number;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  roomCode,
  currentPhase,
  timerSeconds,
  maxTimerSeconds = 25,
  playerCount = 6,
}) => {
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room Code Copied!');
  };

  const getPhaseDisplay = (phase: string) => {
    switch (phase) {
      case 'mantri-shield':
        return {
          title: '🏛️ Mantri Royal Shield',
          subtitle: 'Secret protection active',
          color: 'from-indigo-600 to-purple-600',
        };
      case 'loot-animation':
        return {
          title: '🕵️ Thief Looting Kingdom',
          subtitle: 'Secret loot in progress...',
          color: 'from-emerald-600 to-teal-600',
        };
      case 'royal-phase':
        return {
          title: '🏰 Royal Court Session',
          subtitle: 'King and Queen are searching for each other...',
          color: 'from-purple-600 via-indigo-600 to-pink-600',
        };
      case 'investigation-phase':
        return {
          title: '🚨 Investigation in Progress',
          subtitle: 'Police is identifying the culprit...',
          color: 'from-blue-600 via-cyan-600 to-slate-800',
        };
      case 'witness-phase':
        return {
          title: '👨 Witness Statement',
          subtitle: 'Villager is judging the investigation...',
          color: 'from-amber-600 to-orange-600',
        };
      case 'result-phase':
        return {
          title: '📜 Round Results',
          subtitle: 'Royal investigation complete',
          color: 'from-yellow-600 to-amber-700',
        };
      default:
        return {
          title: '👑 Modern Mode',
          subtitle: 'Kingdom Match',
          color: 'from-purple-800 to-indigo-900',
        };
    }
  };

  const phaseData = getPhaseDisplay(currentPhase);
  const timerPercentage = maxTimerSeconds > 0 ? (timerSeconds / maxTimerSeconds) * 100 : 100;

  return (
    <header className="w-full bg-[#1A0B2E]/90 backdrop-blur-xl border-b border-purple-800/40 px-4 py-3 sticky top-0 z-40 text-white shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Mode Title & Room Code */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-black font-black shadow-md shrink-0">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 tracking-wide title-font leading-none">
                MODERN MODE
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-sans mt-0.5">
                <span>Code:</span>
                <code
                  onClick={copyRoomCode}
                  className="bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-yellow-300 font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-1"
                >
                  {roomCode}
                  <Copy className="w-3 h-3 text-purple-400" />
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-700/50 text-xs font-semibold text-purple-200">
            <Users className="w-3.5 h-3.5 text-yellow-400" />
            <span>{playerCount} / 6</span>
          </div>
        </div>

        {/* Center: Current Phase Badge */}
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${phaseData.color} text-white font-bold text-xs sm:text-sm tracking-wide shadow-md border border-white/20 flex items-center gap-2`}
          >
            <span>{phaseData.title}</span>
          </div>
          <p className="text-[11px] text-gray-300 font-sans mt-1 hidden sm:block">
            {phaseData.subtitle}
          </p>
        </div>

        {/* Right: Animated Countdown Timer */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
          {timerSeconds >= 0 && (
            <div className="flex items-center gap-3 bg-purple-950/80 border border-purple-700/60 px-4 py-1.5 rounded-2xl shadow-inner">
              <div className="relative flex items-center justify-center w-8 h-8">
                <Clock
                  className={`w-5 h-5 ${
                    timerSeconds <= 5 ? 'text-rose-400 animate-bounce' : 'text-yellow-400'
                  }`}
                />
              </div>
              <div>
                <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider leading-none mb-0.5">
                  Time Remaining
                </div>
                <div
                  className={`text-lg font-black font-mono leading-none ${
                    timerSeconds <= 5 ? 'text-rose-400 animate-pulse' : 'text-yellow-300'
                  }`}
                >
                  {timerSeconds}s
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar under Header */}
      {timerSeconds >= 0 && maxTimerSeconds > 0 && (
        <div className="w-full bg-purple-950/60 h-1 mt-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              timerSeconds <= 5
                ? 'bg-rose-500'
                : timerSeconds <= 12
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      )}
    </header>
  );
};

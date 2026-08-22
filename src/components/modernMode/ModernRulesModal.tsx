import React, { useState } from 'react';
import { Scroll, Play, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernRulesModalProps {
  isHost: boolean;
  readyCount: number;
  totalPlayers: number;
  isReady: boolean;
  allReady: boolean;
  onToggleReady: (ready: boolean) => void;
  onStartGame: () => void;
}

const RULE_STEPS = [
  {
    id: 1,
    emoji: '🏛️',
    image: '/assets/images/mantri.png',
    title: 'STEP 1: Mantri Royal Shield',
    subtitle: 'Pre-Game Secret Protection',
    description: 'Before the Thief loot phase begins, Mantri secretly selects 1 kingdom member (Raja, Rani, Police, or Villager) to protect.',
    detail: 'If the protected member is targeted by the Thief, their 100 points are PREVENTED from being stolen! Successful shield earns Mantri a +100 Support Bonus!',
    color: 'from-indigo-900/90 via-purple-900/90 to-indigo-950/90',
    borderColor: 'border-indigo-500/50',
    badge: 'Secret Shield',
  },
  {
    id: 2,
    emoji: '🕵️',
    image: '/assets/images/thief.png',
    title: 'STEP 2: Thief Secret Loot Phase',
    subtitle: 'Automatic Kingdom Looting',
    description: 'Immediately after roles are secretly assigned, the Thief automatically steals 100 points from every unshielded kingdom member.',
    detail: 'Looted points are accumulated into the Thief’s temporary loot vault (up to 500 pts). Kingdom members lose 100 points unless shielded by Mantri!',
    color: 'from-emerald-900/90 via-teal-900/90 to-slate-950/90',
    borderColor: 'border-emerald-500/50',
    badge: 'Automated Loot',
  },
  {
    id: 3,
    emoji: '👑',
    image: '/assets/images/raja.png',
    title: 'STEP 3: Royal Court Session (25s)',
    subtitle: 'Raja & Rani Mutual Intuition',
    description: 'Raja and Rani have 25 seconds during the Royal Phase to secretly identify each other across the 6-player table.',
    detail: 'Raja finding Rani = +100 Bonus. Rani finding Raja = +100 Bonus. Wrong intuition guesses incur ZERO point penalty!',
    color: 'from-purple-900/90 via-pink-900/90 to-amber-950/90',
    borderColor: 'border-amber-500/50',
    badge: '25s Royal Phase',
  },
  {
    id: 4,
    emoji: '👮',
    image: '/assets/images/police.png',
    title: 'STEP 4: Police Investigation (25s)',
    subtitle: 'Public Culprit Accusation',
    description: 'Police is publicly revealed to all players and gets 25 seconds to investigate and accuse the Thief.',
    detail: 'Police Catching Thief: Police earns 500 base + 100 Catch Bonus, Thief score becomes 0, and stolen loot returns to kingdom! Wrong Accusation: Police = 0, Thief keeps all stolen loot.',
    color: 'from-blue-900/90 via-cyan-900/90 to-[#12072B]',
    borderColor: 'border-cyan-400/50',
    badge: '25s Police Phase',
  },
  {
    id: 5,
    emoji: '👨',
    image: '/assets/images/villager.png',
    title: 'STEP 5: Villager Witness Statement (10s)',
    subtitle: 'Interactive Verdict Judgment',
    description: 'After Police submits their guess, Villager gets a 10-second popup modal to Agree (👍) or Disagree (👎) with the investigation.',
    detail: 'Police Correct + Agree = +100 Witness Bonus! Police Wrong + Disagree = +100 Insight Bonus!',
    color: 'from-amber-900/90 via-orange-900/90 to-purple-950/90',
    borderColor: 'border-orange-500/50',
    badge: '10s Witness Modal',
  },
];

export const ModernRulesModal: React.FC<ModernRulesModalProps> = ({
  isHost,
  readyCount,
  totalPlayers = 6,
  isReady,
  allReady,
  onToggleReady,
  onStartGame,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasConfirmed, setHasConfirmed] = useState(isReady);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasConfirmed(checked);
    onToggleReady(checked);
  };

  const nextSlide = () => {
    if (currentSlide < RULE_STEPS.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const activeStep = RULE_STEPS[currentSlide];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-[#11052C]/90 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054]/95 via-[#11052C]/95 to-[#0A0217]/95 backdrop-blur-xl overflow-y-auto text-white font-sans">
      {/* Background Royal Particles */}
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

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#1D0C3A]/95 border-2 border-purple-500/50 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(147,51,234,0.45)] text-white relative z-10 my-auto overflow-hidden"
      >
        {/* Top Decorative Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center mb-5 relative z-10 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-900/70 border border-yellow-500/40 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Scroll className="w-3.5 h-3.5 text-yellow-400" />
            <span>Kingdom Strategy Guide</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 title-font tracking-wide drop-shadow-md">
            📜 Modern Mode Rules
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 font-sans">
            Browse rule cards below to master role mechanics and scoring!
          </p>
        </div>

        {/* CAROUSEL CONTAINER */}
        <div className="relative z-10 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Step {currentSlide + 1} of {RULE_STEPS.length}
            </span>
            <div className="flex gap-1.5">
              {RULE_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-6 bg-yellow-400' : 'w-2 bg-purple-800 hover:bg-purple-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={`p-5 rounded-2xl bg-gradient-to-b ${activeStep.color} border ${activeStep.borderColor} shadow-lg relative min-h-[190px] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/20 overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                      {activeStep.image ? (
                        <img src={activeStep.image} alt={activeStep.title} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-2xl">{activeStep.emoji}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-white tracking-wide">
                        {activeStep.title}
                      </h3>
                      <p className="text-xs text-purple-200 font-semibold">{activeStep.subtitle}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/20 text-[10px] font-bold text-yellow-300">
                    {activeStep.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-200 mt-3 font-sans leading-relaxed">
                  {activeStep.description}
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-yellow-200/90 font-medium">
                  💡 <span className="font-bold">Key Tactic:</span> {activeStep.detail}
                </div>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-xs font-bold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-[11px] font-semibold text-purple-300">
                  Slide {currentSlide + 1} / {RULE_STEPS.length}
                </div>

                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={currentSlide === RULE_STEPS.length - 1}
                  className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Readiness Counter Bar */}
        <div className="flex items-center justify-between bg-[#11052C]/90 p-3.5 rounded-xl border border-purple-700/50 mb-5 relative z-10 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-purple-200 font-semibold">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Players Ready Status:</span>
          </div>
          <div className="font-black text-yellow-400 font-mono text-sm">
            {readyCount} / {totalPlayers} Ready
          </div>
        </div>

        {/* Non-Host Checkbox confirmation */}
        {!isHost && (
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#11052C]/90 border border-purple-600/40 cursor-pointer hover:border-yellow-500 transition mb-5 relative z-10 text-xs sm:text-sm">
            <input
              type="checkbox"
              checked={hasConfirmed}
              onChange={handleCheckboxChange}
              className="w-5 h-5 accent-yellow-500 rounded cursor-pointer"
            />
            <span className="text-gray-200 font-semibold">
              I have read and understood the Modern Mode rules.
            </span>
          </label>
        )}

        {/* Action Controls Section */}
        <div className="relative z-10">
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!allReady}
              className={`w-full py-4 px-6 rounded-2xl font-black flex items-center justify-center gap-2 transition text-base uppercase tracking-wider shadow-xl ${
                allReady
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(234,179,8,0.5)] cursor-pointer'
                  : 'bg-purple-950/80 border border-purple-800/60 text-purple-400 cursor-not-allowed opacity-75'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {allReady
                  ? 'START GAME NOW'
                  : `Waiting for Players (${readyCount}/${totalPlayers} Ready)...`}
              </span>
            </button>
          ) : (
            <div className="w-full py-3.5 px-6 rounded-2xl bg-purple-900/60 border border-purple-700/50 text-center font-bold text-sm text-purple-200">
              {hasConfirmed
                ? '✅ You are READY. Waiting for Host to start match...'
                : 'Please check the box above to mark yourself READY.'}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

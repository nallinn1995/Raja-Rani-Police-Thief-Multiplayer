import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { IOSInstallModal } from './IOSInstallModal';

interface PWAInstallBannerProps {
  className?: string;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  className = '',
}) => {
  const {
    canInstall,
    isInstalled,
    isDismissed,
    showIOSModal,
    triggerInstall,
    dismissPrompt,
    closeIOSModal,
  } = usePWAInstall();

  // Subtle entrance delay: wait 2 seconds after mount to avoid initial layout shift or intrusive feel
  const [hasInteractedDelay, setHasInteractedDelay] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInteractedDelay(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Do not show if not installable, already installed, dismissed by user, or still in initial delay
  if (!canInstall || isInstalled || isDismissed || !hasInteractedDelay) {
    return (
      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={closeIOSModal}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#21073F]/90 via-[#190833]/95 to-[#21073F]/90 border border-[#FFD700]/45 hover:border-[#FFD700]/70 p-3.5 sm:p-4 shadow-[0_4px_25px_rgba(120,34,135,0.4)] backdrop-blur-xl transition-all duration-300 ${className}`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#AC41D7]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Dismiss button */}
          <button
            onClick={dismissPrompt}
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            title="Dismiss for now"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {/* Left: App Icon / Smartphone Badge with Royal Ring */}
            <div className="flex-shrink-0 relative">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-[0_0_15px_rgba(249,201,51,0.4)] flex items-center justify-center">
                <div className="w-full h-full bg-[#080320] rounded-[10px] flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-[#FBE278] group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#36D978] flex items-center justify-center text-black shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-black" />
              </div>
            </div>

            {/* Center: Text Details */}
            <div className="flex-1 text-center sm:text-left space-y-0.5 pr-0 sm:pr-4">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h4 className="text-xs sm:text-sm font-extrabold text-[#FBE278] tracking-wide font-serif drop-shadow-sm">
                  Play Raja Rani like an App
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200/90 font-medium leading-snug">
                Install the game on your phone for faster access and an app-like experience.
              </p>
            </div>

            {/* Right: Install Action Button */}
            <div className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
              <button
                onClick={() => triggerInstall()}
                className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#EB9C09] via-[#F9C933] to-[#EB9C09] hover:opacity-95 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(249,201,51,0.5)] hover:shadow-[0_0_25px_rgba(251,226,120,0.8)] transition-all transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Add to Home Screen</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={closeIOSModal}
      />
    </>
  );
};

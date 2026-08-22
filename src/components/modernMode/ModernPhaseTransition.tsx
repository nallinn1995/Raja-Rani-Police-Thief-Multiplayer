import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ModernPhaseTransitionProps {
  isVisible: boolean;
  title: string;
  subtitle: string;
  icon?: string;
}

export const ModernPhaseTransition: React.FC<ModernPhaseTransitionProps> = ({
  isVisible,
  title = "⚔️ Kingdom Security Alert!",
  subtitle = "Royal Investigation Complete. Police Investigation Begins...",
  icon = "👮",
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.7, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-lg bg-gradient-to-b from-[#2A0E4E] to-[#120524] border-2 border-yellow-500/60 rounded-3xl p-8 shadow-[0_0_80px_rgba(234,179,8,0.5)] text-center text-white relative overflow-hidden"
          >
            {/* Glowing Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-yellow-500/20 to-blue-600/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(250,204,21,0.6)] mb-4"
              >
                {icon}
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 title-font tracking-wide mb-2 drop-shadow-lg">
                {title}
              </h2>

              <p className="text-sm sm:text-base text-gray-200 font-sans max-w-sm leading-relaxed mb-6">
                {subtitle}
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-xs font-semibold text-yellow-300 animate-pulse">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Preparing Court Courtroom...</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

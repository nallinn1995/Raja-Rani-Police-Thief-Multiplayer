import React from 'react';
import { X, Share, PlusSquare, CheckCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#21073F] via-[#14072E] to-[#080320] border-2 border-[#FFD700]/60 p-6 text-white shadow-[0_0_40px_rgba(251,226,120,0.3)] select-none"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header with Royal Crown */}
          <div className="flex flex-col items-center text-center space-y-2 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-[0_0_20px_rgba(172,65,215,0.6)]">
              <div className="w-full h-full bg-[#080320] rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-[#FBE278]" />
              </div>
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FFD700] font-serif">
              Install Raja Rani on iOS
            </h3>
            <p className="text-xs text-purple-200">
              Follow these simple steps in Safari to add the game to your home screen:
            </p>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3.5 mb-6">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#2A0E4E]/80 border border-[#782287]/50">
              <div className="w-7 h-7 rounded-full bg-[#782287] text-[#FFD700] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  Tap Share <Share className="w-3.5 h-3.5 text-[#27B9E8]" />
                </p>
                <p className="text-gray-300 text-[11px] mt-0.5">
                  Tap the Safari Share button at the bottom of your screen.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#2A0E4E]/80 border border-[#782287]/50">
              <div className="w-7 h-7 rounded-full bg-[#782287] text-[#FFD700] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  Tap 'Add to Home Screen' <PlusSquare className="w-3.5 h-3.5 text-[#FBE278]" />
                </p>
                <p className="text-gray-300 text-[11px] mt-0.5">
                  Scroll down the options list and select Add to Home Screen.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#2A0E4E]/80 border border-[#782287]/50">
              <div className="w-7 h-7 rounded-full bg-[#782287] text-[#FFD700] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  Tap 'Add' <CheckCircle className="w-3.5 h-3.5 text-[#36D978]" />
                </p>
                <p className="text-gray-300 text-[11px] mt-0.5">
                  Tap Add in the top-right corner to finish installing.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#EB9C09] via-[#F9C933] to-[#EB9C09] hover:opacity-95 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(249,201,51,0.5)] transition-all transform active:scale-95 cursor-pointer"
          >
            Got It!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Smartphone, Share, MoreVertical, PlusSquare, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallConfirmModalProps {
  isOpen: boolean;
  isIOS?: boolean;
  isAndroid?: boolean;
  hasPrompt?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const InstallConfirmModal: React.FC<InstallConfirmModalProps> = ({
  isOpen,
  isIOS = false,
  isAndroid = false,
  hasPrompt = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#21073F] via-[#14072E] to-[#080320] border-2 border-[#FFD700]/70 p-6 text-white shadow-[0_0_50px_rgba(251,226,120,0.4)] my-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* App Icon & Title */}
          <div className="flex flex-col items-center text-center space-y-3 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-[0_0_20px_rgba(172,65,215,0.6)]">
              <div className="w-full h-full bg-[#080320] rounded-[14px] flex items-center justify-center overflow-hidden">
                <img
                  src="/icons/icon-192x192.png"
                  alt="Raja Rani App Icon"
                  className="w-11 h-11 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Smartphone className="w-8 h-8 text-[#FBE278] hidden only:block" />
              </div>
            </div>

            <h3 className="text-lg font-black uppercase tracking-wider text-[#FFD700] font-serif">
              Install Raja Rani
            </h3>

            {/* Direct Prompt Available or Desktop */}
            {hasPrompt ? (
              <p className="text-xs text-purple-200 leading-relaxed px-1">
                Add Raja Rani Police Thief to your Home screen or Desktop for instant loading, offline bots, and fullscreen play.
              </p>
            ) : isIOS ? (
              /* iOS Safari Instructions */
              <div className="w-full text-left space-y-2.5 pt-1">
                <p className="text-xs text-purple-200 text-center mb-2">
                  To install on iPhone or iPad Safari:
                </p>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#2A0E4E]/90 border border-[#782287]/60 text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#782287] text-[#FFD700] font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <span className="text-gray-200">
                    Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-[#27B9E8]" /> at the bottom
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#2A0E4E]/90 border border-[#782287]/60 text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#782287] text-[#FFD700] font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <span className="text-gray-200">
                    Scroll down and select <strong>'Add to Home Screen'</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#FBE278]" />
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#2A0E4E]/90 border border-[#782287]/60 text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#782287] text-[#FFD700] font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <span className="text-gray-200">
                    Tap <strong>'Add'</strong> in the top right corner
                  </span>
                </div>
              </div>
            ) : (
              /* Android / Mobile Browser Manual Fallback */
              <div className="w-full text-left space-y-2.5 pt-1">
                <p className="text-xs text-purple-200 text-center mb-2">
                  {isAndroid ? 'To install on your Android device:' : 'Add to your home screen via browser:'}
                </p>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#2A0E4E]/90 border border-[#782287]/60 text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#782287] text-[#FFD700] font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <span className="text-gray-200">
                    Tap browser menu <MoreVertical className="w-3.5 h-3.5 inline text-[#27B9E8]" /> (three dots)
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#2A0E4E]/90 border border-[#782287]/60 text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#782287] text-[#FFD700] font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <span className="text-gray-200">
                    Tap <strong>'Install app'</strong> or <strong>'Add to Home screen'</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {hasPrompt ? 'Cancel' : 'Close'}
            </button>

            {hasPrompt ? (
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#EB9C09] via-[#F9C933] to-[#EB9C09] hover:opacity-95 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(249,201,51,0.5)] hover:shadow-[0_0_25px_rgba(251,226,120,0.8)] transition-all transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Install Now</span>
              </button>
            ) : (
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#EB9C09] via-[#F9C933] to-[#EB9C09] hover:opacity-95 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(249,201,51,0.5)] transition-all transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-black" />
                <span>Got It!</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

// Aliases for compatibility
export const IOSInstallModal = InstallConfirmModal;
export const InstallGuideModal = InstallConfirmModal;

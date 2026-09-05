import React from "react";
import { Bell, Sparkles, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationSoftPromptProps {
  isOpen: boolean;
  isProcessing?: boolean;
  showDeniedHelp?: boolean;
  onEnable: () => void;
  onDismiss: () => void;
  className?: string;
}

export const NotificationSoftPrompt: React.FC<NotificationSoftPromptProps> = ({
  isOpen,
  isProcessing = false,
  showDeniedHelp = false,
  onEnable,
  onDismiss,
  className = "",
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-50 px-4 pointer-events-none flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#240842]/95 via-[#16052B]/98 to-[#0C0219]/98 border-2 border-[#FFD700]/70 p-5 sm:p-6 shadow-[0_0_40px_rgba(255,215,0,0.35)] backdrop-blur-2xl text-white ${className}`}
        >
          {/* Ambient Lighting & Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#AC41D7]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FFD700]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onDismiss}
            disabled={isProcessing}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close notification prompt"
          >
            <X className="w-4 h-4" />
          </button>

          {showDeniedHelp ? (
            /* Friendly Denied State */
            <div className="flex flex-col gap-3 text-left">
              <div className="flex items-center gap-2.5 text-[#FBE278]">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide text-white">
                    Notifications Are Blocked
                  </h4>
                  <p className="text-[11px] text-amber-300/90 font-medium">Browser permission currently blocked</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/10">
                Notifications are currently blocked in your browser settings. You can enable them anytime from your browser's address bar icon (lock/site settings) to receive battle alerts and rewards.
              </p>
              <div className="flex justify-end pt-1">
                <button
                  onClick={onDismiss}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-xs font-bold hover:brightness-110 shadow-md transition-all cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          ) : (
            /* In-App Soft Prompt */
            <div className="flex flex-col items-center text-center space-y-3.5">
              {/* Royal Badge Icon */}
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-[0_0_20px_rgba(249,201,51,0.5)] flex items-center justify-center">
                  <div className="w-full h-full bg-[#0E0320] rounded-[14px] flex items-center justify-center">
                    <Bell className="w-7 h-7 text-[#FBE278] animate-pulse" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#36D978] flex items-center justify-center shadow-md">
                  <Sparkles className="w-3 h-3 text-black" />
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#FFD700] to-yellow-400 title-font">
                  NEVER MISS YOUR ROYAL BATTLES
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                  Get notified about friend invitations, game events, achievements and rewards.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full pt-1 flex flex-col items-center gap-2">
                <button
                  onClick={onEnable}
                  disabled={isProcessing}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-4 h-4 fill-black" />
                      <span>ENABLE NOTIFICATIONS</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onDismiss}
                  disabled={isProcessing}
                  className="text-xs text-slate-400 hover:text-white py-1 px-4 rounded-lg transition-colors font-semibold tracking-wide cursor-pointer disabled:opacity-50"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

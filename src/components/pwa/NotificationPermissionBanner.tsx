import React, { useState, useEffect } from "react";
import { Bell, Sparkles, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { pushNotificationService } from "../../services/pushNotificationService";

interface NotificationPermissionBannerProps {
  className?: string;
  onDismiss?: () => void;
  onSuccess?: () => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  className = "",
  onDismiss,
  onSuccess,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeniedHelp, setShowDeniedHelp] = useState(false);

  useEffect(() => {
    // Only display if notifications are supported, permission is still default/unasked, and prompt wasn't dismissed recently
    const permission = pushNotificationService.getPermissionStatus();
    const isDismissed = pushNotificationService.isPromptDismissed();

    if (permission === "default" && !isDismissed) {
      // Gentle delay so it doesn't pop immediately on mount
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.requestPermissionAndRegister();
      if (success) {
        setIsVisible(false);
        onSuccess?.();
      } else {
        const currentPermission = pushNotificationService.getPermissionStatus();
        if (currentPermission === "denied") {
          setShowDeniedHelp(true);
        } else {
          setIsVisible(false);
        }
      }
    } catch (err) {
      console.warn("Failed to enable notifications:", err);
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    pushNotificationService.dismissPrompt();
    setIsVisible(false);
    setShowDeniedHelp(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#21073F]/95 via-[#190833]/98 to-[#21073F]/95 border border-[#FFD700]/50 hover:border-[#FFD700]/80 p-4 shadow-[0_4px_30px_rgba(120,34,135,0.45)] backdrop-blur-xl transition-all duration-300 ${className}`}
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-36 h-36 bg-[#AC41D7]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/50 hover:text-white/90 p-1 rounded-lg transition-colors"
          aria-label="Dismiss notification prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {showDeniedHelp ? (
          <div className="flex flex-col gap-2.5 text-left">
            <div className="flex items-center gap-2 text-[#FBE278]">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm tracking-wide">
                Notifications are blocked in browser
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              To receive room invitations and game alerts, tap the lock/info icon in your browser's address bar and set <strong>Notifications</strong> to <strong>Allow</strong>.
            </p>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleDismiss}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4">
            {/* Left: Royal Bell Badge */}
            <div className="flex-shrink-0 relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-[0_0_15px_rgba(249,201,51,0.4)] flex items-center justify-center">
                <div className="w-full h-full bg-[#080320] rounded-[10px] flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#FBE278] animate-pulse" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#36D978] flex items-center justify-center shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-black" />
              </div>
            </div>

            {/* Middle: Content */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FBE278] via-[#FFD700] to-[#E59866] tracking-wide">
                  🔔 NEVER MISS A ROYAL BATTLE
                </h3>
              </div>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Get notified about friend invitations, room codes, royal events & rewards.
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.4)] transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enable</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

import React, { useState } from "react";
import { Bell, BellOff, ShieldAlert, CheckCircle2, X, Sparkles, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PushPermissionStatus } from "../../services/pushNotificationService";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  browserPermission: PushPermissionStatus;
  isAppEnabled: boolean;
  onToggleAppNotifications: (enabled: boolean) => Promise<boolean>;
  onRequestPermission: () => Promise<boolean>;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  browserPermission,
  isAppEnabled,
  onToggleAppNotifications,
  onRequestPermission,
}) => {
  const [isToggling, setIsToggling] = useState(false);

  if (!isOpen) return null;

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      // If browser permission is still default and user turns ON, prompt browser permission
      if (browserPermission === "default" && !isAppEnabled) {
        const granted = await onRequestPermission();
        if (granted) {
          await onToggleAppNotifications(true);
        }
      } else {
        await onToggleAppNotifications(!isAppEnabled);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const isBlocked = browserPermission === "denied";
  const isGranted = browserPermission === "granted";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#22073E] via-[#15042A] to-[#0A0216] border-2 border-[#FFD700]/70 p-6 sm:p-7 shadow-[0_0_50px_rgba(255,215,0,0.3)] text-white"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-14 -right-14 w-40 h-40 bg-[#AC41D7]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-14 -left-14 w-40 h-40 bg-[#FFD700]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close notification settings"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-[0_0_16px_rgba(249,201,51,0.4)] flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-[#0E0320] rounded-[14px] flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#FBE278]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#FFD700] to-yellow-400">
                Notification Settings
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Manage royal battle notifications & alerts
              </p>
            </div>
          </div>

          {/* Body Cards */}
          <div className="space-y-4">
            {/* 1. Main In-App Push Toggle Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-4.5 backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Push Notifications</span>
                    {isAppEnabled && isGranted && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        ACTIVE
                      </span>
                    )}
                    {!isAppEnabled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 font-bold">
                        PAUSED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Receive royal invites, match updates, achievements and event drops.
                  </p>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAppEnabled && !isBlocked}
                  disabled={isToggling || isBlocked}
                  onClick={handleToggle}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    isAppEnabled && !isBlocked
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 border-yellow-300"
                      : "bg-slate-700/80 border-slate-600"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                      isAppEnabled && !isBlocked ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2. Browser Permission Status Card */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Browser Permission:</span>
                {isGranted && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                  </span>
                )}
                {isBlocked && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" /> Blocked in Browser
                  </span>
                )}
                {!isGranted && !isBlocked && (
                  <span className="text-slate-400 font-bold">Not Requested</span>
                )}
              </div>

              {isBlocked ? (
                <div className="mt-2 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 space-y-1">
                  <p className="font-semibold text-amber-300">
                    Notifications are blocked in your browser.
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    To receive notifications, click the lock/settings icon next to the URL in your browser address bar and change Notifications to "Allow".
                  </p>
                </div>
              ) : !isGranted ? (
                <div className="mt-2">
                  <button
                    onClick={async () => {
                      setIsToggling(true);
                      try {
                        await onRequestPermission();
                      } finally {
                        setIsToggling(false);
                      }
                    }}
                    disabled={isToggling}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Request Browser Permission</span>
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Browser permission is active. If you toggle Push Notifications OFF above, this installation will not receive any push messages.
                </p>
              )}
            </div>

            {/* Notification Types Information */}
            <div className="rounded-xl bg-purple-950/30 border border-purple-500/20 p-3 text-[11px] text-purple-200/90 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>What notifications will you receive?</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                <li>Friend game invites and room challenges</li>
                <li>Exclusive palace events and tournament starts</li>
                <li>Score updates, achievements and coin rewards</li>
              </ul>
            </div>
          </div>

          {/* Footer Action */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#AC41D7] via-[#9B2ECB] to-[#782287] hover:brightness-110 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

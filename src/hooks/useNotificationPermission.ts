import { useState, useEffect, useCallback } from "react";
import { pushNotificationService, PushPermissionStatus } from "../services/pushNotificationService";

export type NotificationPermissionState =
  | "UNKNOWN"
  | "SOFT_PROMPT"
  | "GRANTED"
  | "DENIED"
  | "DISABLED";

export interface UseNotificationPermissionOptions {
  currentScreen?: string;
  hasAuthenticatedUser?: boolean;
}

export function useNotificationPermission(options: UseNotificationPermissionOptions = {}) {
  const { currentScreen = "welcome", hasAuthenticatedUser = false } = options;

  const [browserPermission, setBrowserPermission] = useState<PushPermissionStatus>("default");
  const [isAppEnabled, setIsAppEnabled] = useState<boolean>(true);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [deniedExplanation, setDeniedExplanation] = useState<boolean>(false);

  // Sync state from service
  const refreshState = useCallback(() => {
    const status = pushNotificationService.getPermissionStatus();
    setBrowserPermission(status);
    setIsAppEnabled(pushNotificationService.isAppNotificationsEnabled());
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Compute unified permission state
  let permissionState: NotificationPermissionState = "UNKNOWN";
  if (browserPermission === "unsupported") {
    permissionState = "DISABLED";
  } else if (browserPermission === "denied") {
    permissionState = "DENIED";
  } else if (browserPermission === "granted") {
    permissionState = isAppEnabled ? "GRANTED" : "DISABLED";
  } else if (browserPermission === "default") {
    permissionState = showPrompt ? "SOFT_PROMPT" : "UNKNOWN";
  }

  // Determine if soft prompt should be shown
  useEffect(() => {
    // 1. NEVER request or show on website load or welcome screen
    if (currentScreen === "welcome") {
      setShowPrompt(false);
      return;
    }

    // 2. NEVER show during active gameplay screens
    const gameplayScreens = [
      "game",
      "round-result",
      "waiting",
      "create",
      "join",
      "offline-playing",
      "offline-setup",
      "admin",
    ];
    if (gameplayScreens.includes(currentScreen)) {
      setShowPrompt(false);
      return;
    }

    // 3. User must be authenticated or in guest session
    if (!hasAuthenticatedUser) {
      setShowPrompt(false);
      return;
    }

    // 4. Must be on home/lobby or play-type or dashboard
    const eligibleScreens = ["home", "play-type", "dashboard"];
    if (!eligibleScreens.includes(currentScreen)) {
      setShowPrompt(false);
      return;
    }

    // 5. Browser status must still be "default" (not yet granted or denied)
    const status = pushNotificationService.getPermissionStatus();
    if (status !== "default") {
      setShowPrompt(false);
      return;
    }

    // 6. Must not be dismissed recently (5-day cooldown)
    if (pushNotificationService.isPromptDismissed()) {
      setShowPrompt(false);
      return;
    }

    // 7. Must have at least 1 meaningful interaction in current session
    const interactions = pushNotificationService.getInteractionCount();
    if (interactions < 1) {
      setShowPrompt(false);
      return;
    }

    // 8. Gentle short delay (2.5s) after entering screen so it never interrupts the user
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentScreen, hasAuthenticatedUser, browserPermission]);

  // Handler: User explicitly clicks [ 🔔 ENABLE NOTIFICATIONS ]
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const success = await pushNotificationService.requestPermissionAndRegister();
      refreshState();
      if (success) {
        setShowPrompt(false);
        setDeniedExplanation(false);
        return true;
      } else {
        const current = pushNotificationService.getPermissionStatus();
        if (current === "denied") {
          setDeniedExplanation(true);
          pushNotificationService.dismissPrompt("denied");
        } else {
          setShowPrompt(false);
        }
        return false;
      }
    } catch (err) {
      console.warn("[FCM] Failed to enable notifications:", err);
      setShowPrompt(false);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [refreshState]);

  // Handler: User selects Maybe Later
  const dismissPrompt = useCallback((reason: "later" | "denied" = "later") => {
    pushNotificationService.dismissPrompt(reason);
    setShowPrompt(false);
    setDeniedExplanation(false);
  }, []);

  // Handler: User toggles notification in Settings [ ON / OFF ]
  const toggleAppNotifications = useCallback(async (enabled: boolean): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const success = await pushNotificationService.updateAppNotificationPreference(enabled);
      setIsAppEnabled(enabled);
      refreshState();
      return success;
    } finally {
      setIsProcessing(false);
    }
  }, [refreshState]);

  // Handler: Record meaningful user action (e.g. clicked play, lobby, profile)
  const recordInteraction = useCallback(() => {
    pushNotificationService.recordInteraction();
  }, []);

  return {
    permissionState,
    browserPermission,
    isAppEnabled,
    showPrompt,
    isProcessing,
    deniedExplanation,
    enableNotifications,
    dismissPrompt,
    toggleAppNotifications,
    recordInteraction,
    refreshState,
  };
}

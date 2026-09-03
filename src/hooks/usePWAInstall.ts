import { useState, useEffect, useCallback, useRef } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = 'raja_rani_pwa_dismissed';
const SNOOZE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isIOSSafari, setIsIOSSafari] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // default true until verified
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Check if app is already running in standalone display mode
  const checkIsStandalone = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    return isStandaloneMode;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect platform
    const userAgent = window.navigator.userAgent;
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isSafariBrowser =
      /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Android/.test(userAgent);
    const isAndroidDevice = /Android/i.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsIOSSafari(isIOSDevice && isSafariBrowser);
    setIsAndroid(isAndroidDevice);

    // 2. Detect already installed
    const standalone = checkIsStandalone();
    setIsInstalled(standalone);

    // 3. Check dismissal snooze in localStorage
    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY);
      if (dismissedAt) {
        const timePassed = Date.now() - parseInt(dismissedAt, 10);
        if (timePassed < SNOOZE_DURATION_MS) {
          setIsDismissed(true);
        } else {
          // Snooze expired
          localStorage.removeItem(STORAGE_KEY);
          setIsDismissed(false);
        }
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }

    // 4. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt captured successfully.');
    };

    // 5. Listen for appinstalled
    const handleAppInstalled = () => {
      console.log('[PWA] Application installed successfully!');
      setIsInstalled(true);
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkIsStandalone]);

  // Dismiss installation prompt and remember for 7 days
  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    setShowIOSModal(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {}
  }, []);

  // Trigger the native installation prompt (or open iOS instructions modal)
  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'> => {
    if (isInstalled) {
      return 'accepted';
    }

    // iOS flow: show instructions modal
    if (isIOS) {
      setShowIOSModal(true);
      return 'ios';
    }

    // Native browser prompt
    const promptEvent = deferredPromptRef.current || deferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        console.log(`[PWA] User choice: ${choice.outcome}`);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        return choice.outcome;
      } catch (err) {
        console.error('[PWA] Error during prompt():', err);
        return 'unavailable';
      }
    }

    return 'unavailable';
  }, [isInstalled, isIOS, deferredPrompt]);

  const openIOSModal = useCallback(() => {
    setShowIOSModal(true);
  }, []);

  const closeIOSModal = useCallback(() => {
    setShowIOSModal(false);
  }, []);

  // Can install if not already installed, and either beforeinstallprompt is ready OR it's iOS Safari
  const canInstall = !isInstalled && (!!deferredPrompt || isIOS);

  // Should show the banner on home screen if installable, not installed, and not dismissed
  const shouldShowBanner = canInstall && !isDismissed;

  return {
    canInstall,
    isInstalled,
    isIOS,
    isIOSSafari,
    isAndroid,
    isDismissed,
    showIOSModal,
    shouldShowBanner,
    triggerInstall,
    dismissPrompt,
    openIOSModal,
    closeIOSModal,
  };
}

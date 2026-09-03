import { useState, useEffect, useCallback, useRef } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const INSTALLED_KEY = 'raja_rani_app_installed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    (typeof window !== 'undefined' && (window as any).__PWA_PROMPT__) || null
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isIOSSafari, setIsIOSSafari] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(
    (typeof window !== 'undefined' && (window as any).__PWA_PROMPT__) || null
  );

  // Check if app is running in standalone mode or was marked as installed
  const checkIsStandalone = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem(INSTALLED_KEY) === 'true';
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

    // 2. Check if already installed
    const standalone = checkIsStandalone();
    setIsInstalled(standalone);

    // 3. Pick up globally captured prompt if ready
    if ((window as any).__PWA_PROMPT__) {
      deferredPromptRef.current = (window as any).__PWA_PROMPT__;
      setDeferredPrompt((window as any).__PWA_PROMPT__);
    }

    // 4. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__PWA_PROMPT__ = promptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt captured.');
    };

    const handlePromptReady = () => {
      if ((window as any).__PWA_PROMPT__) {
        deferredPromptRef.current = (window as any).__PWA_PROMPT__;
        setDeferredPrompt((window as any).__PWA_PROMPT__);
      }
    };

    // 5. Listen for appinstalled
    const handleAppInstalled = () => {
      console.log('[PWA] Application installed successfully!');
      setIsInstalled(true);
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      (window as any).__PWA_PROMPT__ = null;
      try {
        localStorage.setItem(INSTALLED_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa_prompt_ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa_installed_success', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa_prompt_ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa_installed_success', handleAppInstalled);
    };
  }, [checkIsStandalone]);

  // Request confirmation
  const requestInstallConfirmation = useCallback(() => {
    if (isInstalled) return;
    setShowConfirmModal(true);
  }, [isInstalled]);

  // Direct installation execution
  const confirmAndInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    if (isInstalled) {
      setShowConfirmModal(false);
      return 'accepted';
    }

    let promptEvent = (window as any).__PWA_PROMPT__ || deferredPromptRef.current || deferredPrompt;

    // If promptEvent not ready yet, wait briefly for it
    if (!promptEvent && typeof window !== 'undefined') {
      setIsInstalling(true);
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 500);
        window.addEventListener(
          'pwa_prompt_ready',
          () => {
            clearTimeout(timeout);
            resolve();
          },
          { once: true }
        );
      });
      setIsInstalling(false);
      promptEvent = (window as any).__PWA_PROMPT__ || deferredPromptRef.current || deferredPrompt;
    }

    setShowConfirmModal(false);

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        console.log(`[PWA] Install choice outcome: ${choice.outcome}`);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem(INSTALLED_KEY, 'true');
          } catch {}
        }
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        (window as any).__PWA_PROMPT__ = null;
        return choice.outcome;
      } catch (err) {
        console.error('[PWA] Error triggering install prompt:', err);
      }
    }

    if (isIOS) {
      alert("To add Raja Rani to your home screen on iOS: tap Safari's Share button (⎋), then tap 'Add to Home Screen'.");
    }

    return 'manual';
  }, [isInstalled, deferredPrompt, isIOS]);

  const closeConfirmModal = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const hasPrompt = !!(
    deferredPrompt ||
    (typeof window !== 'undefined' && (window as any).__PWA_PROMPT__)
  );

  return {
    isInstalled,
    isIOS,
    isIOSSafari,
    isAndroid,
    hasPrompt,
    isInstalling,
    showConfirmModal,
    requestInstallConfirmation,
    confirmAndInstall,
    closeConfirmModal,
    // Aliases for compatibility
    showGuideModal: showConfirmModal,
    showIOSModal: showConfirmModal,
    closeGuideModal: closeConfirmModal,
    closeIOSModal: closeConfirmModal,
    triggerInstall: requestInstallConfirmation,
    canInstall: !isInstalled,
  };
}

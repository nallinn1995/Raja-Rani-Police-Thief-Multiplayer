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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isIOSSafari, setIsIOSSafari] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

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

    // 3. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt captured.');
    };

    // 4. Listen for appinstalled
    const handleAppInstalled = () => {
      console.log('[PWA] Application installed successfully!');
      setIsInstalled(true);
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      try {
        localStorage.setItem(INSTALLED_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkIsStandalone]);

  // Trigger installation: native prompt if available, or guide modal
  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'guide'> => {
    if (isInstalled) {
      return 'accepted';
    }

    const promptEvent = deferredPromptRef.current || deferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        console.log(`[PWA] User choice: ${choice.outcome}`);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem(INSTALLED_KEY, 'true');
          } catch {}
        }
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        return choice.outcome;
      } catch (err) {
        console.error('[PWA] Error during prompt():', err);
        setShowGuideModal(true);
        return 'guide';
      }
    }

    // If native prompt is not available, show the interactive guide modal
    setShowGuideModal(true);
    return 'guide';
  }, [isInstalled, deferredPrompt]);

  const openGuideModal = useCallback(() => {
    setShowGuideModal(true);
  }, []);

  const closeGuideModal = useCallback(() => {
    setShowGuideModal(false);
  }, []);

  return {
    isInstalled,
    isIOS,
    isIOSSafari,
    isAndroid,
    showGuideModal,
    triggerInstall,
    openGuideModal,
    closeGuideModal,
    // Aliases for compatibility
    showIOSModal: showGuideModal,
    closeIOSModal: closeGuideModal,
    canInstall: !isInstalled,
  };
}

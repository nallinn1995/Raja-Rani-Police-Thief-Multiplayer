/**
 * PWA Update Manager for Raja Rani Police Thief
 * 
 * Provides safe, automatic version updates for installed Android PWAs and desktop browsers:
 * - Detects new deployments via Service Worker lifecycle (waiting worker).
 * - Centralizes active game detection (Classic, Modern, Detective Challenge, Offline).
 * - Guarantees active gameplay, room lobbies, Babylon.js, and Socket.IO are never interrupted.
 * - Applies updates immediately on non-game screens (Home, Welcome, Settings, etc.).
 * - Defers updates during active matches and applies them seamlessly upon match completion.
 * - Prevents infinite reload loops via sessionStorage guard.
 * - Preserves all push notifications, FCM registration, and authentication tokens intact.
 */

export type AppStateType =
  | 'welcome'
  | 'play-type'
  | 'offline-setup'
  | 'offline-playing'
  | 'home'
  | 'create'
  | 'join'
  | 'waiting'
  | 'playing'
  | 'result'
  | 'leaderboard'
  | 'game-info'
  | 'dashboard'
  | 'admin';

export type GameSafetyStatus = 'SAFE' | 'IN_LOBBY' | 'IN_GAME';

type UpdateCallback = (info: { isPlaying: boolean; currentScreen: AppStateType }) => void;

const RELOAD_GUARD_KEY = 'raja_rani_pwa_update_reloading';
const RELOAD_GUARD_TTL_MS = 15000;
const UPDATE_CHECK_INTERVAL_MS = 25 * 60 * 1000; // 25 minutes

class PWAUpdateManager {
  private static instance: PWAUpdateManager;
  private currentAppState: AppStateType = 'welcome';
  private registration: ServiceWorkerRegistration | null = null;
  private waitingWorker: ServiceWorker | null = null;
  private hasPendingUpdate: boolean = false;
  private isReloading: boolean = false;
  private initialized: boolean = false;
  private listeners: Set<UpdateCallback> = new Set();
  private updateCheckTimer: any = null;

  private constructor() {}

  public static getInstance(): PWAUpdateManager {
    if (!PWAUpdateManager.instance) {
      PWAUpdateManager.instance = new PWAUpdateManager();
    }
    return PWAUpdateManager.instance;
  }

  /**
   * Evaluates current safety status based on application state.
   */
  public getGameSafetyStatus(state: AppStateType = this.currentAppState): GameSafetyStatus {
    switch (state) {
      case 'playing':
      case 'result':
      case 'offline-playing':
        return 'IN_GAME';
      case 'waiting':
        return 'IN_LOBBY';
      default:
        // 'welcome', 'play-type', 'offline-setup', 'home', 'create', 'join',
        // 'leaderboard' (match finished), 'game-info', 'dashboard', 'admin'
        return 'SAFE';
    }
  }

  /**
   * Returns true if user is actively playing any multiplayer or offline game.
   */
  public isGameActive(): boolean {
    return this.getGameSafetyStatus() === 'IN_GAME';
  }

  /**
   * Returns true if user is in a connected multiplayer room lobby.
   */
  public isInLobby(): boolean {
    return this.getGameSafetyStatus() === 'IN_LOBBY';
  }

  /**
   * Returns true if it is 100% safe to apply an update and reload.
   */
  public isSafeToUpdate(): boolean {
    return this.getGameSafetyStatus() === 'SAFE';
  }

  /**
   * Updates the tracked application state.
   * If an update is pending and state becomes SAFE, applies the update automatically.
   */
  public setAppState(newState: AppStateType): void {
    const previousState = this.currentAppState;
    this.currentAppState = newState;

    if (previousState !== newState) {
      console.log(`[PWA Update] App state changed: ${previousState} -> ${newState} (Safety: ${this.getGameSafetyStatus(newState)})`);

      // If an update was deferred while player was in game or lobby, apply it now that we reached a safe screen
      if (this.hasPendingUpdate && this.isSafeToUpdate()) {
        console.log('[PWA Update] Safe screen reached with pending update. Applying now...');
        this.applyPendingUpdate();
      }
    }
  }

  /**
   * Subscribe to update available events (e.g. to show non-intrusive in-game banner).
   */
  public onUpdateAvailable(callback: UpdateCallback): () => void {
    this.listeners.add(callback);
    // If an update is already pending, immediately inform new subscriber
    if (this.hasPendingUpdate) {
      try {
        callback({
          isPlaying: this.isGameActive(),
          currentScreen: this.currentAppState,
        });
      } catch (e) {
        console.warn('[PWA Update] Error in subscriber callback:', e);
      }
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const isPlaying = this.isGameActive();
    const currentScreen = this.currentAppState;
    this.listeners.forEach((callback) => {
      try {
        callback({ isPlaying, currentScreen });
      } catch (err) {
        console.warn('[PWA Update] Error in update listener:', err);
      }
    });
  }

  /**
   * Initializes the Service Worker and PWA update listeners.
   */
  public init(): void {
    if (this.initialized || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    this.initialized = true;

    // Reset reload loop guard after startup delay
    this.setupStartupGuardReset();

    // Setup single controllerchange listener for controlled reloads
    this.setupControllerChangeListener();

    // Register /sw.js on window load (or immediately if document already complete)
    if (document.readyState === 'complete') {
      this.registerSW();
    } else {
      window.addEventListener('load', () => this.registerSW(), { once: true });
    }

    // Proactive background update check on app visibility change (resuming from background)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[PWA Update] App returned to foreground. Checking for updates...');
        this.checkForUpdate();
      }
    });
  }

  private registerSW(): void {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        this.registration = reg;
        console.log('[PWA Update] Service Worker registered with scope:', reg.scope);

        // 1. Check if a new worker is already waiting in background
        if (reg.waiting) {
          this.handleWaitingWorker(reg.waiting);
        }

        // 2. Listen for new workers being installed
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // There was an existing active worker, so this is a genuine update!
                console.log('[PWA Update] New version installed and waiting.');
                this.handleWaitingWorker(installingWorker);
              } else {
                console.log('[PWA Update] Content cached for offline use (initial install).');
              }
            }
          };
        };

        // 3. Setup periodic background update check (every 25 minutes)
        if (!this.updateCheckTimer) {
          this.updateCheckTimer = setInterval(() => {
            this.checkForUpdate();
          }, UPDATE_CHECK_INTERVAL_MS);
        }
      })
      .catch((err) => {
        console.warn('[PWA Update] Service Worker registration failed:', err);
      });
  }

  /**
   * Manually check for an update (safe, non-throwing).
   */
  public checkForUpdate(): void {
    if (this.registration && typeof this.registration.update === 'function') {
      this.registration.update().catch((err) => {
        // Network failures during background check must never impact the user
        console.warn('[PWA Update] Background update check encountered network error:', err.message);
      });
    }
  }

  /**
   * Handles a waiting worker:
   * - If player is SAFE: applies update immediately.
   * - If player is IN_GAME or IN_LOBBY: defers update until safe.
   */
  private handleWaitingWorker(worker: ServiceWorker): void {
    this.waitingWorker = worker;
    this.hasPendingUpdate = true;

    const safety = this.getGameSafetyStatus();
    console.log(`[PWA Update] Waiting worker detected. Current safety status: ${safety}`);

    this.notifyListeners();

    if (safety === 'SAFE') {
      // Safe to apply immediately!
      this.applyPendingUpdate();
    } else {
      console.log(`[PWA Update] Match or lobby active (${safety}). Deferring update until match concludes.`);
    }
  }

  /**
   * Sends SKIP_WAITING to the waiting service worker to trigger activation.
   */
  public applyPendingUpdate(): boolean {
    if (!this.waitingWorker && this.registration?.waiting) {
      this.waitingWorker = this.registration.waiting;
    }

    if (!this.waitingWorker) {
      return false;
    }

    // Safety verification before applying
    if (!this.isSafeToUpdate()) {
      console.warn('[PWA Update] Cannot apply update: game or lobby is currently active!');
      return false;
    }

    // Prevent duplicate activation calls
    if (this.isReloading) {
      return false;
    }

    console.log('[PWA Update] Posting SKIP_WAITING to waiting worker...');
    this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }

  /**
   * Setup single controllerchange listener.
   * When the new service worker activates and claims clients, reload once safely.
   */
  private setupControllerChangeListener(): void {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;

      // Check loop guard
      if (this.isReloadGuardActive()) {
        console.warn('[PWA Update] Reload guard active. Suppressing duplicate reload loop.');
        return;
      }

      this.isReloading = true;
      this.setReloadGuard();

      console.log('[PWA Update] New service worker took control. Reloading to latest version...');
      window.location.reload();
    });
  }

  private isReloadGuardActive(): boolean {
    try {
      const stored = sessionStorage.getItem(RELOAD_GUARD_KEY);
      if (!stored) return false;
      const timestamp = Number(stored);
      return Date.now() - timestamp < RELOAD_GUARD_TTL_MS;
    } catch {
      return false;
    }
  }

  private setReloadGuard(): void {
    try {
      sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    } catch {}
  }

  private setupStartupGuardReset(): void {
    // Reset the guard 5 seconds after application starts normally
    setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_GUARD_KEY);
      } catch {}
    }, 5000);
  }

  /**
   * Public query: Is there an update currently downloaded and waiting?
   */
  public isUpdatePending(): boolean {
    return this.hasPendingUpdate;
  }
}

export const pwaUpdateManager = PWAUpdateManager.getInstance();

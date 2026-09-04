import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { toast } from "react-toastify";
import {
  getMessagingInstance,
  getFirebaseInstallationId,
  isFirebaseClientConfigured,
  VAPID_KEY,
} from "./firebaseConfig";

const API_BASE = import.meta.env.VITE_SERVER_URL || "";
const INSTALLATION_STORAGE_KEY = "rr_push_installation_id";
const PROMPT_DISMISSED_KEY = "rr_push_prompt_dismissed_time";

export type PushPermissionStatus = "default" | "granted" | "denied" | "unsupported";

export interface PushInstallationData {
  installationId: string;
  fcmToken: string;
  fid?: string | null;
  platform: "WEB";
  appType: "PWA" | "BROWSER";
  deviceType: "MOBILE" | "TABLET" | "DESKTOP";
  permission: "GRANTED" | "DENIED" | "DEFAULT";
  notificationsEnabled: boolean;
  userAgent?: string;
  guestDeviceId?: string | null;
}

class PushNotificationService {
  private isListeningForeground = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("appinstalled", () => {
        try {
          localStorage.setItem("pwa_installed", "true");
          this.syncUserSession().catch(() => {});
        } catch {}
      });
    }
  }

  /**
   * Determine device category
   */
  getDeviceType(): "MOBILE" | "TABLET" | "DESKTOP" {
    if (typeof window === "undefined" || typeof navigator === "undefined") return "DESKTOP";
    const ua = navigator.userAgent.toLowerCase();
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua);
    if (isTablet) return "TABLET";
    const isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua);
    if (isMobile) return "MOBILE";
    return "DESKTOP";
  }

  /**
   * Determine if running inside standalone PWA or standard browser tab
   */
  getAppType(): "PWA" | "BROWSER" {
    if (typeof window === "undefined") return "BROWSER";
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes("android-app://") ||
      (typeof localStorage !== "undefined" && localStorage.getItem("pwa_installed") === "true");
    return isStandalone ? "PWA" : "BROWSER";
  }

  /**
   * Get current browser permission state
   */
  getPermissionStatus(): PushPermissionStatus {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission as PushPermissionStatus;
  }

  /**
   * Check if user previously dismissed the prompt recently (cooldown: 5 days)
   */
  isPromptDismissed(): boolean {
    if (typeof localStorage === "undefined") return false;
    const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (!dismissedAt) return false;
    const timePassed = Date.now() - parseInt(dismissedAt, 10);
    return timePassed < 5 * 24 * 60 * 60 * 1000; // 5 days cooldown
  }

  /**
   * Mark the prompt dismissed locally
   */
  dismissPrompt(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
    }
  }

  /**
   * Clear prompt dismissal so banner can show again
   */
  clearPromptDismissal(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(PROMPT_DISMISSED_KEY);
    }
  }

  /**
   * Retrieve cached or generate persistent guest device ID
   */
  getOrCreateGuestDeviceId(): string {
    if (typeof localStorage === "undefined") return "";
    let id = localStorage.getItem("guest_device_id");
    if (!id) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        id = crypto.randomUUID();
      } else {
        id = "g_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      }
      localStorage.setItem("guest_device_id", id);
    }
    return id;
  }

  /**
   * Read auth token from either regular user session or admin session
   */
  getAuthToken(): string | null {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem("access_token") || sessionStorage.getItem("raja_rani_admin_token") || null;
  }

  /**
   * Retrieve cached or generate persistent installation ID
   */
  getOrCreateInstallationId(fid?: string | null): string {
    if (fid) {
      localStorage.setItem(INSTALLATION_STORAGE_KEY, fid);
      return fid;
    }
    let id = localStorage.getItem(INSTALLATION_STORAGE_KEY);
    if (!id) {
      id = "inst_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now().toString(36);
      localStorage.setItem(INSTALLATION_STORAGE_KEY, id);
    }
    return id;
  }

  /**
   * Get active service worker registration
   */
  async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }

    try {
      let reg = await navigator.serviceWorker.getRegistration("/");
      if (!reg) {
        reg = await navigator.serviceWorker.ready;
      }
      return reg || null;
    } catch (err) {
      console.warn("[FCM] Failed to get service worker registration:", err);
      return null;
    }
  }

  /**
   * Request permission and complete FCM registration
   */
  async requestPermissionAndRegister(): Promise<boolean> {
    if (this.getPermissionStatus() === "unsupported") {
      console.warn("[FCM] Notifications are not supported in this browser environment.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("[FCM] Notification permission denied or closed:", permission);
        return false;
      }

      // Permission granted - register FCM
      return await this.registerFCMInstallation();
    } catch (err) {
      console.error("[FCM] Error requesting notification permission:", err);
      return false;
    }
  }

  /**
   * Register or sync FCM token and FID with backend
   */
  async registerFCMInstallation(): Promise<boolean> {
    if (!isFirebaseClientConfigured()) {
      console.warn("[FCM] Firebase client configuration missing. Skipping FCM token acquisition.");
      return false;
    }

    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn("[FCM] Messaging instance could not be initialized.");
        return false;
      }

      const swRegistration = await this.getServiceWorkerRegistration();
      if (!swRegistration) {
        console.warn("[FCM] No active Service Worker found. Make sure sw.js is registered.");
        return false;
      }

      // Obtain FCM token with explicit serviceWorkerRegistration and VAPID key
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY || undefined,
        serviceWorkerRegistration: swRegistration,
      });

      if (!token) {
        console.warn("[FCM] No FCM registration token received.");
        return false;
      }

      // Obtain Firebase Installation ID (FID)
      const fid = await getFirebaseInstallationId();
      const installationId = this.getOrCreateInstallationId(fid);

      const payload: PushInstallationData = {
        installationId,
        fcmToken: token,
        fid: fid || null,
        platform: "WEB",
        appType: this.getAppType(),
        deviceType: this.getDeviceType(),
        permission: "GRANTED",
        notificationsEnabled: true,
        userAgent: navigator.userAgent,
        guestDeviceId: this.getOrCreateGuestDeviceId(),
      };

      // Send to backend
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const authToken = this.getAuthToken();
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE}/api/notifications/installations`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("[FCM] Backend installation registration failed:", errData);
        return false;
      }

      console.log("[FCM] Successfully registered push installation with backend:", installationId);

      // Start foreground push listener
      this.initForegroundListener();
      return true;
    } catch (err) {
      console.error("[FCM] Failed to complete FCM registration:", err);
      return false;
    }
  }

  /**
   * Sync existing device installation with authenticated user session
   */
  async syncUserSession(): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) return false;
    const installationId = localStorage.getItem(INSTALLATION_STORAGE_KEY);
    const guestDeviceId = this.getOrCreateGuestDeviceId();

    try {
      const res = await fetch(`${API_BASE}/api/notifications/sync-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          installationId: installationId || undefined,
          guestDeviceId: guestDeviceId || undefined,
          appType: this.getAppType(),
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn("[FCM] Failed to sync user session:", err);
      return false;
    }
  }

  /**
   * Disassociate user from installation on logout
   */
  async handleLogout(): Promise<void> {
    const installationId = localStorage.getItem(INSTALLATION_STORAGE_KEY);
    if (!installationId) return;

    try {
      await fetch(`${API_BASE}/api/notifications/disassociate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId }),
      });
      console.log("[FCM] Successfully disassociated user on logout.");
    } catch (err) {
      console.warn("[FCM] Failed to disassociate user on logout:", err);
    }
  }

  /**
   * Sync user on login or app entry
   */
  async handleLogin(): Promise<void> {
    if (this.getPermissionStatus() === "granted") {
      await this.registerFCMInstallation();
    }
    await this.syncUserSession();
  }

  /**
   * Listen for push notifications while the application is in foreground
   */
  async initForegroundListener(): Promise<void> {
    if (this.isListeningForeground) return;

    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      this.isListeningForeground = true;

      onMessage(messaging, (payload: MessagePayload) => {
        console.log("[FCM] Foreground message received:", payload);
        const title = payload.notification?.title || payload.data?.title || "👑 Raja Rani";
        const body = payload.notification?.body || payload.data?.body || "New royal update!";

        toast.info(
          `🔔 ${title}\n${body}`,
          {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "dark",
          }
        );
      });
    } catch (err) {
      console.warn("[FCM] Could not setup foreground message listener:", err);
    }
  }
}

export const pushNotificationService = new PushNotificationService();

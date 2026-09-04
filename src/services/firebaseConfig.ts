import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, Messaging } from "firebase/messaging";
import { getInstallations, getId, Installations } from "firebase/installations";

// Firebase web configuration loaded safely from Vite environment variables
export const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let installations: Installations | null = null;

export function isFirebaseClientConfigured(): boolean {
  return !!(
    firebaseWebConfig.apiKey &&
    firebaseWebConfig.projectId &&
    firebaseWebConfig.appId
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;

  if (!isFirebaseClientConfigured()) {
    return null;
  }

  if (!app) {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseWebConfig);
  }

  return app;
}

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return null;
  }

  const currentApp = getFirebaseApp();
  if (!currentApp) return null;

  if (!messaging) {
    try {
      messaging = getMessaging(currentApp);
    } catch (err) {
      console.warn("[FCM] Failed to initialize Firebase Messaging instance:", err);
      return null;
    }
  }

  return messaging;
}

export async function getFirebaseInstallationId(): Promise<string | null> {
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;

  try {
    if (!installations) {
      installations = getInstallations(currentApp);
    }
    const fid = await getId(installations);
    return fid;
  } catch (err) {
    console.warn("[FCM] Failed to get Firebase Installation ID (FID):", err);
    return null;
  }
}

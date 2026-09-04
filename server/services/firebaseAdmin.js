import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let firebaseApp = null;
let firebaseMessaging = null;
let isInitialized = false;
let initializationError = null;

export function initializeFirebaseAdmin() {
  if (isInitialized && firebaseMessaging) {
    return firebaseMessaging;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[FCM] Firebase Admin credentials not fully configured in environment variables. Push notifications will be queued or skipped until credentials are provided."
    );
    initializationError = "Firebase credentials missing or incomplete in environment.";
    return null;
  }

  try {
    // Handle both raw multiline PEM strings and escaped newlines (\n) from .env
    if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log(`[FCM] Firebase Admin initialized successfully for project: ${projectId}`);
    }

    firebaseMessaging = getMessaging(firebaseApp);
    isInitialized = true;
    initializationError = null;
    return firebaseMessaging;
  } catch (err) {
    console.error("[FCM] Firebase Admin initialization failed:", err.message);
    initializationError = err.message;
    return null;
  }
}

export function isFirebaseConfigured() {
  if (isInitialized) return true;
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

export function getFirebaseMessaging() {
  if (!isInitialized || !firebaseMessaging) {
    return initializeFirebaseAdmin();
  }
  return firebaseMessaging;
}

export function getFirebaseInitStatus() {
  return {
    configured: isFirebaseConfigured(),
    initialized: isInitialized,
    error: initializationError,
    projectId: process.env.FIREBASE_PROJECT_ID || null,
  };
}

# Phase 1: Production Push Notification Foundation

Production-grade Web Push Notification system for **Raja Rani Police Thief** powered by Firebase Cloud Messaging (FCM) modular Web SDK and Firebase Admin Node.js SDK.

---

## Architecture Overview

```
                        ┌───────────────────────────────┐
                        │   Android / Desktop Browser   │
                        └───────────────┬───────────────┘
                                        │
                         1. User Grants Notification Permission
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │     FCM Modular Web SDK       │
                        │    (getToken + getId / FID)   │
                        └───────────────┬───────────────┘
                                        │
                         2. Register Installation ID + Token
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │        Express Backend        │
                        │   /api/notifications/install  │
                        └───────────────┬───────────────┘
                                        │
                         3. Safe Upsert (Guest or User)
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │     MongoDB (Mongoose)        │
                        │   PushInstallation Model      │
                        └───────────────┬───────────────┘
                                        │
     4. Admin Dispatches Push           │
        from Admin Dashboard            │
                  │                     │
                  ▼                     │
   ┌───────────────────────────────┐    │
   │      Firebase Admin SDK       │◄───┘
   │   (sendEachForMulticast / FID)│
   └──────────────┬────────────────┘
                  │
   5. Background Web Push Event (Closed App / Background)
                  │
                  ▼
   ┌───────────────────────────────┐
   │    Service Worker (/sw.js)    │
   │  Displays 👑 Raja Rani Push   │
   └───────────────────────────────┘
```

---

## 1. Firebase Project Setup

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Create or select the project: **Raja Rani Police Thief**.
3. Choose your preferred analytics and billing tier (Spark / Free tier is sufficient for standard Web Push).

---

## 2. Web App Registration

1. In Firebase Console, go to **Project Settings** > **General**.
2. Under **Your apps**, click the Web icon (`</>`) to add a Web App.
3. App nickname: `Raja Rani Web PWA`.
4. (Optional) Check "Also set up Firebase Hosting" if using Firebase Hosting, or leave unchecked.
5. Register app and copy the generated `firebaseConfig` keys.

---

## 3. FCM Configuration

1. In Firebase Console, go to **Project Settings** > **Cloud Messaging**.
2. Verify **Firebase Cloud Messaging API (V1)** is enabled.

---

## 4. VAPID Configuration (Web Push Certificates)

1. Under **Project Settings** > **Cloud Messaging** > **Web configuration**.
2. Locate **Web Push certificates**.
3. Click **Generate key pair**.
4. Copy the Public Key string. This value is your `VITE_FIREBASE_VAPID_KEY`.

---

## 5. Environment Variables

Never commit private credentials or service account keys to source control.

### Frontend (`.env` or hosting provider environment)
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=raja-rani-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=raja-rani-xxxx
VITE_FIREBASE_STORAGE_BUCKET=raja-rani-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
VITE_FIREBASE_VAPID_KEY=BN...your-public-vapid-key...
```

### Backend (`.env` or hosting provider environment)
1. In Firebase Console, open **Project Settings** > **Service accounts**.
2. Click **Generate new private key**. Download the JSON file.
3. Extract `project_id`, `client_email`, and `private_key`.
```env
FIREBASE_PROJECT_ID=raja-rani-xxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@raja-rani-xxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----\n"
```
> **Tip on Newlines**: In `.env`, ensure newlines in `FIREBASE_PRIVATE_KEY` are either escaped as `\n` enclosed in double quotes or formatted as multiline PEM. The backend service automatically standardizes both formats.

---

## 6. Service Worker Configuration

To prevent competing service workers and scope collisions, the app uses a **single unified service worker architecture**:

1. Primary worker: [`/sw.js`](file:///c:/Users/admin/Downloads/project-bolt-sb1-jq5rsrzx/project/public/sw.js)
   - Handles asset caching, offline fallback, network bypass for Socket.IO / APIs.
   - Listens to `push` events to show OS notifications with the app icon (`/icons/icon-192x192.png`).
   - Listens to `notificationclick` events to focus or open `https://rajaranigame.online/`.
2. Fallback alias: [`/firebase-messaging-sw.js`](file:///c:/Users/admin/Downloads/project-bolt-sb1-jq5rsrzx/project/public/firebase-messaging-sw.js)
   - Proxies to `/sw.js` via `importScripts('/sw.js')` so any default Firebase SDK checks resolve without conflicts.

---

## 7. Admin Setup & Authorization

1. Push notification sending and metrics are strictly restricted to authenticated administrators.
2. Endpoint protection:
   - `GET /api/admin/notifications`: requires admin bearer token (`verifyAdminToken`).
   - `POST /api/admin/notifications/send`: requires admin bearer token (`verifyAdminToken`) + rate limiter (30 requests per 5 minutes).
3. Non-admin users attempting to call these endpoints receive `401 Unauthorized` or `403 Forbidden`.

---

## 8. Local Development Testing

1. Start both servers:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173` in Google Chrome or Edge (note: notifications require `localhost` or HTTPS).
3. On the Welcome screen, observe the royal in-app prompt:
   ```
   🔔 NEVER MISS A ROYAL BATTLE
   Get notified about: friend invitations, room codes, royal events & rewards.
   [ NOT NOW ]    [ ENABLE ]
   ```
4. Click **Enable**: browser prompts for notification permission.
5. Click **Allow**.
6. Check browser console:
   ```
   [FCM] Installation registered: ...
   ```
7. Check MongoDB:
   Query collection `pushinstallations` to see the registered document.
8. Log in to the Admin Dashboard (`/` > Admin Login).
9. Navigate to the **🔔 Push Notifications** tab.
10. Click **+ Send Notification**:
    - Enter Title: `👑 Test Royal Notification`
    - Enter Message: `Push notifications are working!`
    - Click **Send Notification**.
11. If the app tab is open in foreground, an in-app royal notification toast appears.
12. If the tab is closed/backgrounded, an OS push notification displays.

---

## 9. Production Deployment

1. Production domain: `https://rajaranigame.online/`
2. Ensure production environment variables (`VITE_FIREBASE_*` on build host and `FIREBASE_*` on server host) are set.
3. Build client:
   ```bash
   npm run build
   ```
4. Restart production server:
   ```bash
   npm start
   ```

---

## 10. Android PWA Testing

1. Open `https://rajaranigame.online/` on an Android phone using Chrome.
2. Tap the browser menu (`⋮`) or the in-app PWA install banner and select **Add to Home Screen** / **Install app**.
3. Launch the installed PWA from your Android home screen.
4. When the royal notification prompt appears, tap **Enable** and select **Allow**.
5. Switch to another app or close the Raja Rani PWA so it is in the background.
6. From Admin Dashboard, send a notification:
   - Title: `👑 Royal Battle Awaits!`
   - Message: `Gather your friends and play now.`
7. **Expected Result**:
   - The Android notification shade displays the push notification with the crown app icon.
   - Tapping the notification opens the Raja Rani app.

---

## 11. Troubleshooting

| Issue | Likely Cause | Solution |
| :--- | :--- | :--- |
| **"Firebase Admin credentials missing or incomplete"** | Missing environment variables on server | Verify `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `.env`. |
| **"Registration failed: Push service error"** | Invalid or mismatched VAPID key | Ensure `VITE_FIREBASE_VAPID_KEY` matches the public key pair generated in Firebase Console. |
| **"Notifications blocked in browser"** | User clicked 'Block' on browser prompt | In browser address bar, click the lock/settings icon and change Notifications to "Allow". |
| **Background notifications not appearing on Android** | Battery saver or background data restriction | In Android Settings > Apps > Raja Rani, ensure Notifications are allowed and Battery optimization is set to unrestricted or optimized. |
| **"Failed to send notification: 403"** | User is not logged in as Admin | Log in via the Admin Login Portal with valid credentials to obtain an admin session token. |

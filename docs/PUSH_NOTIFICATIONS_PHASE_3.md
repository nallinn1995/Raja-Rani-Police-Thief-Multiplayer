# Phase 3 — Automatic Game-Event Notifications, Advanced Audience Targeting & Analytics

This document details the architecture, configuration, database models, and operational capabilities introduced in **Phase 3** of the Raja Rani Police Thief notification platform.

---

## 1. Architectural Overview

Phase 3 builds upon **Phase 1** (Firebase Cloud Messaging + PWA Push) and **Phase 2** (Scheduled & Recurring Campaigns + Templates) by adding:
1. **Automated Game-Event Notifications:** Decoupled, non-blocking notification decision engine listening to core game events.
2. **Online vs. Offline Routing:** Active Socket.IO players receive in-app alerts without push distraction; background or offline players receive FCM push notifications.
3. **Anti-Spam & Rate Limiting:** Daily caps, per-event cooldown windows, and recipient timezone-aware quiet hours suppression.
4. **Granular User Preferences:** Opt-in / opt-out controls for friends, rooms, achievements, level ups, and reminders.
5. **Audience Segmentation Builder & Live Reach Estimator:** Precision player filters based on Level range, Game Mode affinity, and match recency with real-time exclusion simulation.
6. **Notification Analytics & CTR Tracking:** Event lifecycle measurement (`TARGETED`, `SENT`, `FAILED`, `DELIVERED`, `OPENED`, `CLICKED`) with CTR reporting and CSV export.

```
                     ┌────────────────────────────────┐
                     │ Game Engine Events (Socket.IO) │
                     └───────────────┬────────────────┘
                                     │
                                     ▼
                     ┌────────────────────────────────┐
                     │ gameNotificationService        │
                     │ (Decoupled, Asynchronous)      │
                     └───────────────┬────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────┐                           ┌──────────────────────┐
│ Player Online        │                           │ Player Offline       │
│ (Active Socket.IO)   │                           │ (FCM Push Gateway)   │
└──────────┬───────────┘                           └──────────┬───────────┘
           │                                                   │
           ▼                                                   ▼
┌──────────────────────┐                           ┌──────────────────────┐
│ In-App Alert Banner  │                           │ Anti-Spam Check:     │
│ (Zero FCM Quota)     │                           │ • Cooldown           │
└──────────────────────┘                           │ • Daily Max Cap      │
                                                   │ • Quiet Hours Window │
                                                   │ • Category Opt-out   │
                                                   └──────────┬───────────┘
                                                              │
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │ FCM Multicast Push   │
                                                   │ & Life-cycle Log     │
                                                   └──────────────────────┘
```

---

## 2. Database Models & Schema Extensions

### A. NotificationEvent (`server/models/NotificationEvent.js`)
Tracks the complete lifecycle of direct pushes, recurring campaigns, and automatic game events:
* `eventType`: Enum `['TARGETED', 'SENT', 'FAILED', 'DELIVERED', 'OPENED', 'CLICKED']`.
* `category`: Category classification (`FRIENDS`, `ROOMS`, `ACHIEVEMENTS`, `LEVEL_UP`, `REMINDERS`, `GENERAL`, `PROMOTIONS`).
* `installationId`: Reference to recipient `PushInstallation`.
* `campaignId`: Associated campaign if triggered by scheduler.
* `notificationId`: Unique payload identifier.
* `metadata`: Diagnostic details (error messages, click deep links, user agents).
* `timestamp`: Indexed timestamp with TTL support.

### B. AutomaticNotificationConfig (`server/models/AutomaticNotificationConfig.js`)
Configures server-side automatic event rules:
* `eventType`: Unique identifier (`ROOM_INVITATION`, `FRIEND_INVITATION`, `ROOM_READY`, `ACHIEVEMENT_UNLOCKED`, `LEVEL_UP`, `DAILY_RETURN`, `INACTIVE_3D`, `INACTIVE_7D`).
* `displayName`: Human-readable label.
* `category`: User preference category mapping.
* `enabled`: Master switch for the event.
* `cooldownMinutes`: Minimum elapsed time before the same player can receive this event again.
* `titleTemplate` & `bodyTemplate`: Message templates with safe interpolation variables.
* `deepLinkTemplate`: Target route (e.g. `/?join={{roomCode}}`).
* `availableVariables`: Documented variable list.

### C. PushInstallation Extensions (`server/models/PushInstallation.js`)
* `preferences`:
  * `friends`: Boolean (default `true`)
  * `rooms`: Boolean (default `true`)
  * `achievements`: Boolean (default `true`)
  * `levelUp`: Boolean (default `true`)
  * `gameEvents`: Boolean (default `true`)
  * `reminders`: Boolean (default `true`)
  * `news`: Boolean (default `true`)
  * `promotions`: Boolean (default `false`)
* `quietHours`:
  * `enabled`: Boolean (default `false`)
  * `start`: String time `"HH:MM"` (default `"22:00"`)
  * `end`: String time `"HH:MM"` (default `"08:00"`)
  * `timezone`: IANA timezone string (default `"Asia/Kolkata"`)

---

## 3. Automatic Game Events & Template Interpolation

The decision engine supports safe regex-based variable interpolation (`renderTemplate`), strictly avoiding `eval` or unsafe execution:

| Event Type | Category | Default Cooldown | Supported Variables | Default Route |
| :--- | :--- | :--- | :--- | :--- |
| `ROOM_INVITATION` | `ROOMS` | 15 min | `{{username}}`, `{{inviterName}}`, `{{roomCode}}` | `/?join={{roomCode}}` |
| `FRIEND_INVITATION` | `FRIENDS` | 30 min | `{{username}}`, `{{inviterName}}` | `/` |
| `ROOM_READY` | `ROOMS` | 10 min | `{{roomCode}}`, `{{playerCount}}` | `/?join={{roomCode}}` |
| `ACHIEVEMENT_UNLOCKED` | `ACHIEVEMENTS` | 5 min | `{{username}}`, `{{achievementName}}` | `/profile` |
| `LEVEL_UP` | `LEVEL_UP` | 5 min | `{{username}}`, `{{level}}` | `/profile` |
| `DAILY_RETURN` | `REMINDERS` | 24 hours | `{{username}}` | `/` |
| `INACTIVE_3D` | `REMINDERS` | 3 days | `{{username}}` | `/` |
| `INACTIVE_7D` | `REMINDERS` | 7 days | `{{username}}` | `/` |

---

## 4. Anti-Spam, Cooldowns & Quiet Hours Engine

Implemented in `server/services/notificationFrequencyService.js`:
* **Cooldown Enforcement:** `canSendEvent(eventKey, cooldownMinutes)` uses high-performance in-memory caching with automatic 15-minute garbage collection.
* **Daily Push Limits:** Enforces a maximum cap of general pushes (default: 5/day) and promotional pushes (default: 2/day) per device.
* **Timezone-Aware Quiet Hours:** Accurately computes overnight spans (e.g. `22:00` -> `08:00`) across all IANA timezones (`Asia/Kolkata`, `America/New_York`, `UTC`, etc.).

---

## 5. Audience Segmentation & Live Reach Estimator

Admins can build custom audience segments in `server/services/notificationAudienceService.js` without raw MongoDB query injection vulnerabilities:
* **Level Filters:** Minimum and Maximum level constraints on `PlayerStats`.
* **Game Mode Affinity:**
  * `classic`: Players with `classicMode.gamesPlayed > 0`
  * `police-thief`: Players with `policeMode.gamesPlayed > 0`
  * `modern`: Players with `modernMode.gamesPlayed > 0`
* **Recency / Inactivity Window:** Match activity thresholds (`lastPlayedDays`).
* **Live Estimation Pipeline:**
  1. Computes total registered accounts.
  2. Queries matching players meeting level/mode/recency criteria.
  3. Identifies associated active FCM push installations.
  4. Calculates exclusions for Category Opt-outs, Active Quiet Hours, and Daily Rate Limits.
  5. Outputs net **Estimated Deliveries Ready**.

---

## 6. Notification Analytics & Lifecycle Tracking

### Endpoints
* `POST /api/notifications/track`: Public endpoint called by client or Service Worker (`public/sw.js`) upon notification display (`DELIVERED`), interaction (`OPENED`), or button action (`CLICKED`).
* `GET /api/admin/notifications/analytics`: Aggregated dashboard metrics:
  * Total Sent, Delivered, Failed, Opened, Clicked
  * **Delivery Rate (%)** = `(Delivered / (Sent + Failed)) * 100`
  * **Open Rate (%)** = `(Opened / Sent) * 100`
  * **CTR (%)** = `(Clicked / Opened) * 100`
  * Performance breakdown of top campaigns and top event categories
* `GET /api/admin/notifications/analytics/export`: Downloads formatted CSV audit report for time ranges (`today`, `yesterday`, `last7days`, `last30days`, `thisMonth`).

---

## 7. Verification & Quality Assurance

* **Unit & Logic Tests (`scripts/test_phase3_events.js`):**
  * Safe variable template interpolation: Verified.
  * Timezone-aware quiet hours overnight evaluation: Verified.
  * Anti-spam daily limit enforcement: Verified.
  * Audience builder query generation: Verified.
* **TypeScript Compilation:** `npx tsc --noEmit` runs with 0 errors.
* **Production Bundle Build:** `npm run build` generates production assets cleanly.

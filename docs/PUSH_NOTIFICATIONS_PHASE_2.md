# Push Notifications Phase 2: Scheduling, Recurring Campaigns & Notification Templates
**Raja Rani Police Thief**

---

## 1. Executive Summary & Architecture Overview

Phase 2 builds directly on the Phase 1 Firebase Cloud Messaging (FCM) push notification foundation without modifying the working FCM service worker, credentials, client registration, or gameplay logic.

### End-to-End Architecture Flow

```
                         ADMIN DASHBOARD
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  [Send Now (Phase 1)]   [Campaigns (Phase 2)]    [Templates (Phase 2)]
         │                      │                      │
         │                ┌─────┴─────┐                │
         │            ONE_TIME    RECURRING            │
         │                └─────┬─────┘                │
         │                      ▼                      │
         │              SERVER SCHEDULER               │
         │          (Atomic Distributed Lock)          │
         │          (Timezone & Recurrence)            │
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                ▼
                     NOTIFICATION SERVICE
                                ▼
                    FIREBASE ADMIN SDK (FCM)
                                ▼
                        PushInstallations
                         ┌──────┴──────┐
                         ▼             ▼
                      Android       Web / PWA
```

---

## 2. Database Models & Schema Specifications

### `NotificationCampaign` Collection (`server/models/NotificationCampaign.js`)

Stores scheduled and recurring campaign configurations.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Internal campaign identifier (max 100 chars) |
| `type` | String | `"ONE_TIME"` or `"RECURRING"` |
| `title` | String | Notification headline (max 120 chars) |
| `body` | String | Notification message body (max 500 chars) |
| `icon` | String | Icon path (default `"/icons/icon-192x192.png"`) |
| `image` | String | Optional banner image URL |
| `deepLink` | String | Internal route (allowlisted: `/`, `/profile`, `/achievements`, etc.) |
| `targetType` | String | `"ALL_ENABLED"`, `"REGISTERED_USERS"`, `"SPECIFIC_USER"`, `"SPECIFIC_INSTALLATION"` |
| `targetUserIds` | [ObjectId] | Target user ObjectId(s) when `targetType === "SPECIFIC_USER"` |
| `targetInstallationIds` | [String] | Target installation ID(s) when `targetType === "SPECIFIC_INSTALLATION"` |
| `schedule.timezone` | String | IANA timezone (e.g. `"Asia/Kolkata"`, `"America/New_York"`, `"UTC"`) |
| `schedule.startAt` | Date | Effective start timestamp |
| `schedule.endAt` | Date | Optional expiration boundary for recurring campaigns |
| `schedule.recurrence` | Object | `{ frequency: "DAILY"|"WEEKLY"|"MONTHLY", interval: 1, daysOfWeek: [0..6], dayOfMonth: 1..31, timeOfDay: "HH:mm" }` |
| `status` | String | `"DRAFT"`, `"SCHEDULED"`, `"ACTIVE"`, `"PAUSED"`, `"COMPLETED"`, `"CANCELLED"`, `"FAILED"` |
| `lastRunAt` | Date | Timestamp of most recent execution |
| `nextRunAt` | Date | Computed next UTC timestamp (indexed for scheduler) |
| `runCount` | Number | Total times executed |
| `isArchived` | Boolean | Soft delete flag (preserves historical runs) |
| `lockUntil` | Date | Distributed atomic claim expiration |
| `lockedBy` | String | Unique worker ID holding current execution lease |

**Indexes:**
- `{ status: 1, nextRunAt: 1, isArchived: 1 }`
- `{ isArchived: 1, createdAt: -1 }`

---

### `NotificationCampaignRun` Collection (`server/models/NotificationCampaignRun.js`)

Maintains an immutable execution audit history for every campaign run.

| Field | Type | Description |
| :--- | :--- | :--- |
| `campaignId` | ObjectId | Reference to `NotificationCampaign` |
| `campaignName` | String | Denormalized campaign name |
| `scheduledAt` | Date | The scheduled trigger timestamp |
| `startedAt` | Date | When execution began |
| `completedAt` | Date | When dispatch finished |
| `targetCount` | Number | Number of active device tokens targeted |
| `successCount` | Number | Number of successfully delivered messages |
| `failureCount` | Number | Number of rejected/unregistered tokens |
| `status` | String | `"PROCESSING"`, `"SENT"`, `"PARTIAL"`, `"FAILED"` |
| `errorSummary` | String | Error message if dispatch failed |
| `executedBy` | String | Worker ID or manual trigger source |

**Indexes:**
- `{ campaignId: 1, scheduledAt: -1 }`
- `{ status: 1 }`

---

### `NotificationTemplate` Collection (`server/models/NotificationTemplate.js`)

Pre-crafted message templates for one-click campaign creation.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Friendly template name (e.g. `👑 Royal Battle Awaits`) |
| `category` | String | `"GENERAL"`, `"GAME"`, `"EVENT"`, `"REMINDER"`, `"REWARD"`, `"ANNOUNCEMENT"` |
| `title` | String | Default notification title |
| `body` | String | Default notification message |
| `icon` | String | App icon path |
| `deepLink` | String | Default navigation route |

---

## 3. Server-Side Scheduler & Distributed Atomic Safety

The scheduler runs entirely in Node.js (`server/services/campaignScheduler.js`) and does **not** rely on client browsers or admin dashboard tabs being open.

### Multi-Instance & Clustered Safety (Atomic Claim)

To prevent duplicate notification sends when scaling across multiple Node.js processes or server instances:

1. Every worker instance generates a unique runtime identifier:
   ```js
   const WORKER_ID = `worker-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
   ```
2. During each poll (every 20s), workers query for due campaigns and attempt an atomic claim:
   ```js
   const claimedCampaign = await NotificationCampaign.findOneAndUpdate(
     {
       _id: campaignId,
       status: { $in: ["SCHEDULED", "ACTIVE"] },
       isArchived: false,
       nextRunAt: { $ne: null, $lte: now },
       $or: [{ lockUntil: null }, { lockUntil: { $lte: now } }]
     },
     {
       $set: {
         lockUntil: new Date(now.getTime() + LOCK_LEASE_MS),
         lockedBy: WORKER_ID
       }
     },
     { new: true }
   );
   ```
3. If two workers query the same due campaign simultaneously, MongoDB guarantees that exactly **one** update succeeds. The second worker receives `null` and skips execution.

### Server Downtime & Missed Schedule Recovery

If the server was offline when a campaign was scheduled to execute:
- **One-Time Campaigns**: If the scheduled time is within a reasonable grace period (24 hours), the server dispatches the notification upon recovery and marks the campaign `COMPLETED`. If past 24 hours, it marks it `COMPLETED` without spamming stale alerts.
- **Recurring Campaigns**: The scheduler computes the **next valid future occurrence** strictly after the current server time (`afterDate = now`). Old missed occurrences are skipped so players are never flooded with backlogged messages.

---

## 4. Timezone Engine & Recurrence Rules

Scheduling is completely timezone-aware using native JavaScript `Intl` engine with full IANA support:
- A notification scheduled for `8:00 PM Asia/Kolkata` executes at `14:30 UTC` (exactly 8:00 PM IST regardless of server host timezone).
- A notification scheduled for `8:00 PM America/New_York` executes at `00:00 UTC` next day (taking daylight saving time into account automatically).

### Supported Recurrence Frequencies

1. **DAILY**:
   - Executes every day at `timeOfDay` (e.g. `19:00` / 7:00 PM).
2. **WEEKLY (Selected Days)**:
   - Executes on designated weekdays (e.g. Monday, Wednesday, Friday) at `timeOfDay`.
3. **MONTHLY**:
   - Executes on a specific day of the month (e.g. 1st of every month) at `timeOfDay`.
4. **Boundaries**:
   - Supports `startAt` (schedule begins) and optional `endAt` (automatically transitions to `COMPLETED` when elapsed).

---

## 5. Admin Dashboard Usage

Navigate to:
**Admin Dashboard** ➔ **Push Notifications**

Three royal sub-tabs are available:

### Sub-Tab 1: Overview & Send Now (Phase 1)
- Live installation metrics: Enabled Installations, Registered Users, Guest Devices, Active Campaigns.
- **+ Send Now**: Instant dispatch to All Enabled, Specific User, or Specific Device.
- Live dispatch audit log table with success/failure delivery rates.

### Sub-Tab 2: Campaigns (Phase 2)
- Summary statistics: Total Campaigns, Active Recurring, Scheduled One-Time, Completed Runs.
- Campaign list table with badges (`ACTIVE`, `SCHEDULED`, `PAUSED`, `COMPLETED`, `CANCELLED`).
- **Actions**:
  - `Pause`: Halts future execution for recurring campaigns without cancelling.
  - `Resume`: Recomputes next valid schedule and re-enables campaign.
  - `Cancel`: Permanently stops campaign from executing.
  - `View History (Clock)`: Opens modal detailing execution timestamps, targeted count, delivery rate, and errors.
  - `Edit (Eye)`: Edit name, title, body, audience, schedule, or timezone.
  - `Archive (Trash)`: Soft-deletes campaign while preserving audit history.
- **+ Create Campaign**: Step-by-step modal with live notification preview and audience confirmation.

### Sub-Tab 3: Templates (Phase 2)
- Categorized cards: `GAME`, `EVENT`, `REMINDER`, `REWARD`, `ANNOUNCEMENT`, `GENERAL`.
- **Use Template**: Populates title, message, icon, and deep link into the Campaign creation form.
- **Duplicate Template**: Clones an existing template for quick variations.
- **Edit / Delete**: Manage template library.

---

## 6. API Reference

All Phase 2 endpoints require admin session token (`verifyAdminToken`):

### Campaigns API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/notifications/campaigns` | List non-archived campaigns & stats |
| `POST` | `/api/admin/notifications/campaigns` | Create scheduled or recurring campaign |
| `GET` | `/api/admin/notifications/campaigns/:id` | Get campaign details & recent runs |
| `PATCH` | `/api/admin/notifications/campaigns/:id` | Update campaign content or schedule |
| `POST` | `/api/admin/notifications/campaigns/:id/pause` | Pause active campaign |
| `POST` | `/api/admin/notifications/campaigns/:id/resume` | Resume paused campaign |
| `POST` | `/api/admin/notifications/campaigns/:id/cancel` | Cancel scheduled campaign |
| `DELETE` | `/api/admin/notifications/campaigns/:id` | Soft delete / archive campaign |
| `GET` | `/api/admin/notifications/campaigns/:id/runs` | Get execution history for campaign |

### Templates API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/notifications/templates` | List templates (auto-seeds defaults if empty) |
| `POST` | `/api/admin/notifications/templates` | Create custom template |
| `PATCH` | `/api/admin/notifications/templates/:id` | Update template |
| `POST` | `/api/admin/notifications/templates/:id/duplicate` | Duplicate template |
| `DELETE` | `/api/admin/notifications/templates/:id` | Delete template |

---

## 7. Troubleshooting & Operational Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Campaign shows status `PAUSED`** | Admin paused the campaign | Click the `Play` icon on the campaign row to resume. |
| **Campaign shows status `COMPLETED`** | One-time campaign executed, or recurring reached `endAt` | Create a new campaign or extend `endAt` if recurring. |
| **Scheduled campaign did not run at exact second** | Scheduler polls every 20 seconds | Expected behavior; jobs execute within 0-20s of scheduled minute. |
| **Next run shows `—`** | Campaign is `DRAFT`, `PAUSED`, `COMPLETED`, or `CANCELLED` | Resume or edit the campaign schedule to recalculate `nextRunAt`. |
| **Deliveries failing** | Invalid FCM tokens or credentials | Stale tokens are deactivated automatically; verify `FIREBASE_*` variables in `.env`. |

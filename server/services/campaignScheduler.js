import crypto from "crypto";
import NotificationCampaign from "../models/NotificationCampaign.js";
import NotificationCampaignRun from "../models/NotificationCampaignRun.js";
import notificationService from "./notificationService.js";

// Unique worker instance ID for distributed locking
const WORKER_ID = `worker-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
// 3 minutes lease timeout for distributed lock
const LOCK_LEASE_MS = 3 * 60 * 1000;
// Poll interval: 20 seconds
const POLL_INTERVAL_MS = 20 * 1000;
// Grace period for one-time missed schedules (24 hours)
const ONE_TIME_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

/**
 * Convert a specific local date & time in an IANA timezone into an exact UTC Date.
 * Handles daylight saving time (DST) and arbitrary timezone offsets safely without external libraries.
 */
export function getUtcDateForTimezone(year, month, day, hour, minute, timeZone = "Asia/Kolkata") {
  // 1. Create a naive UTC date using the given components
  const naiveUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  // 2. Format that instant in the target timezone using native Intl
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(naiveUtc);
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const tzYear = parseInt(partMap.year, 10);
  const tzMonth = parseInt(partMap.month, 10);
  const tzDay = parseInt(partMap.day, 10);
  let tzHour = parseInt(partMap.hour, 10);
  if (tzHour === 24) tzHour = 0;
  const tzMin = parseInt(partMap.minute, 10);
  const tzSec = parseInt(partMap.second, 10);

  const inTzUtc = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, tzSec));
  const offset = inTzUtc.getTime() - naiveUtc.getTime();

  return new Date(naiveUtc.getTime() - offset);
}

/**
 * Get the current local year, month, day, hour, minute, and dayOfWeek for a date in a timezone.
 */
export function getLocalTimeParts(date, timeZone = "Asia/Kolkata") {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  let h = parseInt(map.hour, 10);
  if (h === 24) h = 0;

  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: h,
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    dayOfWeek: weekdayMap[map.weekday] ?? 0,
  };
}

/**
 * Calculate the next execution time for a schedule configuration.
 *
 * @param {Object} schedule - { timezone, startAt, endAt, recurrence: { frequency, interval, daysOfWeek, dayOfMonth, timeOfDay } }
 * @param {Date} afterDate - The threshold date after which the next run must occur (usually Date.now())
 * @param {Boolean} isOneTime - Whether the campaign is one-time
 * @returns {Date|null}
 */
export function calculateNextRunAt(schedule, afterDate = new Date(), isOneTime = false) {
  if (!schedule) return null;

  const timezone = schedule.timezone || "Asia/Kolkata";
  const startAt = new Date(schedule.startAt);
  const endAt = schedule.endAt ? new Date(schedule.endAt) : null;

  if (isOneTime) {
    // If one-time schedule: returns startAt if afterDate <= startAt, else null or startAt if within grace
    if (afterDate <= startAt) return startAt;
    // Allow if within grace period
    if (afterDate.getTime() - startAt.getTime() <= ONE_TIME_GRACE_PERIOD_MS) {
      return startAt;
    }
    return null;
  }

  const recurrence = schedule.recurrence || {};
  const frequency = recurrence.frequency || "DAILY";
  const interval = Math.max(1, recurrence.interval || 1);
  const timeOfDay = recurrence.timeOfDay || "20:00";
  const [targetH, targetM] = timeOfDay.split(":").map((v) => parseInt(v, 10));

  // Determine starting search date in timezone
  const baselineDate = afterDate > startAt ? afterDate : startAt;
  const currentLocal = getLocalTimeParts(baselineDate, timezone);

  // Lookahead loop (up to 366 days) to find the next valid occurrence
  for (let dayOffset = 0; dayOffset <= 366; dayOffset++) {
    // Create a local candidate date by adding days to current local date
    const candidateLocalObj = new Date(
      Date.UTC(currentLocal.year, currentLocal.month - 1, currentLocal.day + dayOffset)
    );
    const candidateYear = candidateLocalObj.getUTCFullYear();
    const candidateMonth = candidateLocalObj.getUTCMonth() + 1;
    const candidateDay = candidateLocalObj.getUTCDate();
    const candidateDayOfWeek = candidateLocalObj.getUTCDay();

    // Check frequency matching
    let matchesFrequency = false;
    if (frequency === "DAILY") {
      matchesFrequency = true;
    } else if (frequency === "WEEKLY") {
      const allowedDays =
        Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length > 0
          ? recurrence.daysOfWeek
          : [currentLocal.dayOfWeek];
      matchesFrequency = allowedDays.includes(candidateDayOfWeek);
    } else if (frequency === "MONTHLY") {
      const targetDay = recurrence.dayOfMonth || 1;
      matchesFrequency = candidateDay === targetDay;
    }

    if (!matchesFrequency) continue;

    const candidateUtc = getUtcDateForTimezone(
      candidateYear,
      candidateMonth,
      candidateDay,
      targetH,
      targetM,
      timezone
    );

    // Must be strictly in the future compared to afterDate and at or after startAt
    if (candidateUtc > afterDate && candidateUtc >= startAt) {
      // Check optional endAt boundary
      if (endAt && candidateUtc > endAt) {
        return null;
      }
      return candidateUtc;
    }
  }

  return null;
}

class CampaignScheduler {
  constructor() {
    this.timer = null;
    this.isRunning = false;
    this.isProcessing = false;
  }

  /**
   * Start server background scheduler loop
   */
  startScheduler() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Scheduler] Campaign Scheduler started on worker ${WORKER_ID}. Polling every ${POLL_INTERVAL_MS / 1000}s`);

    // Initial check after short delay
    setTimeout(() => {
      this.checkAndExecuteDueCampaigns().catch((err) => {
        console.error("[Scheduler] Error during initial tick:", err.message);
      });
    }, 3000);

    // Recurring interval
    this.timer = setInterval(() => {
      this.checkAndExecuteDueCampaigns().catch((err) => {
        console.error("[Scheduler] Error during tick:", err.message);
      });
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop background scheduler loop (graceful shutdown)
   */
  stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log(`[Scheduler] Campaign Scheduler stopped on worker ${WORKER_ID}`);
  }

  /**
   * Check for due campaigns and process them with atomic distributed claim
   */
  async checkAndExecuteDueCampaigns() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();

      // Find due campaigns:
      // - status SCHEDULED (one-time) or ACTIVE (recurring)
      // - nextRunAt <= now
      // - not archived
      // - lock is either null OR expired (worker died/timeout)
      const dueCampaigns = await NotificationCampaign.find({
        status: { $in: ["SCHEDULED", "ACTIVE"] },
        isArchived: false,
        nextRunAt: { $ne: null, $lte: now },
        $or: [{ lockUntil: null }, { lockUntil: { $lte: now } }],
      })
        .limit(10)
        .lean();

      if (dueCampaigns.length === 0) {
        return;
      }

      for (const campaign of dueCampaigns) {
        await this.claimAndRunCampaign(campaign._id, now);
      }
    } catch (err) {
      console.error("[Scheduler] Execution check failed:", err.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Atomically claim a campaign and execute it
   */
  async claimAndRunCampaign(campaignId, scheduledTime) {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + LOCK_LEASE_MS);

    // 1. Atomic claim via findOneAndUpdate
    const claimedCampaign = await NotificationCampaign.findOneAndUpdate(
      {
        _id: campaignId,
        status: { $in: ["SCHEDULED", "ACTIVE"] },
        isArchived: false,
        nextRunAt: { $ne: null, $lte: now },
        $or: [{ lockUntil: null }, { lockUntil: { $lte: now } }],
      },
      {
        $set: {
          lockUntil: lockExpiry,
          lockedBy: WORKER_ID,
        },
      },
      { new: true }
    );

    // Another instance/worker claimed it first
    if (!claimedCampaign) {
      return;
    }

    console.log(`[Scheduler] Claimed campaign "${claimedCampaign.name}" (${claimedCampaign._id}) for execution.`);

    // 2. Initialize execution run log
    let runLog = null;
    try {
      runLog = await NotificationCampaignRun.create({
        campaignId: claimedCampaign._id,
        campaignName: claimedCampaign.name,
        scheduledAt: claimedCampaign.nextRunAt || scheduledTime,
        startedAt: new Date(),
        status: "PROCESSING",
        executedBy: WORKER_ID,
      });
    } catch (logErr) {
      console.error("[Scheduler] Failed to create run log:", logErr.message);
    }

    let dispatchResult = null;
    let executionError = null;

    // 3. Dispatch notification via existing notificationService
    try {
      let targetId = null;
      if (claimedCampaign.targetType === "SPECIFIC_USER") {
        targetId = claimedCampaign.targetUserIds?.[0]?.toString() || null;
      } else if (claimedCampaign.targetType === "SPECIFIC_INSTALLATION") {
        targetId = claimedCampaign.targetInstallationIds?.[0] || null;
      }

      dispatchResult = await notificationService.sendNotification({
        title: claimedCampaign.title,
        body: claimedCampaign.body,
        targetType: claimedCampaign.targetType,
        targetId,
        deepLink: claimedCampaign.deepLink || "/",
        icon: claimedCampaign.icon || "/icons/icon-192x192.png",
        image: claimedCampaign.image || null,
        createdBy: claimedCampaign.createdBy || "scheduler",
      });
    } catch (err) {
      console.error(`[Scheduler] Notification dispatch error for "${claimedCampaign.name}":`, err.message);
      executionError = err.message;
    }

    // 4. Update the execution run log
    const completedAt = new Date();
    const finalRunStatus = executionError
      ? "FAILED"
      : dispatchResult?.failureCount > 0
      ? dispatchResult?.successCount > 0
        ? "PARTIAL"
        : "FAILED"
      : "SENT";

    if (runLog) {
      try {
        runLog.completedAt = completedAt;
        runLog.status = finalRunStatus;
        runLog.targetCount = dispatchResult?.targetCount || 0;
        runLog.successCount = dispatchResult?.successCount || 0;
        runLog.failureCount = dispatchResult?.failureCount || 0;
        if (executionError) runLog.errorSummary = executionError;
        await runLog.save();
      } catch (saveErr) {
        console.error("[Scheduler] Failed to update run log:", saveErr.message);
      }
    }

    // 5. Update Campaign state (advance schedule or mark completed)
    try {
      const isOneTime = claimedCampaign.type === "ONE_TIME";
      const updateDoc = {
        lastRunAt: completedAt,
        $inc: { runCount: 1 },
        lockUntil: null,
        lockedBy: null,
      };

      if (isOneTime) {
        updateDoc.status = executionError && !dispatchResult ? "FAILED" : "COMPLETED";
        updateDoc.nextRunAt = null;
      } else {
        // Recurring campaign: calculate next occurrence strictly after now
        const nextOccurrence = calculateNextRunAt(claimedCampaign.schedule, completedAt, false);
        if (nextOccurrence) {
          updateDoc.status = "ACTIVE";
          updateDoc.nextRunAt = nextOccurrence;
        } else {
          // If no more future occurrences within endAt, mark COMPLETED
          updateDoc.status = "COMPLETED";
          updateDoc.nextRunAt = null;
        }
      }

      await NotificationCampaign.findByIdAndUpdate(claimedCampaign._id, updateDoc);
      console.log(
        `[Scheduler] Finished campaign "${claimedCampaign.name}": Status=${updateDoc.status}, NextRun=${
          updateDoc.nextRunAt ? updateDoc.nextRunAt.toISOString() : "None"
        }`
      );
    } catch (updateErr) {
      console.error("[Scheduler] Failed to update campaign post-run:", updateErr.message);
      // Release lock on error so it doesn't get stuck indefinitely
      await NotificationCampaign.findByIdAndUpdate(claimedCampaign._id, {
        lockUntil: null,
        lockedBy: null,
      }).catch(() => {});
    }
  }
}

export const campaignScheduler = new CampaignScheduler();
export default campaignScheduler;

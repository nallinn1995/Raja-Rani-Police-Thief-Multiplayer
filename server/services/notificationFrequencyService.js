import { getLocalTimeParts } from "./campaignScheduler.js";
import NotificationEvent from "../models/NotificationEvent.js";

class NotificationFrequencyService {
  constructor() {
    // In-memory cooldown cache: key -> timestamp (ms)
    this.cooldownMap = new Map();
    // In-memory installation daily counter: key -> { count: number, dateStr: string }
    this.dailyCountMap = new Map();

    // Default configuration limits
    this.DEFAULT_MAX_GENERAL_PER_DAY = 5;
    this.DEFAULT_MAX_PROMOTIONAL_PER_DAY = 2;

    // Prune stale cache entries every 15 minutes
    const interval = setInterval(() => this.pruneStaleEntries(), 15 * 60 * 1000);
    if (interval.unref) interval.unref();
  }

  /**
   * Evaluate if an event is allowed to be sent for a given key within cooldown
   * e.g. "ROOM_INVITATION:ROOM123:USER456" with cooldown 30 min
   */
  canSendEvent(eventKey, cooldownMinutes = 30) {
    if (!eventKey) return true;
    const now = Date.now();
    const lastSent = this.cooldownMap.get(eventKey);

    if (lastSent) {
      const elapsedMinutes = (now - lastSent) / (60 * 1000);
      if (elapsedMinutes < cooldownMinutes) {
        return false;
      }
    }

    return true;
  }

  /**
   * Record that an event key was sent
   */
  recordEventSent(eventKey) {
    if (!eventKey) return;
    this.cooldownMap.set(eventKey, Date.now());
  }

  /**
   * Check if an installation has reached its daily limit
   */
  async checkDailyLimit(installationId, category = "GAME_EVENTS", maxPerDay = null) {
    if (!installationId) return true;

    const isPromo = category === "PROMOTIONS";
    const limit =
      maxPerDay !== null
        ? maxPerDay
        : isPromo
        ? this.DEFAULT_MAX_PROMOTIONAL_PER_DAY
        : this.DEFAULT_MAX_GENERAL_PER_DAY;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count events sent to this installation today
    const sentToday = await NotificationEvent.countDocuments({
      installationId,
      eventType: "SENT",
      timestamp: { $gte: todayStart },
      ...(isPromo ? { category: "PROMOTIONS" } : {}),
    });

    return sentToday < limit;
  }

  /**
   * Determine whether the recipient is currently in their configured quiet hours
   */
  isInQuietHours(quietHours, referenceDate = new Date()) {
    if (!quietHours || !quietHours.enabled) {
      return false;
    }

    const timezone = quietHours.timezone || "Asia/Kolkata";
    const local = getLocalTimeParts(referenceDate, timezone);
    const currentMinutes = local.hour * 60 + local.minute;

    const [startH, startM] = (quietHours.start || "22:00")
      .split(":")
      .map((v) => parseInt(v, 10));
    const [endH, endM] = (quietHours.end || "08:00")
      .split(":")
      .map((v) => parseInt(v, 10));

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Overnight quiet window (e.g. 22:00 -> 08:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Same day quiet window (e.g. 13:00 -> 15:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  }

  /**
   * Periodic pruning of old cache entries
   */
  pruneStaleEntries() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, timestamp] of this.cooldownMap.entries()) {
      if (now - timestamp > maxAge) {
        this.cooldownMap.delete(key);
      }
    }
  }
}

export const notificationFrequencyService = new NotificationFrequencyService();
export default notificationFrequencyService;

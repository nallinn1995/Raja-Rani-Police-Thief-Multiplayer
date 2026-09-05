import mongoose from "mongoose";
import PushInstallation from "../models/PushInstallation.js";
import PlayerStats from "../models/PlayerStats.js";
import User from "../models/User.js";

class NotificationAudienceService {
  /**
   * Build MongoDB query filter for eligible PlayerStats based on controlled criteria
   */
  buildStatsQuery(filterCriteria = {}) {
    const query = {};

    // 1. Level range
    if (filterCriteria.levelMin !== undefined && filterCriteria.levelMin !== null && filterCriteria.levelMin > 0) {
      query.level = query.level || {};
      query.level.$gte = Number(filterCriteria.levelMin);
    }
    if (filterCriteria.levelMax !== undefined && filterCriteria.levelMax !== null && filterCriteria.levelMax > 0) {
      query.level = query.level || {};
      query.level.$lte = Number(filterCriteria.levelMax);
    }

    // 2. Activity / Recency
    const now = new Date();
    if (filterCriteria.activityStatus) {
      switch (filterCriteria.activityStatus) {
        case "ACTIVE_7D":
          query.lastPlayedAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case "INACTIVE_3D":
          query.lastPlayedAt = { $lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) };
          break;
        case "INACTIVE_7D":
          query.lastPlayedAt = { $lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case "INACTIVE_14D":
          query.lastPlayedAt = { $lte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) };
          break;
        case "INACTIVE_30D":
          query.lastPlayedAt = { $lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case "NEW_3D":
          query.createdAt = { $gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) };
          break;
      }
    } else if (filterCriteria.lastPlayedDays) {
      const days = Number(filterCriteria.lastPlayedDays);
      query.lastPlayedAt = { $lte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };
    }

    // 3. Game Mode Affinity
    if (filterCriteria.gameMode && filterCriteria.gameMode !== "ALL") {
      switch (filterCriteria.gameMode.toUpperCase()) {
        case "CLASSIC":
          query["classicMode.gamesPlayed"] = { $gt: 0 };
          break;
        case "DETECTIVE":
        case "POLICE":
        case "POLICE-THIEF":
        case "POLICE_THIEF":
          query.$or = [{ "detectiveMode.gamesPlayed": { $gt: 0 } }, { "policeMode.gamesPlayed": { $gt: 0 } }];
          break;
        case "MODERN":
          query["modernMode.gamesPlayed"] = { $gt: 0 };
          break;
        case "OFFLINE":
          query["offlineGamesPlayed"] = { $gt: 0 };
          break;
      }
    }

    return query;
  }

  /**
   * Estimate audience reach and exclusions for Admin Preview
   */
  async estimateAudience(filterCriteria = {}) {
    try {
      const statsQuery = this.buildStatsQuery(filterCriteria);
      const hasStatsFilter = Object.keys(statsQuery).length > 0;

      let matchedUserIds = null;
      if (hasStatsFilter) {
        matchedUserIds = await PlayerStats.distinct("userId", statsQuery);
      }

      // Base query for PushInstallation
      const baseInstQuery = {};
      if (matchedUserIds !== null) {
        baseInstQuery.userId = { $in: matchedUserIds };
      } else if (filterCriteria.targetAudience === "REGISTERED_USERS") {
        baseInstQuery.userId = { $ne: null };
      } else if (filterCriteria.targetAudience === "GUEST_DEVICES") {
        baseInstQuery.userId = null;
      }

      // Total installations matching demographic
      const totalDemographicInstallations = await PushInstallation.countDocuments(baseInstQuery);

      // Active / Enabled installations (eligible to receive)
      const eligibleQuery = {
        ...baseInstQuery,
        notificationsEnabled: true,
        permission: "GRANTED",
      };

      const eligibleInstallations = await PushInstallation.find(eligibleQuery)
        .select("userId installationId lastSeenAt")
        .lean();

      const uniqueEligibleUsers = new Set(
        eligibleInstallations.map((i) => i.userId?.toString()).filter(Boolean)
      );

      // Exclusions breakdown
      const disabledPrefsCount = await PushInstallation.countDocuments({
        ...baseInstQuery,
        notificationsEnabled: false,
      });

      const deniedPermissionCount = await PushInstallation.countDocuments({
        ...baseInstQuery,
        permission: "DENIED",
      });

      return {
        estimatedUsers: uniqueEligibleUsers.size,
        estimatedInstallations: eligibleInstallations.length,
        pushEnabledCount: eligibleInstallations.length,
        excludedCount: disabledPrefsCount + deniedPermissionCount,
        exclusions: {
          notificationsDisabled: disabledPrefsCount,
          permissionDenied: deniedPermissionCount,
        },
      };
    } catch (err) {
      console.error("[AudienceService] Estimation error:", err.message);
      return {
        estimatedUsers: 0,
        estimatedInstallations: 0,
        pushEnabledCount: 0,
        excludedCount: 0,
        exclusions: { notificationsDisabled: 0, permissionDenied: 0 },
      };
    }
  }

  /**
   * Resolve list of eligible push installations for a campaign execution
   */
  async resolveEligibleInstallations(filterCriteria = {}, deduplicatePerUser = false) {
    const statsQuery = this.buildStatsQuery(filterCriteria);
    const hasStatsFilter = Object.keys(statsQuery).length > 0;

    let matchedUserIds = null;
    if (hasStatsFilter) {
      matchedUserIds = await PlayerStats.distinct("userId", statsQuery);
    }

    const query = {
      notificationsEnabled: true,
      permission: "GRANTED",
    };

    if (matchedUserIds !== null) {
      query.userId = { $in: matchedUserIds };
    } else if (filterCriteria.targetAudience === "REGISTERED_USERS") {
      query.userId = { $ne: null };
    }

    let installations = await PushInstallation.find(query)
      .sort({ lastSeenAt: -1 })
      .lean();

    if (deduplicatePerUser) {
      // Pick the most recently seen installation per authenticated user, plus all guest installations
      const seenUsers = new Set();
      const deduped = [];

      for (const inst of installations) {
        if (!inst.userId) {
          deduped.push(inst);
        } else {
          const uId = inst.userId.toString();
          if (!seenUsers.has(uId)) {
            seenUsers.add(uId);
            deduped.push(inst);
          }
        }
      }
      return deduped;
    }

    return installations;
  }
}

export const notificationAudienceService = new NotificationAudienceService();
export default notificationAudienceService;

import mongoose from "mongoose";
import NotificationEvent from "../models/NotificationEvent.js";
import AutomaticNotificationConfig from "../models/AutomaticNotificationConfig.js";
import NotificationCampaign from "../models/NotificationCampaign.js";
import notificationAudienceService from "../services/notificationAudienceService.js";
import gameNotificationService from "../services/gameNotificationService.js";

/**
 * Helper to compute date range window
 */
function getDateWindow(range = "last7days", startDateStr = null, endDateStr = null) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "last7days":
      start.setDate(start.getDate() - 7);
      break;
    case "last30days":
      start.setDate(start.getDate() - 30);
      break;
    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "custom":
      if (startDateStr) start = new Date(startDateStr);
      if (endDateStr) end = new Date(endDateStr);
      break;
    default:
      start.setDate(start.getDate() - 7);
      break;
  }

  return { start, end };
}

/**
 * POST /api/notifications/track
 * Public client / service worker open and click tracking
 */
export async function trackNotificationEvent(req, res) {
  try {
    const { notificationId, campaignId, eventType, installationId, metadata } = req.body;

    const validTypes = ["DELIVERED", "OPENED", "CLICKED"];
    if (!eventType || !validTypes.includes(eventType)) {
      return res.status(400).json({ error: "Valid eventType (DELIVERED, OPENED, CLICKED) is required" });
    }

    const eventDoc = await NotificationEvent.create({
      notificationId: notificationId || null,
      campaignId: campaignId && mongoose.Types.ObjectId.isValid(campaignId) ? campaignId : null,
      eventType,
      installationId: installationId || null,
      metadata: metadata || {},
      timestamp: new Date(),
    });

    return res.json({ success: true, id: eventDoc._id });
  } catch (err) {
    console.error("[AnalyticsController] Track error:", err.message);
    return res.status(500).json({ error: "Failed to record event" });
  }
}

/**
 * GET /api/admin/notifications/analytics
 * Aggregated metrics & dashboard overview
 */
export async function getNotificationAnalytics(req, res) {
  try {
    const { range = "last7days", startDate, endDate } = req.query;
    const { start, end } = getDateWindow(range, startDate, endDate);

    const matchWindow = {
      timestamp: { $gte: start, $lte: end },
    };

    // 1. Overall counts by eventType
    const eventCounts = await NotificationEvent.aggregate([
      { $match: matchWindow },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    for (const item of eventCounts) {
      countMap[item._id] = item.count;
    }

    const totalSent = countMap["SENT"] || 0;
    const totalFailed = countMap["FAILED"] || 0;
    const totalDelivered = (countMap["DELIVERED"] || 0) + totalSent; // sent via FCM multicast is deemed delivered to push gateway
    const totalOpened = countMap["OPENED"] || 0;
    const totalClicked = countMap["CLICKED"] || 0;

    const deliveryRate = totalSent > 0 ? ((totalDelivered / (totalSent + totalFailed)) * 100).toFixed(1) : "100.0";
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";
    const ctr = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : "0.0";

    // 2. Top campaigns breakdown
    const campaignAgg = await NotificationEvent.aggregate([
      {
        $match: {
          ...matchWindow,
          campaignId: { $ne: null },
        },
      },
      {
        $group: {
          _id: { campaignId: "$campaignId", eventType: "$eventType" },
          count: { $sum: 1 },
        },
      },
    ]);

    const campaignStatsMap = new Map();
    for (const item of campaignAgg) {
      const cId = item._id.campaignId.toString();
      if (!campaignStatsMap.has(cId)) {
        campaignStatsMap.set(cId, { sent: 0, opened: 0, clicked: 0 });
      }
      const s = campaignStatsMap.get(cId);
      if (item._id.eventType === "SENT") s.sent += item.count;
      if (item._id.eventType === "OPENED") s.opened += item.count;
      if (item._id.eventType === "CLICKED") s.clicked += item.count;
    }

    const topCampaigns = [];
    for (const [cId, stats] of campaignStatsMap.entries()) {
      const camp = await NotificationCampaign.findById(cId).select("name type status").lean();
      if (camp) {
        topCampaigns.push({
          campaignId: cId,
          name: camp.name,
          type: camp.type,
          sent: stats.sent,
          opened: stats.opened,
          clicked: stats.clicked,
          ctr: stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : "0.0",
        });
      }
    }
    topCampaigns.sort((a, b) => b.sent - a.sent);

    // 3. Top Automatic Event Types breakdown
    const eventTypeAgg = await NotificationEvent.aggregate([
      {
        $match: {
          ...matchWindow,
          category: { $ne: "GENERAL" },
        },
      },
      {
        $group: {
          _id: { category: "$category", eventType: "$eventType" },
          count: { $sum: 1 },
        },
      },
    ]);

    const eventStatsMap = new Map();
    for (const item of eventTypeAgg) {
      const cat = item._id.category;
      if (!eventStatsMap.has(cat)) {
        eventStatsMap.set(cat, { sent: 0, opened: 0 });
      }
      const s = eventStatsMap.get(cat);
      if (item._id.eventType === "SENT") s.sent += item.count;
      if (item._id.eventType === "OPENED") s.opened += item.count;
    }

    const topEventTypes = [];
    for (const [category, stats] of eventStatsMap.entries()) {
      topEventTypes.push({
        category,
        sent: stats.sent,
        opened: stats.opened,
        openRate: stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : "0.0",
      });
    }
    topEventTypes.sort((a, b) => b.sent - a.sent);

    return res.json({
      success: true,
      window: { start, end, range },
      metrics: {
        totalSent,
        totalDelivered,
        totalFailed,
        totalOpened,
        totalClicked,
        deliveryRate: Number(deliveryRate),
        openRate: Number(openRate),
        ctr: Number(ctr),
      },
      topCampaigns: topCampaigns.slice(0, 5),
      topEventTypes,
    });
  } catch (err) {
    console.error("[AnalyticsController] getAnalytics error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve analytics: " + err.message });
  }
}

/**
 * GET /api/admin/notifications/analytics/export
 * Export notification analytics as CSV
 */
export async function exportAnalyticsCsv(req, res) {
  try {
    const { range = "last30days" } = req.query;
    const { start, end } = getDateWindow(range);

    const events = await NotificationEvent.find({
      timestamp: { $gte: start, $lte: end },
    })
      .sort({ timestamp: -1 })
      .limit(2000)
      .lean();

    let csv = "Timestamp,Event Type,Category,Target Type,Notification ID,Campaign ID\n";
    for (const ev of events) {
      const ts = ev.timestamp ? new Date(ev.timestamp).toISOString() : "";
      const evType = ev.eventType || "";
      const cat = ev.category || "";
      const tgt = ev.targetType || "";
      const nId = ev.notificationId || "";
      const cId = ev.campaignId ? ev.campaignId.toString() : "";
      csv += `"${ts}","${evType}","${cat}","${tgt}","${nId}","${cId}"\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=notification_analytics_${range}.csv`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: "Failed to export analytics CSV" });
  }
}

/**
 * GET /api/admin/notifications/automatic-events
 * List all automatic event notification configs
 */
export async function getAutomaticEvents(req, res) {
  try {
    await gameNotificationService.initializeDefaultConfigs();
    const configs = await AutomaticNotificationConfig.find().sort({ category: 1, displayName: 1 }).lean();
    return res.json({ success: true, configs });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch automatic event configs" });
  }
}

/**
 * PUT /api/admin/notifications/automatic-events/:eventType
 * Update an automatic notification config
 */
export async function updateAutomaticEvent(req, res) {
  try {
    const { eventType } = req.params;
    const { enabled, titleTemplate, bodyTemplate, deepLinkTemplate, cooldownMinutes } = req.body;

    const config = await AutomaticNotificationConfig.findOne({ eventType });
    if (!config) {
      return res.status(404).json({ error: "Event config not found" });
    }

    if (enabled !== undefined) config.enabled = Boolean(enabled);
    if (titleTemplate) config.titleTemplate = titleTemplate.trim().slice(0, 120);
    if (bodyTemplate) config.bodyTemplate = bodyTemplate.trim().slice(0, 500);
    if (deepLinkTemplate) config.deepLinkTemplate = deepLinkTemplate.trim();
    if (cooldownMinutes !== undefined) config.cooldownMinutes = Math.max(0, Number(cooldownMinutes));
    config.updatedBy = req.auth?.username || "admin";

    await config.save();
    return res.json({ success: true, config });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update automatic event" });
  }
}

/**
 * POST /api/admin/notifications/audience/estimate
 * Calculate estimated reach and exclusion breakdown
 */
export async function estimateAudience(req, res) {
  try {
    const filter = req.body || {};
    const estimate = await notificationAudienceService.estimateAudience(filter);
    return res.json({ success: true, estimate });
  } catch (err) {
    return res.status(500).json({ error: "Failed to calculate audience estimate" });
  }
}

import mongoose from "mongoose";
import NotificationCampaign from "../models/NotificationCampaign.js";
import NotificationCampaignRun from "../models/NotificationCampaignRun.js";
import NotificationTemplate from "../models/NotificationTemplate.js";
import { calculateNextRunAt } from "../services/campaignScheduler.js";

// Allowlisted deep link prefixes/routes to prevent arbitrary external redirects
const ALLOWED_DEEP_LINK_PREFIXES = [
  "/",
  "/game-modes",
  "/profile",
  "/achievements",
  "/leaderboard",
  "/rules",
  "/settings",
  "/detective",
  "/modern",
  "/offline",
];

function sanitizeDeepLink(link) {
  if (!link || typeof link !== "string") return "/";
  const trimmed = link.trim();
  if (trimmed.startsWith("https://rajaranigame.online/")) {
    return trimmed.replace("https://rajaranigame.online", "") || "/";
  }
  if (!trimmed.startsWith("/")) {
    return "/";
  }
  // Check if starts with one of our allowed internal paths
  const isAllowed = ALLOWED_DEEP_LINK_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(prefix + "/") || trimmed.startsWith(prefix + "?")
  );
  return isAllowed ? trimmed : "/";
}

// Default Seed Templates for instant productivity
const DEFAULT_SEED_TEMPLATES = [
  {
    name: "👑 Royal Battle Awaits",
    category: "GAME",
    title: "👑 Your Kingdom Awaits!",
    body: "Gather your friends and start a Royal Battle tonight.",
    icon: "/icons/icon-192x192.png",
    deepLink: "/",
  },
  {
    name: "🕵️ Detective Challenge",
    category: "GAME",
    title: "🕵️ Case Unsolved: Can You Find the Thief?",
    body: "Analyze clues, interrogate suspects, and crack the royal case before time runs out!",
    icon: "/icons/icon-192x192.png",
    deepLink: "/game-modes",
  },
  {
    name: "⚔️ Weekend Royal Battle",
    category: "EVENT",
    title: "⚔️ Weekend Royal Battle Begins!",
    body: "Climb the kingdom leaderboards and earn exclusive victory crowns all weekend long.",
    icon: "/icons/icon-192x192.png",
    deepLink: "/leaderboard",
  },
  {
    name: "🏆 Royal Achievement Reward",
    category: "REWARD",
    title: "🏆 New Royal Rewards Unlocked!",
    body: "Log in now to claim your mystery badges and XP rewards in the palace.",
    icon: "/icons/icon-192x192.png",
    deepLink: "/achievements",
  },
  {
    name: "🔔 Daily Royal Reminder",
    category: "REMINDER",
    title: "👑 Don't Break Your Daily Streak!",
    body: "Your throne is waiting. Play one quick match to keep your winning streak alive.",
    icon: "/icons/icon-192x192.png",
    deepLink: "/",
  },
  {
    name: "📢 Kingdom Announcement",
    category: "ANNOUNCEMENT",
    title: "📢 Royal Kingdom Gazette",
    body: "Exciting updates and game enhancements are now live in the kingdom!",
    icon: "/icons/icon-192x192.png",
    deepLink: "/",
  },
];

/**
 * -------------------------------------------------------------
 * CAMPAIGN CONTROLLERS
 * -------------------------------------------------------------
 */

/**
 * GET /api/admin/notifications/campaigns
 * List all non-archived campaigns with metrics
 */
export async function getCampaigns(req, res) {
  try {
    const { status, type, search } = req.query;

    const filter = { isArchived: false };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search && typeof search === "string") {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { title: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const campaigns = await NotificationCampaign.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate overview stats
    const totalCampaigns = await NotificationCampaign.countDocuments({ isArchived: false });
    const activeRecurring = await NotificationCampaign.countDocuments({
      isArchived: false,
      type: "RECURRING",
      status: "ACTIVE",
    });
    const scheduledOneTime = await NotificationCampaign.countDocuments({
      isArchived: false,
      type: "ONE_TIME",
      status: "SCHEDULED",
    });
    const totalRuns = await NotificationCampaignRun.countDocuments();

    return res.json({
      success: true,
      campaigns,
      stats: {
        totalCampaigns,
        activeRecurring,
        scheduledOneTime,
        totalRuns,
      },
    });
  } catch (err) {
    console.error("[CampaignController] getCampaigns error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve campaigns: " + err.message });
  }
}

/**
 * GET /api/admin/notifications/campaigns/:id
 * Get single campaign with latest execution runs
 */
export async function getCampaignById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid campaign ID format" });
    }

    const campaign = await NotificationCampaign.findOne({
      _id: id,
      isArchived: false,
    }).lean();

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const runs = await NotificationCampaignRun.find({ campaignId: id })
      .sort({ scheduledAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      campaign,
      runs,
    });
  } catch (err) {
    console.error("[CampaignController] getCampaignById error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve campaign" });
  }
}

/**
 * POST /api/admin/notifications/campaigns
 * Create a new scheduled or recurring campaign
 */
export async function createCampaign(req, res) {
  try {
    const {
      name,
      type,
      title,
      body,
      icon,
      image,
      deepLink,
      targetType,
      targetUserIds,
      targetInstallationIds,
      schedule,
      status,
    } = req.body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Campaign name is required" });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Notification title is required" });
    }
    if (title.trim().length > 120) {
      return res.status(400).json({ error: "Title exceeds maximum length of 120 characters" });
    }
    if (!body || typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ error: "Notification body is required" });
    }
    if (body.trim().length > 500) {
      return res.status(400).json({ error: "Body exceeds maximum length of 500 characters" });
    }

    const validTypes = ["ONE_TIME", "RECURRING"];
    const campaignType = validTypes.includes(type) ? type : "ONE_TIME";

    const validTargets = [
      "ALL_ENABLED",
      "REGISTERED_USERS",
      "SPECIFIC_USER",
      "SPECIFIC_INSTALLATION",
    ];
    const audience = validTargets.includes(targetType) ? targetType : "ALL_ENABLED";

    if (audience === "SPECIFIC_USER" && (!targetUserIds || targetUserIds.length === 0)) {
      return res.status(400).json({ error: "At least one target user ID is required" });
    }
    if (
      audience === "SPECIFIC_INSTALLATION" &&
      (!targetInstallationIds || targetInstallationIds.length === 0)
    ) {
      return res.status(400).json({ error: "At least one target installation ID is required" });
    }

    if (!schedule || !schedule.startAt) {
      return res.status(400).json({ error: "Schedule with startAt is required" });
    }

    const timezone = schedule.timezone || "Asia/Kolkata";
    const startAt = new Date(schedule.startAt);
    if (isNaN(startAt.getTime())) {
      return res.status(400).json({ error: "Invalid startAt date format" });
    }

    const endAt = schedule.endAt ? new Date(schedule.endAt) : null;
    if (endAt && endAt <= startAt) {
      return res.status(400).json({ error: "endAt date must be after startAt date" });
    }

    const safeSchedule = {
      timezone,
      startAt,
      endAt,
      recurrence: {
        frequency: schedule.recurrence?.frequency || "DAILY",
        interval: Math.max(1, schedule.recurrence?.interval || 1),
        daysOfWeek: Array.isArray(schedule.recurrence?.daysOfWeek)
          ? schedule.recurrence.daysOfWeek
          : [],
        dayOfMonth: schedule.recurrence?.dayOfMonth || 1,
        timeOfDay: schedule.recurrence?.timeOfDay || "20:00",
      },
    };

    // Calculate initial nextRunAt
    const isOneTime = campaignType === "ONE_TIME";
    const calculatedNext = calculateNextRunAt(safeSchedule, new Date(), isOneTime);

    let initialStatus = status === "DRAFT" ? "DRAFT" : isOneTime ? "SCHEDULED" : "ACTIVE";
    if (!calculatedNext && initialStatus !== "DRAFT") {
      initialStatus = "COMPLETED";
    }

    const adminUsername = req.auth?.username || "admin";

    const newCampaign = await NotificationCampaign.create({
      name: name.trim().slice(0, 100),
      type: campaignType,
      title: title.trim().slice(0, 120),
      body: body.trim().slice(0, 500),
      icon: icon || "/icons/icon-192x192.png",
      image: image || null,
      deepLink: sanitizeDeepLink(deepLink),
      targetType: audience,
      targetUserIds: targetUserIds || [],
      targetInstallationIds: targetInstallationIds || [],
      schedule: safeSchedule,
      status: initialStatus,
      nextRunAt: calculatedNext,
      createdBy: adminUsername,
      createdAt: new Date(),
    });

    console.log(
      `[CampaignController] Campaign created: "${newCampaign.name}" (${newCampaign.type}) NextRun: ${
        newCampaign.nextRunAt ? newCampaign.nextRunAt.toISOString() : "None"
      }`
    );

    return res.status(201).json({
      success: true,
      campaign: newCampaign,
    });
  } catch (err) {
    console.error("[CampaignController] createCampaign error:", err.message);
    return res.status(500).json({ error: "Failed to create campaign: " + err.message });
  }
}

/**
 * PATCH /api/admin/notifications/campaigns/:id
 * Update an existing campaign
 */
export async function updateCampaign(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid campaign ID" });
    }

    const campaign = await NotificationCampaign.findOne({ _id: id, isArchived: false });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const {
      name,
      title,
      body,
      icon,
      image,
      deepLink,
      targetType,
      targetUserIds,
      targetInstallationIds,
      schedule,
    } = req.body;

    if (name) campaign.name = name.trim().slice(0, 100);
    if (title) campaign.title = title.trim().slice(0, 120);
    if (body) campaign.body = body.trim().slice(0, 500);
    if (icon) campaign.icon = icon;
    if (image !== undefined) campaign.image = image || null;
    if (deepLink) campaign.deepLink = sanitizeDeepLink(deepLink);
    if (targetType) campaign.targetType = targetType;
    if (targetUserIds) campaign.targetUserIds = targetUserIds;
    if (targetInstallationIds) campaign.targetInstallationIds = targetInstallationIds;

    let scheduleChanged = false;
    if (schedule) {
      scheduleChanged = true;
      if (schedule.timezone) campaign.schedule.timezone = schedule.timezone;
      if (schedule.startAt) campaign.schedule.startAt = new Date(schedule.startAt);
      if (schedule.endAt !== undefined) {
        campaign.schedule.endAt = schedule.endAt ? new Date(schedule.endAt) : null;
      }
      if (schedule.recurrence) {
        if (schedule.recurrence.frequency) {
          campaign.schedule.recurrence.frequency = schedule.recurrence.frequency;
        }
        if (schedule.recurrence.interval) {
          campaign.schedule.recurrence.interval = schedule.recurrence.interval;
        }
        if (schedule.recurrence.daysOfWeek) {
          campaign.schedule.recurrence.daysOfWeek = schedule.recurrence.daysOfWeek;
        }
        if (schedule.recurrence.dayOfMonth) {
          campaign.schedule.recurrence.dayOfMonth = schedule.recurrence.dayOfMonth;
        }
        if (schedule.recurrence.timeOfDay) {
          campaign.schedule.recurrence.timeOfDay = schedule.recurrence.timeOfDay;
        }
      }
    }

    if (scheduleChanged && ["SCHEDULED", "ACTIVE"].includes(campaign.status)) {
      const isOneTime = campaign.type === "ONE_TIME";
      campaign.nextRunAt = calculateNextRunAt(campaign.schedule, new Date(), isOneTime);
    }

    campaign.updatedBy = req.auth?.username || "admin";
    await campaign.save();

    return res.json({
      success: true,
      campaign,
    });
  } catch (err) {
    console.error("[CampaignController] updateCampaign error:", err.message);
    return res.status(500).json({ error: "Failed to update campaign: " + err.message });
  }
}

/**
 * POST /api/admin/notifications/campaigns/:id/pause
 * Pause an active or scheduled campaign
 */
export async function pauseCampaign(req, res) {
  try {
    const { id } = req.params;
    const campaign = await NotificationCampaign.findOne({ _id: id, isArchived: false });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    campaign.status = "PAUSED";
    campaign.updatedBy = req.auth?.username || "admin";
    await campaign.save();

    return res.json({
      success: true,
      campaign,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to pause campaign" });
  }
}

/**
 * POST /api/admin/notifications/campaigns/:id/resume
 * Resume a paused campaign and recalculate next execution time
 */
export async function resumeCampaign(req, res) {
  try {
    const { id } = req.params;
    const campaign = await NotificationCampaign.findOne({ _id: id, isArchived: false });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const isOneTime = campaign.type === "ONE_TIME";
    const nextRun = calculateNextRunAt(campaign.schedule, new Date(), isOneTime);

    campaign.status = isOneTime ? "SCHEDULED" : "ACTIVE";
    campaign.nextRunAt = nextRun;
    campaign.updatedBy = req.auth?.username || "admin";

    if (!nextRun && !isOneTime) {
      campaign.status = "COMPLETED";
    }

    await campaign.save();

    return res.json({
      success: true,
      campaign,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to resume campaign" });
  }
}

/**
 * POST /api/admin/notifications/campaigns/:id/cancel
 * Cancel a campaign permanently
 */
export async function cancelCampaign(req, res) {
  try {
    const { id } = req.params;
    const campaign = await NotificationCampaign.findOne({ _id: id, isArchived: false });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    campaign.status = "CANCELLED";
    campaign.nextRunAt = null;
    campaign.updatedBy = req.auth?.username || "admin";
    await campaign.save();

    return res.json({
      success: true,
      campaign,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to cancel campaign" });
  }
}

/**
 * DELETE /api/admin/notifications/campaigns/:id
 * Soft delete (archive) a campaign to preserve historical runs
 */
export async function archiveCampaign(req, res) {
  try {
    const { id } = req.params;
    const campaign = await NotificationCampaign.findByIdAndUpdate(
      id,
      {
        $set: {
          isArchived: true,
          status: "CANCELLED",
          nextRunAt: null,
          updatedBy: req.auth?.username || "admin",
        },
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    return res.json({
      success: true,
      message: "Campaign archived successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to archive campaign" });
  }
}

/**
 * GET /api/admin/notifications/campaigns/:id/runs
 * Retrieve historical execution runs for a specific campaign
 */
export async function getCampaignRuns(req, res) {
  try {
    const { id } = req.params;
    const runs = await NotificationCampaignRun.find({ campaignId: id })
      .sort({ scheduledAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      runs,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load campaign runs" });
  }
}

/**
 * -------------------------------------------------------------
 * TEMPLATE CONTROLLERS
 * -------------------------------------------------------------
 */

/**
 * GET /api/admin/notifications/templates
 * List templates, seeding defaults if table is empty
 */
export async function getTemplates(req, res) {
  try {
    let templates = await NotificationTemplate.find().sort({ createdAt: -1 }).lean();

    // If zero templates exist, auto-seed with standard game templates
    if (templates.length === 0) {
      await NotificationTemplate.insertMany(DEFAULT_SEED_TEMPLATES);
      templates = await NotificationTemplate.find().sort({ createdAt: -1 }).lean();
    }

    return res.json({
      success: true,
      templates,
    });
  } catch (err) {
    console.error("[CampaignController] getTemplates error:", err.message);
    return res.status(500).json({ error: "Failed to fetch notification templates" });
  }
}

/**
 * POST /api/admin/notifications/templates
 * Create a new template
 */
export async function createTemplate(req, res) {
  try {
    const { name, category, title, body, icon, image, deepLink } = req.body;

    if (!name || !title || !body) {
      return res.status(400).json({ error: "Name, title, and body are required" });
    }

    const newTemplate = await NotificationTemplate.create({
      name: name.trim().slice(0, 100),
      category: category || "GENERAL",
      title: title.trim().slice(0, 120),
      body: body.trim().slice(0, 500),
      icon: icon || "/icons/icon-192x192.png",
      image: image || null,
      deepLink: sanitizeDeepLink(deepLink),
      createdBy: req.auth?.username || "admin",
    });

    return res.status(201).json({
      success: true,
      template: newTemplate,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create template: " + err.message });
  }
}

/**
 * PATCH /api/admin/notifications/templates/:id
 * Update an existing template
 */
export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { name, category, title, body, icon, image, deepLink } = req.body;

    const template = await NotificationTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (name) template.name = name.trim().slice(0, 100);
    if (category) template.category = category;
    if (title) template.title = title.trim().slice(0, 120);
    if (body) template.body = body.trim().slice(0, 500);
    if (icon) template.icon = icon;
    if (image !== undefined) template.image = image || null;
    if (deepLink) template.deepLink = sanitizeDeepLink(deepLink);
    template.updatedBy = req.auth?.username || "admin";

    await template.save();

    return res.json({
      success: true,
      template,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update template" });
  }
}

/**
 * POST /api/admin/notifications/templates/:id/duplicate
 * Duplicate a template
 */
export async function duplicateTemplate(req, res) {
  try {
    const { id } = req.params;
    const original = await NotificationTemplate.findById(id).lean();
    if (!original) {
      return res.status(404).json({ error: "Template not found" });
    }

    const duplicated = await NotificationTemplate.create({
      name: `Copy of ${original.name}`.slice(0, 100),
      category: original.category,
      title: original.title,
      body: original.body,
      icon: original.icon,
      image: original.image,
      deepLink: original.deepLink,
      createdBy: req.auth?.username || "admin",
    });

    return res.status(201).json({
      success: true,
      template: duplicated,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to duplicate template" });
  }
}

/**
 * DELETE /api/admin/notifications/templates/:id
 * Delete a template
 */
export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    const deleted = await NotificationTemplate.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete template" });
  }
}

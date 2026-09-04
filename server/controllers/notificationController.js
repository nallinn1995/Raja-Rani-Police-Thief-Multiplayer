import notificationService from "../services/notificationService.js";
import { verifyAccessToken, getBearerToken } from "../security.js";

// Helper to extract authenticated user id if present in request
function getOptionalUserId(req) {
  try {
    const token = getBearerToken(req);
    if (!token) return null;
    const identity = verifyAccessToken(token);
    return identity ? identity.id || identity._id || null : null;
  } catch {
    return null;
  }
}

/**
 * Public/Client: Register or refresh installation
 * POST /api/notifications/installations
 */
export async function registerPushInstallation(req, res) {
  try {
    const {
      installationId,
      fcmToken,
      fid,
      platform,
      appType,
      deviceType,
      permission,
      notificationsEnabled,
      userAgent,
    } = req.body;

    if (!installationId || !fcmToken) {
      return res.status(400).json({ error: "installationId and fcmToken are required" });
    }

    // Attach authenticated user if a valid bearer token is present
    const authUserId = getOptionalUserId(req);

    const installation = await notificationService.registerInstallation({
      installationId,
      fcmToken,
      fid,
      userId: authUserId,
      platform,
      appType,
      deviceType,
      permission,
      notificationsEnabled: notificationsEnabled !== false,
      userAgent: userAgent || req.headers["user-agent"] || "",
    });

    return res.json({ success: true, installation });
  } catch (err) {
    console.error("[FCM] Failed to register push installation:", err.message);
    return res.status(500).json({ error: "Failed to register installation: " + err.message });
  }
}

/**
 * Public/Client: Update notification preference
 * PUT /api/notifications/preferences
 */
export async function updatePushPreferences(req, res) {
  try {
    const { installationId, notificationsEnabled } = req.body;
    if (!installationId || typeof notificationsEnabled !== "boolean") {
      return res.status(400).json({ error: "installationId and boolean notificationsEnabled are required" });
    }

    const updated = await notificationService.updatePreferences(installationId, notificationsEnabled);
    if (!updated) {
      return res.status(404).json({ error: "Installation not found" });
    }

    return res.json({ success: true, installation: updated });
  } catch (err) {
    console.error("[FCM] Failed to update push preferences:", err.message);
    return res.status(500).json({ error: "Failed to update notification preferences" });
  }
}

/**
 * Public/Client: Disassociate user upon logout
 * POST /api/notifications/disassociate
 */
export async function disassociateUserInstallation(req, res) {
  try {
    const { installationId } = req.body;
    if (!installationId) {
      return res.status(400).json({ error: "installationId is required" });
    }

    await notificationService.disassociateUser(installationId);
    return res.json({ success: true });
  } catch (err) {
    console.error("[FCM] Failed to disassociate user from installation:", err.message);
    return res.status(500).json({ error: "Failed to disassociate installation" });
  }
}

/**
 * Admin: Get push notification dashboard data
 * GET /api/admin/notifications
 */
export async function getAdminNotificationData(req, res) {
  try {
    const metrics = await notificationService.getMetrics();
    const recent = await notificationService.getRecentNotifications(30);

    return res.json({
      success: true,
      metrics,
      recent,
    });
  } catch (err) {
    console.error("[FCM] Admin fetch notifications error:", err);
    return res.status(500).json({ error: "Failed to retrieve push notification data" });
  }
}

/**
 * Admin: Send push notification
 * POST /api/admin/notifications/send
 */
export async function sendAdminNotification(req, res) {
  try {
    const { title, body, targetType, targetId, deepLink, icon } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Notification title is required" });
    }
    if (title.length > 120) {
      return res.status(400).json({ error: "Title exceeds maximum length of 120 characters" });
    }

    if (!body || typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ error: "Notification message body is required" });
    }
    if (body.length > 500) {
      return res.status(400).json({ error: "Message body exceeds maximum length of 500 characters" });
    }

    const validTargetTypes = ["ALL", "INSTALLATION", "USER"];
    const target = targetType && validTargetTypes.includes(targetType) ? targetType : "ALL";

    if (target === "INSTALLATION" && (!targetId || typeof targetId !== "string")) {
      return res.status(400).json({ error: "Target installation ID is required" });
    }
    if (target === "USER" && (!targetId || typeof targetId !== "string")) {
      return res.status(400).json({ error: "Target User ID is required" });
    }

    const adminUsername = req.auth?.username || "admin";

    const result = await notificationService.sendNotification({
      title,
      body,
      targetType: target,
      targetId: targetId || null,
      deepLink: deepLink || "/",
      icon: icon || "/icons/icon-192x192.png",
      createdBy: adminUsername,
    });

    return res.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error("[FCM] Admin notification send failure:", err.message);
    return res.status(500).json({ error: err.message || "Failed to send notification" });
  }
}

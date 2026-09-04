import mongoose from "mongoose";
import PushInstallation from "../models/PushInstallation.js";
import NotificationLog from "../models/NotificationLog.js";
import { getFirebaseMessaging, isFirebaseConfigured } from "./firebaseAdmin.js";

// Max batch size recommended by Firebase Cloud Messaging sendEachForMulticast
const FCM_MAX_BATCH_SIZE = 500;

// Known Firebase error codes indicating an invalid or expired token
const INVALID_TOKEN_ERROR_CODES = [
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/mismatched-credential",
  "messaging/invalid-argument",
];

class NotificationService {
  /**
   * Register or update an installation (idempotent upsert)
   */
  async registerInstallation({
    installationId,
    fcmToken,
    fid = null,
    userId = null,
    platform = "WEB",
    appType = "BROWSER",
    deviceType = "DESKTOP",
    permission = "GRANTED",
    notificationsEnabled = true,
    userAgent = "",
  }) {
    if (!installationId || !fcmToken) {
      throw new Error("installationId and fcmToken are required");
    }

    const safeUserId =
      userId && mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;

    const updateDoc = {
      fcmToken,
      permission,
      notificationsEnabled,
      platform,
      appType,
      deviceType,
      lastSeenAt: new Date(),
    };

    if (fid) updateDoc.fid = fid;
    if (userAgent) updateDoc.userAgent = userAgent;
    if (safeUserId) updateDoc.userId = safeUserId;

    // Idempotent upsert by installationId
    const installation = await PushInstallation.findOneAndUpdate(
      { installationId },
      {
        $set: updateDoc,
        $setOnInsert: {
          installationId,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`[FCM] Installation registered: ${installationId.slice(0, 8)}... (device: ${deviceType}, user: ${safeUserId ? "authenticated" : "guest"})`);
    return installation;
  }

  /**
   * Associate an authenticated user with an existing installation
   */
  async associateUserWithInstallation(installationId, userId) {
    if (!installationId || !userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }

    return await PushInstallation.findOneAndUpdate(
      { installationId },
      {
        $set: {
          userId: new mongoose.Types.ObjectId(userId),
          lastSeenAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Disassociate user from installation upon logout (retains physical installation as guest/unassociated)
   */
  async disassociateUser(installationId) {
    if (!installationId) return null;

    return await PushInstallation.findOneAndUpdate(
      { installationId },
      {
        $set: {
          userId: null,
          lastSeenAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Update master notification preference
   */
  async updatePreferences(installationId, notificationsEnabled) {
    if (!installationId) throw new Error("installationId is required");

    return await PushInstallation.findOneAndUpdate(
      { installationId },
      {
        $set: {
          notificationsEnabled: Boolean(notificationsEnabled),
          lastSeenAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Retrieve installation metrics for Admin Dashboard
   */
  async getMetrics() {
    const totalInstallations = await PushInstallation.countDocuments();
    const enabledInstallations = await PushInstallation.countDocuments({
      notificationsEnabled: true,
      permission: "GRANTED",
    });

    const registeredUsersWithPush = (
      await PushInstallation.distinct("userId", {
        userId: { $ne: null },
        notificationsEnabled: true,
        permission: "GRANTED",
      })
    ).length;

    const guestInstallations = await PushInstallation.countDocuments({
      userId: null,
      notificationsEnabled: true,
      permission: "GRANTED",
    });

    return {
      totalInstallations,
      enabledInstallations,
      registeredUsersWithPush,
      guestInstallations,
      isFirebaseConfigured: isFirebaseConfigured(),
    };
  }

  /**
   * Get recent notification history
   */
  async getRecentNotifications(limit = 20) {
    return await NotificationLog.find()
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .lean();
  }

  /**
   * Send notification via Firebase Admin to target
   */
  async sendNotification({
    title,
    body,
    targetType = "ALL",
    targetId = null,
    deepLink = "/",
    icon = "/icons/icon-192x192.png",
    createdBy = "admin",
  }) {
    if (!title || !body) {
      throw new Error("Notification title and body are required");
    }

    const trimmedTitle = title.trim().slice(0, 120);
    const trimmedBody = body.trim().slice(0, 500);

    // Sanitize deep link: only internal relative paths or approved game domain
    let safeDeepLink = "/";
    if (typeof deepLink === "string") {
      if (deepLink.startsWith("/")) {
        safeDeepLink = deepLink;
      } else if (deepLink.startsWith("https://rajaranigame.online/")) {
        safeDeepLink = deepLink.replace("https://rajaranigame.online", "") || "/";
      }
    }

    // Create pending audit log
    const logDoc = await NotificationLog.create({
      title: trimmedTitle,
      body: trimmedBody,
      targetType,
      targetId,
      deepLink: safeDeepLink,
      status: "PROCESSING",
      createdBy,
      createdAt: new Date(),
    });

    console.log(`[FCM] Notification send started: "${trimmedTitle}" (Target: ${targetType})`);

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      logDoc.status = "FAILED";
      logDoc.errorSummary = "Firebase Admin is not configured on the server.";
      logDoc.sentAt = new Date();
      await logDoc.save();
      throw new Error("Firebase Admin is not configured with valid credentials.");
    }

    // Resolve target installations
    let installations = [];
    if (targetType === "INSTALLATION") {
      if (!targetId) throw new Error("targetId (installationId) is required for INSTALLATION target");
      const inst = await PushInstallation.findOne({
        $or: [{ installationId: targetId }, { fid: targetId }, { fcmToken: targetId }],
        notificationsEnabled: true,
      });
      if (inst) installations = [inst];
    } else if (targetType === "USER") {
      if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
        throw new Error("Valid userId is required for USER target");
      }
      installations = await PushInstallation.find({
        userId: targetId,
        notificationsEnabled: true,
        permission: "GRANTED",
      });
    } else {
      // Broadcast to ALL enabled installations
      installations = await PushInstallation.find({
        notificationsEnabled: true,
        permission: "GRANTED",
      });
    }

    if (installations.length === 0) {
      logDoc.status = "SENT";
      logDoc.targetCount = 0;
      logDoc.successCount = 0;
      logDoc.failureCount = 0;
      logDoc.sentAt = new Date();
      logDoc.errorSummary = "No active notification-enabled installations found for target.";
      await logDoc.save();

      console.log(`[FCM] No recipients found for target ${targetType}`);
      return {
        log: logDoc,
        targetCount: 0,
        successCount: 0,
        failureCount: 0,
      };
    }

    const tokens = installations.map((i) => i.fcmToken).filter(Boolean);
    const installationByToken = new Map();
    installations.forEach((i) => {
      if (i.fcmToken) installationByToken.set(i.fcmToken, i);
    });

    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens = [];

    // Process in batches of FCM_MAX_BATCH_SIZE
    for (let i = 0; i < tokens.length; i += FCM_MAX_BATCH_SIZE) {
      const batchTokens = tokens.slice(i, i + FCM_MAX_BATCH_SIZE);

      const message = {
        notification: {
          title: trimmedTitle,
          body: trimmedBody,
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            title: trimmedTitle,
            body: trimmedBody,
            icon,
            badge: "/icons/icon-192x192.png",
            tag: "raja-rani-push",
            renotify: true,
            data: {
              url: safeDeepLink,
            },
          },
          fcmOptions: {
            link: safeDeepLink,
          },
        },
        data: {
          title: trimmedTitle,
          body: trimmedBody,
          deepLink: safeDeepLink,
          sentAt: new Date().toISOString(),
        },
        tokens: batchTokens,
      };

      try {
        const response = await messaging.sendEachForMulticast(message);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
              const errorCode = resp.error.code;
              const failedToken = batchTokens[idx];
              if (INVALID_TOKEN_ERROR_CODES.includes(errorCode)) {
                invalidTokens.push(failedToken);
              }
            }
          });
        }
      } catch (batchErr) {
        console.error(`[FCM] Batch dispatch failed for chunk ${i}:`, batchErr.message);
        totalFailure += batchTokens.length;
      }
    }

    // Clean up or deactivate invalid installations
    if (invalidTokens.length > 0) {
      console.log(`[FCM] Deactivating ${invalidTokens.length} invalid/stale installations`);
      await PushInstallation.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { $set: { notificationsEnabled: false, permission: "DENIED" } }
      );
    }

    const finalStatus =
      totalFailure === 0
        ? "SENT"
        : totalSuccess === 0
        ? "FAILED"
        : "PARTIAL";

    logDoc.targetCount = tokens.length;
    logDoc.successCount = totalSuccess;
    logDoc.failureCount = totalFailure;
    logDoc.status = finalStatus;
    logDoc.sentAt = new Date();
    await logDoc.save();

    console.log(
      `[FCM] Notification sent: "${trimmedTitle}" — Status: ${finalStatus} (${totalSuccess} succeeded, ${totalFailure} failed)`
    );

    return {
      log: logDoc,
      targetCount: tokens.length,
      successCount: totalSuccess,
      failureCount: totalFailure,
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;

import mongoose from "mongoose";
import PushInstallation from "../models/PushInstallation.js";
import User from "../models/User.js";
import AutomaticNotificationConfig from "../models/AutomaticNotificationConfig.js";
import NotificationEvent from "../models/NotificationEvent.js";
import notificationService from "./notificationService.js";
import notificationFrequencyService from "./notificationFrequencyService.js";

// Default seed automatic notification configurations
const DEFAULT_AUTO_CONFIGS = [
  {
    eventType: "ROOM_INVITATION",
    displayName: "Room Invitation",
    category: "ROOMS",
    enabled: true,
    titleTemplate: "⚔️ Royal Battle Invitation",
    bodyTemplate: "{{username}} invited you to join a Royal Battle in room {{roomCode}}!",
    deepLinkTemplate: "/?join={{roomCode}}",
    cooldownMinutes: 15,
  },
  {
    eventType: "FRIEND_INVITATION",
    displayName: "Friend Invitation",
    category: "FRIENDS",
    enabled: true,
    titleTemplate: "👑 Friend Invite",
    bodyTemplate: "{{username}} invited you to play Raja Rani Police Thief.",
    deepLinkTemplate: "/",
    cooldownMinutes: 30,
  },
  {
    eventType: "ROOM_READY",
    displayName: "Room Ready",
    category: "ROOMS",
    enabled: true,
    titleTemplate: "👑 The Royal Battle is Ready!",
    bodyTemplate: "All 4 players have assembled in room {{roomCode}}. The kingdom awaits!",
    deepLinkTemplate: "/?join={{roomCode}}",
    cooldownMinutes: 10,
  },
  {
    eventType: "ACHIEVEMENT_UNLOCKED",
    displayName: "Achievement Unlocked",
    category: "ACHIEVEMENTS",
    enabled: true,
    titleTemplate: "🏆 Royal Achievement Unlocked!",
    bodyTemplate: "Congratulations {{username}}! You unlocked \"{{achievementName}}\".",
    deepLinkTemplate: "/profile",
    cooldownMinutes: 5,
  },
  {
    eventType: "LEVEL_UP",
    displayName: "Level Up",
    category: "LEVEL_UP",
    enabled: true,
    titleTemplate: "⭐ Royal Rank Up!",
    bodyTemplate: "Hail {{username}}! You've ascended to Level {{level}}!",
    deepLinkTemplate: "/profile",
    cooldownMinutes: 5,
  },
  {
    eventType: "GAME_WON",
    displayName: "Victory in Battle",
    category: "GAME_EVENTS",
    enabled: true,
    titleTemplate: "🏆 Victory in the Kingdom!",
    bodyTemplate: "Glory to {{username}}! You triumphed with {{score}} points in room {{roomCode}}!",
    deepLinkTemplate: "/profile",
    cooldownMinutes: 3,
  },
  {
    eventType: "DETECTIVE_VICTORY",
    displayName: "Mystery Solved",
    category: "GAME_EVENTS",
    enabled: true,
    titleTemplate: "🕵️ Master Detective Triumph!",
    bodyTemplate: "Detective {{username}} solved the mystery with {{score}} pts in room {{roomCode}}!",
    deepLinkTemplate: "/profile",
    cooldownMinutes: 3,
  },
  {
    eventType: "DAILY_RETURN",
    displayName: "Daily Streak Reminder",
    category: "REMINDERS",
    enabled: true,
    titleTemplate: "👑 Your Daily Battle Awaits",
    bodyTemplate: "Keep your winning streak alive! Play a quick battle today.",
    deepLinkTemplate: "/",
    cooldownMinutes: 1440, // 24 hours
  },
  {
    eventType: "INACTIVE_3D",
    displayName: "3-Day Inactivity Reminder",
    category: "REMINDERS",
    enabled: true,
    titleTemplate: "👑 Your Kingdom Misses You",
    bodyTemplate: "Your friends are waiting. Return for another Royal Battle tonight!",
    deepLinkTemplate: "/",
    cooldownMinutes: 4320, // 3 days
  },
  {
    eventType: "INACTIVE_7D",
    displayName: "7-Day Inactivity Reminder",
    category: "REMINDERS",
    enabled: false,
    titleTemplate: "⚔️ The Throne Awaits",
    bodyTemplate: "It's been a week! Claim your kingdom rewards before they expire.",
    deepLinkTemplate: "/",
    cooldownMinutes: 10080, // 7 days
  },
];

class GameNotificationService {
  constructor() {
    this.io = null;
    this.activeSocketsByUser = new Map(); // userId -> Set<socketId>
  }

  /**
   * Bind Socket.IO server reference for in-app messaging & active user detection
   */
  setSocketServer(io) {
    this.io = io;
  }

  /**
   * Track socket connection for a user
   */
  registerUserSocket(userId, socketId) {
    if (!userId || !socketId) return;
    const uId = userId.toString();
    if (!this.activeSocketsByUser.has(uId)) {
      this.activeSocketsByUser.set(uId, new Set());
    }
    this.activeSocketsByUser.get(uId).add(socketId);
  }

  /**
   * Remove socket disconnection for a user
   */
  unregisterUserSocket(userId, socketId) {
    if (!userId) return;
    const uId = userId.toString();
    if (this.activeSocketsByUser.has(uId)) {
      this.activeSocketsByUser.get(uId).delete(socketId);
      if (this.activeSocketsByUser.get(uId).size === 0) {
        this.activeSocketsByUser.delete(uId);
      }
    }
  }

  /**
   * Check if a user is actively online on Socket.IO
   */
  isUserOnline(userId) {
    if (!userId) return false;
    const sockets = this.activeSocketsByUser.get(userId.toString());
    return !!(sockets && sockets.size > 0);
  }

  /**
   * Safely interpolate template variables
   */
  renderTemplate(templateString, variables = {}) {
    if (!templateString || typeof templateString !== "string") return "";
    return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : "";
    });
  }

  /**
   * Get or initialize AutomaticNotificationConfig
   */
  async getConfig(eventType) {
    let config = await AutomaticNotificationConfig.findOne({ eventType }).lean();
    if (!config) {
      const def = DEFAULT_AUTO_CONFIGS.find((c) => c.eventType === eventType);
      if (def) {
        config = await AutomaticNotificationConfig.create(def);
      }
    }
    return config;
  }

  /**
   * Initialize all default configs on boot
   */
  async initializeDefaultConfigs() {
    try {
      const count = await AutomaticNotificationConfig.countDocuments();
      if (count === 0) {
        await AutomaticNotificationConfig.insertMany(DEFAULT_AUTO_CONFIGS);
        console.log("[GameNotification] Initialized default automatic notification configs.");
      }
    } catch (err) {
      console.warn("[GameNotification] Could not seed configs:", err.message);
    }
  }

  /**
   * Core synchronous/awaitable event execution logic
   */
  async executeEventCore({
    eventType,
    recipientUserId,
    variables = {},
    cooldownKey = null,
    isCritical = false,
  }) {
    if (!recipientUserId || !mongoose.Types.ObjectId.isValid(recipientUserId)) {
      return null;
    }

    // 1. Check if event is enabled in admin config
    const config = await this.getConfig(eventType);
    if (!config || !config.enabled) {
      return null;
    }

    // 2. Cooldown anti-spam check
    const eventKey = cooldownKey || `${eventType}:${recipientUserId}`;
    if (!isCritical && !notificationFrequencyService.canSendEvent(eventKey, config.cooldownMinutes)) {
      return null;
    }

    // 3. Render content
    const title = this.renderTemplate(config.titleTemplate, variables);
    const body = this.renderTemplate(config.bodyTemplate, variables);
    const deepLink = this.renderTemplate(config.deepLinkTemplate, variables) || "/";

    // 4. Deliver in-app Socket.IO toast if player is actively online
    const isOnline = this.isUserOnline(recipientUserId);
    if (isOnline && this.io) {
      const sockets = this.activeSocketsByUser.get(recipientUserId.toString());
      if (sockets) {
        for (const socketId of sockets) {
          this.io.to(socketId).emit("game-notification", {
            type: eventType,
            category: config.category,
            title,
            body,
            deepLink,
            icon: config.icon || "/icons/icon-192x192.png",
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    notificationFrequencyService.recordEventSent(eventKey);

    // Record in-app or targeted event in analytics
    await NotificationEvent.create({
      category: config.category,
      eventType: isOnline ? "SENT" : "TARGETED",
      userId: recipientUserId,
      targetType: isOnline ? "SOCKET_IN_APP" : "USER",
      metadata: { eventType, deepLink, isOnline },
    }).catch(() => {});

    // 5. Dispatch FCM push notification & record in NotificationLog
    let dispatchResult = null;
    try {
      dispatchResult = await notificationService.sendNotification({
        title,
        body,
        targetType: "SPECIFIC_USER",
        targetId: recipientUserId.toString(),
        deepLink,
        icon: config.icon || "/icons/icon-192x192.png",
        createdBy: `Auto: ${config.displayName || eventType}`,
        category: config.category || "GAME_EVENTS",
        source: "AUTOMATIC",
      });
    } catch (err) {
      console.warn(`[GameNotification] FCM push dispatch error for "${eventType}":`, err.message);
    }

    // 6. Record final event status in analytics
    const finalStatus =
      dispatchResult?.successCount > 0 ? "SENT" : isOnline ? "SENT" : "FAILED";
    await NotificationEvent.create({
      category: config.category,
      eventType: finalStatus,
      userId: recipientUserId,
      targetType: "FCM_PUSH",
      metadata: {
        eventType,
        deepLink,
        targetCount: dispatchResult?.targetCount || 0,
        successCount: dispatchResult?.successCount || 0,
        failureCount: dispatchResult?.failureCount || 0,
      },
    }).catch(() => {});

    return {
      title,
      body,
      isOnline,
      dispatchResult,
    };
  }

  /**
   * Central asynchronous decision pipeline
   */
  async processEvent(params) {
    // Run entirely asynchronous so caller never blocks game loop
    setImmediate(async () => {
      try {
        await this.executeEventCore(params);
      } catch (err) {
        console.error(`[GameNotification] Failed to process event "${params.eventType}":`, err.message);
      }
    });
  }

  /**
   * Synchronous / Awaitable execution (for admin testing and testing scripts)
   */
  async processEventSync(params) {
    return await this.executeEventCore(params);
  }

  mapCategoryToPrefKey(category) {
    switch (category) {
      case "FRIENDS":
        return "friends";
      case "ROOMS":
        return "rooms";
      case "ACHIEVEMENTS":
        return "achievements";
      case "LEVEL_UP":
        return "levelUp";
      case "GAME_EVENTS":
        return "gameEvents";
      case "REMINDERS":
        return "reminders";
      case "NEWS":
        return "news";
      case "PROMOTIONS":
        return "promotions";
      default:
        return null;
    }
  }

  // --- PUBLIC GAME EVENT HANDLERS ---

  dispatchRoomInvitation({ senderName, recipientUserId, roomCode }) {
    this.processEvent({
      eventType: "ROOM_INVITATION",
      recipientUserId,
      variables: { username: senderName, roomCode },
      cooldownKey: `ROOM_INVITATION:${roomCode}:${recipientUserId}`,
      isCritical: true,
    });
  }

  dispatchFriendInvitation({ senderName, recipientUserId }) {
    this.processEvent({
      eventType: "FRIEND_INVITATION",
      recipientUserId,
      variables: { username: senderName },
      cooldownKey: `FRIEND_INVITATION:${senderName}:${recipientUserId}`,
    });
  }

  dispatchRoomReady({ roomCode, recipientUserIds = [] }) {
    if (!recipientUserIds || recipientUserIds.length === 0) {
      if (this.io && roomCode) {
        this.io.to(roomCode.toUpperCase()).emit("game-notification", {
          type: "ROOM_READY",
          category: "ROOMS",
          title: "👑 The Royal Battle is Ready!",
          body: `All players have assembled in room ${roomCode.toUpperCase()}. The kingdom awaits!`,
          deepLink: `/?join=${roomCode.toUpperCase()}`,
          icon: "/icons/icon-192x192.png",
          timestamp: new Date().toISOString(),
        });
      }
      return;
    }
    for (const userId of recipientUserIds) {
      this.processEvent({
        eventType: "ROOM_READY",
        recipientUserId: userId,
        variables: { roomCode },
        cooldownKey: `ROOM_READY:${roomCode}:${userId}`,
        isCritical: true,
      });
    }
  }

  dispatchAchievementUnlocked({ userId, username, achievementName, achievementCode }) {
    this.processEvent({
      eventType: "ACHIEVEMENT_UNLOCKED",
      recipientUserId: userId,
      variables: { username, achievementName },
      cooldownKey: `ACHIEVEMENT:${achievementCode}:${userId}`,
      isCritical: true,
    });
  }

  dispatchLevelUp({ userId, username, newLevel, oldLevel }) {
    this.processEvent({
      eventType: "LEVEL_UP",
      recipientUserId: userId,
      variables: { username, level: newLevel, oldLevel },
      cooldownKey: `LEVEL_UP:${newLevel}:${userId}`,
      isCritical: true,
    });
  }

  dispatchGameWon({ userId, username, roomCode, score }) {
    this.processEvent({
      eventType: "GAME_WON",
      recipientUserId: userId,
      variables: { username, roomCode, score: score || 0 },
      cooldownKey: `GAME_WON:${roomCode}:${userId}`,
      isCritical: true,
    });
  }

  dispatchDetectiveVictory({ userId, username, roomCode, score }) {
    this.processEvent({
      eventType: "DETECTIVE_VICTORY",
      recipientUserId: userId,
      variables: { username, roomCode, score: score || 0 },
      cooldownKey: `DETECTIVE_VICTORY:${roomCode}:${userId}`,
      isCritical: true,
    });
  }

  dispatchInactivityReminder({ userId, daysInactive }) {
    const eventType = daysInactive >= 7 ? "INACTIVE_7D" : "INACTIVE_3D";
    this.processEvent({
      eventType,
      recipientUserId: userId,
      variables: { days: daysInactive },
      cooldownKey: `${eventType}:${userId}`,
    });
  }
}

export const gameNotificationService = new GameNotificationService();
export default gameNotificationService;

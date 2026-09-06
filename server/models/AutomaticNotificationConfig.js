import mongoose from "mongoose";

const AutomaticNotificationConfigSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      unique: true,
      index: true,
      enum: [
        "ROOM_INVITATION",
        "FRIEND_INVITATION",
        "PLAYER_JOINED_ROOM",
        "ROOM_READY",
        "MATCH_STARTING",
        "MATCH_RESULT",
        "ACHIEVEMENT_UNLOCKED",
        "LEVEL_UP",
        "XP_GAINED",
        "GAME_WON",
        "DETECTIVE_VICTORY",
        "DAILY_RETURN",
        "INACTIVE_3D",
        "INACTIVE_7D",
        "SPECIAL_EVENT",
        "ADMIN_ANNOUNCEMENT",
      ],
    },
    displayName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "FRIENDS",
        "ROOMS",
        "ACHIEVEMENTS",
        "LEVEL_UP",
        "GAME_EVENTS",
        "REMINDERS",
        "NEWS",
        "PROMOTIONS",
      ],
      required: true,
      default: "GAME_EVENTS",
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    titleTemplate: {
      type: String,
      required: true,
      maxlength: 120,
    },
    bodyTemplate: {
      type: String,
      required: true,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: "/icons/icon-192x192.png",
    },
    deepLinkTemplate: {
      type: String,
      default: "/",
    },
    cooldownMinutes: {
      type: Number,
      default: 30, // default cooldown between identical events
      min: 0,
      max: 10080, // up to 7 days
    },
    updatedBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

const AutomaticNotificationConfig =
  mongoose.models.AutomaticNotificationConfig ||
  mongoose.model(
    "AutomaticNotificationConfig",
    AutomaticNotificationConfigSchema
  );

export default AutomaticNotificationConfig;

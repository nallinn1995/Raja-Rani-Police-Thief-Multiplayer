import mongoose from "mongoose";

const NotificationEventSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      index: true,
      default: null,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationCampaign",
      index: true,
      default: null,
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
        "GENERAL",
      ],
      default: "GENERAL",
      index: true,
    },
    eventType: {
      type: String,
      enum: ["TARGETED", "SENT", "FAILED", "DELIVERED", "OPENED", "CLICKED"],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    installationId: {
      type: String,
      default: null,
      index: true,
    },
    targetType: {
      type: String,
      default: "ALL_ENABLED",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationEventSchema.index({ eventType: 1, timestamp: -1 });
NotificationEventSchema.index({ campaignId: 1, eventType: 1 });
NotificationEventSchema.index({ category: 1, eventType: 1, timestamp: -1 });

const NotificationEvent =
  mongoose.models.NotificationEvent ||
  mongoose.model("NotificationEvent", NotificationEventSchema);

export default NotificationEvent;

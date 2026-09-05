import mongoose from "mongoose";

const NotificationCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ["ONE_TIME", "RECURRING"],
      required: true,
      default: "ONE_TIME",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: "/icons/icon-192x192.png",
      trim: true,
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
    deepLink: {
      type: String,
      default: "/",
      trim: true,
    },
    targetType: {
      type: String,
      enum: [
        "ALL_ENABLED",
        "REGISTERED_USERS",
        "SPECIFIC_USER",
        "SPECIFIC_INSTALLATION",
      ],
      required: true,
      default: "ALL_ENABLED",
    },
    targetUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    targetInstallationIds: [
      {
        type: String,
        trim: true,
      },
    ],
    advancedFilter: {
      levelMin: { type: Number, default: null },
      levelMax: { type: Number, default: null },
      lastPlayedDays: { type: Number, default: null },
      gameMode: { type: String, default: null }, // CLASSIC, DETECTIVE, POLICE, MODERN, OFFLINE
      onlyPushEnabled: { type: Boolean, default: true },
    },
    schedule: {
      timezone: {
        type: String,
        required: true,
        default: "Asia/Kolkata",
        trim: true,
      },
      startAt: {
        type: Date,
        required: true,
      },
      endAt: {
        type: Date,
        default: null,
      },
      recurrence: {
        frequency: {
          type: String,
          enum: ["DAILY", "WEEKLY", "MONTHLY"],
          default: "DAILY",
        },
        interval: {
          type: Number,
          default: 1,
          min: 1,
          max: 365,
        },
        daysOfWeek: {
          type: [Number], // 0=Sunday, 1=Monday, ..., 6=Saturday
          default: [],
        },
        dayOfMonth: {
          type: Number, // 1-31
          default: 1,
          min: 1,
          max: 31,
        },
        timeOfDay: {
          type: String, // "HH:mm" (24-hour)
          required: true,
          default: "20:00",
          trim: true,
        },
      },
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "SCHEDULED",
        "ACTIVE",
        "PAUSED",
        "COMPLETED",
        "CANCELLED",
        "FAILED",
      ],
      required: true,
      default: "SCHEDULED",
      index: true,
    },
    createdBy: {
      type: String,
      default: "admin",
      trim: true,
    },
    updatedBy: {
      type: String,
      default: null,
      trim: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      default: null,
      index: true,
    },
    runCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Distributed lock to prevent duplicate runs across instances
    lockUntil: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal scheduler queries & admin listings
NotificationCampaignSchema.index({ status: 1, nextRunAt: 1, isArchived: 1 });
NotificationCampaignSchema.index({ isArchived: 1, createdAt: -1 });

const NotificationCampaign =
  mongoose.models.NotificationCampaign ||
  mongoose.model("NotificationCampaign", NotificationCampaignSchema);

export default NotificationCampaign;

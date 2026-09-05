import mongoose from "mongoose";

const PushInstallationSchema = new mongoose.Schema(
  {
    installationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    fcmToken: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    fid: {
      type: String,
      index: true,
      trim: true,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guestDeviceId: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["WEB"],
      default: "WEB",
    },
    appType: {
      type: String,
      enum: ["PWA", "BROWSER"],
      default: "BROWSER",
    },
    deviceType: {
      type: String,
      enum: ["MOBILE", "TABLET", "DESKTOP"],
      default: "DESKTOP",
    },
    permission: {
      type: String,
      enum: ["GRANTED", "DENIED", "DEFAULT"],
      default: "DEFAULT",
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    preferences: {
      friends: { type: Boolean, default: true },
      rooms: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      levelUp: { type: Boolean, default: true },
      gameEvents: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      news: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: "22:00" }, // "HH:mm"
      end: { type: String, default: "08:00" }, // "HH:mm"
      timezone: { type: String, default: "Asia/Kolkata" },
    },
    userAgent: {
      type: String,
      default: "",
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries when finding active devices to broadcast to
PushInstallationSchema.index({ notificationsEnabled: 1, permission: 1 });

const PushInstallation =
  mongoose.models.PushInstallation ||
  mongoose.model("PushInstallation", PushInstallationSchema);

export default PushInstallation;

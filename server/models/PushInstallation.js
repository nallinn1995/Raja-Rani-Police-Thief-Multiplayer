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

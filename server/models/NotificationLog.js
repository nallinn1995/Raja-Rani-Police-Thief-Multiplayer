import mongoose from "mongoose";

const NotificationLogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 120,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["ALL", "INSTALLATION", "USER"],
      required: true,
      default: "ALL",
    },
    targetId: {
      type: String,
      default: null,
      trim: true,
    },
    targetCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    successCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PROCESSING", "SENT", "PARTIAL", "FAILED"],
      default: "PROCESSING",
    },
    category: {
      type: String,
      default: "BROADCAST",
      trim: true,
    },
    source: {
      type: String,
      enum: ["DIRECT", "CAMPAIGN", "AUTOMATIC"],
      default: "DIRECT",
    },
    createdBy: {
      type: String,
      default: "admin",
      trim: true,
    },
    deepLink: {
      type: String,
      default: "/",
      trim: true,
    },
    errorSummary: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

NotificationLogSchema.index({ createdAt: -1 });

const NotificationLog =
  mongoose.models.NotificationLog ||
  mongoose.model("NotificationLog", NotificationLogSchema);

export default NotificationLog;

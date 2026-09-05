import mongoose from "mongoose";

const NotificationCampaignRunSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationCampaign",
      required: true,
      index: true,
    },
    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
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
      index: true,
    },
    errorSummary: {
      type: String,
      default: null,
      trim: true,
    },
    executedBy: {
      type: String,
      default: "scheduler",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationCampaignRunSchema.index({ campaignId: 1, scheduledAt: -1 });

const NotificationCampaignRun =
  mongoose.models.NotificationCampaignRun ||
  mongoose.model("NotificationCampaignRun", NotificationCampaignRunSchema);

export default NotificationCampaignRun;

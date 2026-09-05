import mongoose from "mongoose";

const NotificationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      enum: ["GENERAL", "GAME", "EVENT", "REMINDER", "REWARD", "ANNOUNCEMENT"],
      required: true,
      default: "GENERAL",
      index: true,
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
  },
  {
    timestamps: true,
  }
);

NotificationTemplateSchema.index({ category: 1, createdAt: -1 });

const NotificationTemplate =
  mongoose.models.NotificationTemplate ||
  mongoose.model("NotificationTemplate", NotificationTemplateSchema);

export default NotificationTemplate;

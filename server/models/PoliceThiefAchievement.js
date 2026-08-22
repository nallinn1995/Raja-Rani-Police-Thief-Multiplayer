import mongoose from "mongoose";

const policeThiefAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "🏆" },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

policeThiefAchievementSchema.index({ userId: 1, code: 1 }, { unique: true });

export default mongoose.models.PoliceThiefAchievement ||
  mongoose.model("PoliceThiefAchievement", policeThiefAchievementSchema);

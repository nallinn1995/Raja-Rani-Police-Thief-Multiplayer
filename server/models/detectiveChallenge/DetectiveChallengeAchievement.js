import mongoose from "mongoose";

const detectiveChallengeAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "🔍" },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

detectiveChallengeAchievementSchema.index({ userId: 1, code: 1 }, { unique: true });

export default mongoose.models.DetectiveChallengeAchievement ||
  mongoose.model("DetectiveChallengeAchievement", detectiveChallengeAchievementSchema);

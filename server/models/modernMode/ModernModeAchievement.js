import mongoose from "mongoose";

const modernModeAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    achievementId: {
      type: String,
      required: true,
      enum: [
        "ROYAL_GENIUS",
        "QUEENS_INTUITION",
        "MASTER_DETECTIVE",
        "ESCAPE_ARTIST",
        "TRUSTED_WITNESS",
        "ROYAL_GUARDIAN",
        "KINGDOM_SAVIOR",
      ],
    },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

modernModeAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export default mongoose.model("ModernModeAchievement", modernModeAchievementSchema);

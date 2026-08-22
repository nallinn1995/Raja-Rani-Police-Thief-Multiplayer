import mongoose from "mongoose";

const detectiveChallengeTitleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String, default: "Detective" },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

detectiveChallengeTitleSchema.index({ userId: 1, title: 1 }, { unique: true });

export default mongoose.models.DetectiveChallengeTitle ||
  mongoose.model("DetectiveChallengeTitle", detectiveChallengeTitleSchema);

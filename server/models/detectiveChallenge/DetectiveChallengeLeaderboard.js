import mongoose from "mongoose";

const detectiveChallengeLeaderboardSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["highest_accuracy", "fastest_guess", "most_wins", "longest_streak"],
    },
    rank: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    avatar: { type: String, default: "1" },
    title: { type: String, default: "Junior Detective" },
    metrics: {
      accuracy: { type: Number, default: 0 },
      avgGuessTime: { type: Number, default: 0 },
      fastestGuess: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 },
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

detectiveChallengeLeaderboardSchema.index({ category: 1, rank: 1 }, { unique: true });

export default mongoose.models.DetectiveChallengeLeaderboard ||
  mongoose.model("DetectiveChallengeLeaderboard", detectiveChallengeLeaderboardSchema);

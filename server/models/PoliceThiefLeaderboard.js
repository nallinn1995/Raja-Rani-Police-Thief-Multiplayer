import mongoose from "mongoose";

const policeThiefLeaderboardSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "top_detective",
        "highest_accuracy",
        "most_catches",
        "fastest_detective",
        "most_escapes",
        "longest_streak",
      ],
    },
    rank: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    avatar: { type: String, default: "1" },
    title: { type: String, default: "Recruit Detective" },
    metrics: {
      detectiveWins: { type: Number, default: 0 },
      correctCatches: { type: Number, default: 0 },
      wrongGuesses: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      policeTurns: { type: Number, default: 0 },
      thiefEscaped: { type: Number, default: 0 },
      escapeRate: { type: Number, default: 0 },
      fastestCatch: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

policeThiefLeaderboardSchema.index({ category: 1, rank: 1 }, { unique: true });

export default mongoose.models.PoliceThiefLeaderboard ||
  mongoose.model("PoliceThiefLeaderboard", policeThiefLeaderboardSchema);

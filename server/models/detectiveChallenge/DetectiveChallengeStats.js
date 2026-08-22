import mongoose from "mongoose";

const detectiveChallengeStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: { type: String, required: true },
    avatar: { type: String, default: "1" },
    title: { type: String, default: "Junior Detective" },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },

    // Match Metrics
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },

    // Investigation Performance
    totalCorrectGuesses: { type: Number, default: 0 },
    totalWrongGuesses: { type: Number, default: 0 },
    overallAccuracy: { type: Number, default: 0 }, // %

    // Decision Speed Metrics
    fastestGuessTime: { type: Number, default: 0 }, // seconds (e.g. 1.85)
    slowestGuessTime: { type: Number, default: 0 },
    totalGuessTimeSum: { type: Number, default: 0 },
    totalGuessTimeCount: { type: Number, default: 0 },
    averageGuessTime: { type: Number, default: 0 },

    // Streaks & Records
    currentWinStreak: { type: Number, default: 0 },
    longestWinStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    highestAccuracy: { type: Number, default: 0 },

    lastPlayedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.DetectiveChallengeStats ||
  mongoose.model("DetectiveChallengeStats", detectiveChallengeStatsSchema);

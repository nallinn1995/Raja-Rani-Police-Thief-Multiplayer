import mongoose from "mongoose";

const policeThiefStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    avatar: { type: String, default: "1" },
    title: { type: String, default: "Recruit Detective" },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },

    // Match Metrics
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    detectiveWins: { type: Number, default: 0 },

    // Detective Metrics
    totalCorrectCatches: { type: Number, default: 0 },
    totalWrongGuesses: { type: Number, default: 0 },
    policeAccuracy: { type: Number, default: 0 },
    timesPlayedAsPolice: { type: Number, default: 0 },
    fastestCorrectCatch: { type: Number, default: 0 }, // seconds
    totalGuessTimeSum: { type: Number, default: 0 },
    totalGuessTimeCount: { type: Number, default: 0 },
    averageGuessTime: { type: Number, default: 0 },
    currentDetectiveWinStreak: { type: Number, default: 0 },
    longestDetectiveWinStreak: { type: Number, default: 0 },

    // Thief Metrics
    timesPlayedAsThief: { type: Number, default: 0 },
    thiefEscaped: { type: Number, default: 0 },
    thiefCaught: { type: Number, default: 0 },
    escapeRate: { type: Number, default: 0 },
    currentEscapeStreak: { type: Number, default: 0 },
    longestEscapeStreak: { type: Number, default: 0 },

    // Lifetime Records
    records: {
      highestAccuracyInMatch: { type: Number, default: 0 },
      mostCatchesInMatch: { type: Number, default: 0 },
      mostEscapesInMatch: { type: Number, default: 0 },
      fastestCatchSeconds: { type: Number, default: 0 },
    },

    lastPlayedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.PoliceThiefStats ||
  mongoose.model("PoliceThiefStats", policeThiefStatsSchema);

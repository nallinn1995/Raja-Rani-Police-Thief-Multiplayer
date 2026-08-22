import mongoose from "mongoose";

const modernModeStatsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    username: { type: String, required: true },
    xp: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    currentWinStreak: { type: Number, default: 0 },
    longestWinStreak: { type: Number, default: 0 },
    totalMatchDuration: { type: Number, default: 0 },
    timesRaja: { type: Number, default: 0 },
    timesRani: { type: Number, default: 0 },
    timesPolice: { type: Number, default: 0 },
    timesThief: { type: Number, default: 0 },
    timesMantri: { type: Number, default: 0 },
    timesVillager: { type: Number, default: 0 },
    correctRajaGuesses: { type: Number, default: 0 },
    correctRaniGuesses: { type: Number, default: 0 },
    policeCatches: { type: Number, default: 0 },
    policeWrongGuesses: { type: Number, default: 0 },
    thiefEscapes: { type: Number, default: 0 },
    villagerWitnessBonuses: { type: Number, default: 0 },
    villagerInsightBonuses: { type: Number, default: 0 },
    mantriShieldSuccesses: { type: Number, default: 0 },
    mantriShieldFailures: { type: Number, default: 0 },
    mantriProtectedThiefCount: { type: Number, default: 0 },
    mantriSupportBonusTotal: { type: Number, default: 0 },
    mantriKingdomPointsSaved: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("ModernModeStats", modernModeStatsSchema);

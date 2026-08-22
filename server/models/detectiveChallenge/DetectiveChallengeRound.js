import mongoose from "mongoose";

const detectiveChallengeRoundSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    roundNumber: { type: Number, required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: { type: String, required: true },
    selectedCardId: { type: String, required: true },
    actualThiefCardId: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    guessTime: { type: Number, required: true }, // e.g. 2.31s
    accuracy: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    badgeEarned: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.DetectiveChallengeRound ||
  mongoose.model("DetectiveChallengeRound", detectiveChallengeRoundSchema);

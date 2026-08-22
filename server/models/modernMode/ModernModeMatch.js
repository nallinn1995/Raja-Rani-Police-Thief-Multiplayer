import mongoose from "mongoose";

const modernModeMatchSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, index: true },
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        playerId: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        baseScore: { type: Number, default: 0 },
        lootedPoints: { type: Number, default: 0 },
        preventedLoot: { type: Number, default: 0 },
        bonusPoints: { type: Number, default: 0 },
        penaltyPoints: { type: Number, default: 0 },
        finalScore: { type: Number, default: 0 },
        rank: { type: Number, default: 0 },
        isWinner: { type: Boolean, default: false },
        awards: [{ type: String }],
      },
    ],
    details: {
      mantriShieldTargetRole: { type: String, default: null },
      mantriShieldTargetId: { type: String, default: null },
      mantriShieldSuccess: { type: Boolean, default: false },
      rajaGuessId: { type: String, default: null },
      rajaGuessSuccess: { type: Boolean, default: false },
      raniGuessId: { type: String, default: null },
      raniGuessSuccess: { type: Boolean, default: false },
      policeGuessId: { type: String, default: null },
      policeGuessSuccess: { type: Boolean, default: false },
      villagerChoice: { type: String, enum: ["agree", "disagree", null], default: null },
      villagerBonusEarned: { type: Boolean, default: false },
      villagerBonusType: { type: String, default: "none" },
    },
    winnerId: { type: String },
    winnerName: { type: String },
    matchDuration: { type: Number, default: 50 },
  },
  { timestamps: true }
);

export default mongoose.model("ModernModeMatch", modernModeMatchSchema);

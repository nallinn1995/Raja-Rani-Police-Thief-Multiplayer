import mongoose from "mongoose";

const policeThiefMatchHistorySchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    totalRounds: { type: Number, default: 1 },
    duration: { type: Number, default: 0 },
    championUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    championUsername: { type: String, default: "None" },
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String, required: true },
        rank: { type: Number, default: 1 },
        isChampion: { type: Boolean, default: false },
        correctCatches: { type: Number, default: 0 },
        wrongGuesses: { type: Number, default: 0 },
        policeAccuracy: { type: Number, default: 0 },
        policeTurnsCompleted: { type: Number, default: 0 },
        thiefEscaped: { type: Number, default: 0 },
        thiefCaught: { type: Number, default: 0 },
        escapeRate: { type: Number, default: 0 },
        fastestCatch: { type: Number, default: 0 },
        title: { type: String, default: "Recruit Detective" },
      },
    ],
    roundSummaries: [
      {
        roundNumber: { type: Number, required: true },
        policeName: { type: String, default: "" },
        actualThief: { type: String, default: "" },
        policeSelected: { type: String, default: "" },
        isCorrect: { type: Boolean, default: false },
        guessTime: { type: Number, default: 0 },
      },
    ],
    endedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.PoliceThiefMatchHistory ||
  mongoose.model("PoliceThiefMatchHistory", policeThiefMatchHistorySchema);

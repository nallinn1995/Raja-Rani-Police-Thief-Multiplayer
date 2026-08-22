import mongoose from "mongoose";

const matchHistorySchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    gameMode: { type: String, required: true },
    totalRounds: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String, required: true },
        score: { type: Number, default: 0 },
        rank: { type: Number, default: 1 },
        isWinner: { type: Boolean, default: false },
        correctCatches: { type: Number, default: 0 },
        wrongGuesses: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        policeTurnsCompleted: { type: Number, default: 0 },
        thiefEscaped: { type: Number, default: 0 },
        thiefCaught: { type: Number, default: 0 },
        title: { type: String, default: "Recruit Detective" },
        fastestCatch: { type: Number, default: 0 },
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
    winnerUsername: { type: String },
    endedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.MatchHistory ||
  mongoose.model("MatchHistory", matchHistorySchema);

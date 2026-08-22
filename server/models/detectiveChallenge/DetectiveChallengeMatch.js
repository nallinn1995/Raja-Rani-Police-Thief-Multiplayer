import mongoose from "mongoose";

const detectiveChallengeMatchSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    totalRounds: { type: Number, default: 5 },
    duration: { type: Number, default: 0 },
    championUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    championUsername: { type: String, default: "None" },
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String, required: true },
        rank: { type: Number, default: 1 },
        isChampion: { type: Boolean, default: false },
        correctCount: { type: Number, default: 0 },
        wrongCount: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        avgGuessTime: { type: Number, default: 0 },
        fastestGuess: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        badgeEarned: { type: String, default: "" },
      },
    ],
    roundLogs: [
      {
        roundNumber: { type: Number, required: true },
        actualThiefCardId: { type: String, required: true },
        thiefName: { type: String, default: "" },
        playerSelections: [
          {
            username: { type: String, required: true },
            selectedCardId: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
            guessTime: { type: Number, default: 0 },
          },
        ],
      },
    ],
    endedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.DetectiveChallengeMatch ||
  mongoose.model("DetectiveChallengeMatch", detectiveChallengeMatchSchema);

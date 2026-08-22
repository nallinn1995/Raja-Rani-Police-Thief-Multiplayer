import mongoose from "mongoose";

const policeThiefRoundHistorySchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    roundNumber: { type: Number, required: true },
    policeUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    policeName: { type: String, required: true },
    actualThiefUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actualThiefName: { type: String, required: true },
    guessedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guessedName: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    guessTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.PoliceThiefRoundHistory ||
  mongoose.model("PoliceThiefRoundHistory", policeThiefRoundHistorySchema);

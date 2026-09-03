import mongoose from "mongoose";

const guestSessionSchema = new mongoose.Schema(
  {
    guestDeviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      default: "Guest Player",
      trim: true,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    offlineGamesPlayed: {
      type: Number,
      default: 0,
    },
    matchesCompleted: {
      type: Number,
      default: 0,
    },
    lastPlayedMode: {
      type: String,
      default: "",
    },
    lastPlayedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.GuestSession ||
  mongoose.model("GuestSession", guestSessionSchema);

import mongoose from "mongoose";

const playerStatsSchema = new mongoose.Schema(
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
    description: { type: String, default: "" },
    country: { type: String, default: "IN" },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    title: { type: String, default: "Rookie" },
    lastPlayedAt: { type: Date, default: Date.now },

    // Overall Lifetime Statistics
    totalGames: { type: Number, default: 0 },
    offlineGamesPlayed: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    totalRoundsPlayed: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalTimePlayed: { type: Number, default: 0 }, // seconds
    currentWinStreak: { type: Number, default: 0 },
    longestWinStreak: { type: Number, default: 0 },

    // Role Detailed Statistics
    roleStats: {
      raja: {
        timesAssigned: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 0 },
      },
      rani: {
        timesAssigned: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 0 },
      },
      police: {
        timesAssigned: { type: Number, default: 0 },
        correctCatches: { type: Number, default: 0 },
        wrongGuesses: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
      thief: {
        timesAssigned: { type: Number, default: 0 },
        escaped: { type: Number, default: 0 },
        caught: { type: Number, default: 0 },
        escapeRate: { type: Number, default: 0 },
      },
    },

    // Mode Specific Statistics
    classicMode: {
      gamesPlayed: { type: Number, default: 0 },
      gamesWon: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      bestRoundScore: { type: Number, default: 0 },
      totalPointsEarned: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },

    policeMode: {
      gamesPlayed: { type: Number, default: 0 },
      gamesWonPoliceMode: { type: Number, default: 0 },
      detectiveWins: { type: Number, default: 0 },
      totalCorrectCatches: { type: Number, default: 0 },
      totalWrongGuesses: { type: Number, default: 0 },
      policeAccuracy: { type: Number, default: 0 },
      timesPlayedAsPolice: { type: Number, default: 0 },
      timesPlayedAsThief: { type: Number, default: 0 },
      thiefEscaped: { type: Number, default: 0 },
      thiefCaught: { type: Number, default: 0 },
      escapeRate: { type: Number, default: 0 },
      currentDetectiveWinStreak: { type: Number, default: 0 },
      longestDetectiveWinStreak: { type: Number, default: 0 },
      currentEscapeStreak: { type: Number, default: 0 },
      longestEscapeStreak: { type: Number, default: 0 },
      fastestCorrectCatch: { type: Number, default: 0 }, // seconds
      averageGuessTime: { type: Number, default: 0 }, // seconds
      bestAccuracy: { type: Number, default: 0 },
      totalGuessTimeSum: { type: Number, default: 0 },
      totalGuessTimeCount: { type: Number, default: 0 },
    },

    // Lifetime Personal Records
    records: {
      highestSingleMatchScore: { type: Number, default: 0 },
      fastestCorrectCatch: { type: Number, default: 0 }, // in seconds
      mostPointsInOneMatch: { type: Number, default: 0 },
      longestWinStreak: { type: Number, default: 0 },
      longestEscapeStreak: { type: Number, default: 0 },
      longestDetectiveStreak: { type: Number, default: 0 },
      mostRajaAssignments: { type: Number, default: 0 },
      mostRaniAssignments: { type: Number, default: 0 },
    },

    // Friends & Social Statistics
    social: {
      roomsCreated: { type: Number, default: 0 },
      roomsJoined: { type: Number, default: 0 },
      friendsAdded: { type: Number, default: 0 },
      invitationsSent: { type: Number, default: 0 },
      invitationsAccepted: { type: Number, default: 0 },
      mostPlayedWith: { type: String, default: "None" },
      gamesTogether: { type: Number, default: 0 },
    },

    // Daily & Weekly Statistics (reset based on date)
    daily: {
      dateStr: { type: String, default: "" },
      gamesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      playTime: { type: Number, default: 0 },
    },
    weekly: {
      weekStr: { type: String, default: "" },
      gamesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      playTime: { type: Number, default: 0 },
      rank: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.PlayerStats ||
  mongoose.model("PlayerStats", playerStatsSchema);

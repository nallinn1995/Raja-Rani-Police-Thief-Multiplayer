import mongoose from "mongoose";
import User from "../models/User.js";
import PoliceThiefStats from "../models/PoliceThiefStats.js";
import PoliceThiefMatchHistory from "../models/PoliceThiefMatchHistory.js";
import PoliceThiefAchievement from "../models/PoliceThiefAchievement.js";
import PoliceThiefTitle from "../models/PoliceThiefTitle.js";
import { PoliceThiefService } from "../services/PoliceThiefService.js";
import { PoliceThiefLeaderboardService } from "../services/PoliceThiefLeaderboardService.js";

export async function recordRoundResult(req, res) {
  try {
    const roundData = req.body;
    const result = await PoliceThiefService.recordRound(roundData);
    if (!result) return res.status(400).json({ error: "Invalid round data" });
    res.json({ success: true, round: result });
  } catch (err) {
    console.error("recordRoundResult API error:", err);
    res.status(500).json({ error: "Failed to record round result" });
  }
}

export async function recordMatchResult(req, res) {
  try {
    const matchData = req.body;
    const result = await PoliceThiefService.finalizeMatch(matchData);
    if (!result) return res.status(400).json({ error: "Invalid match data" });
    res.json({ success: true, match: result });
  } catch (err) {
    console.error("recordMatchResult API error:", err);
    res.status(500).json({ error: "Failed to record match result" });
  }
}

export async function getPoliceThiefProfile(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ username: new RegExp(`^${String(userId).trim()}$`, "i") });
    }

    if (!user || user.isGuest) return res.status(404).json({ error: "User profile not found" });

    let stats = await PoliceThiefStats.findOne({ userId: user._id });
    if (!stats) {
      stats = new PoliceThiefStats({
        userId: user._id,
        username: user.username,
      });
      await stats.save();
    }

    const achievements = await PoliceThiefAchievement.find({ userId: user._id })
      .sort({ unlockedAt: -1 })
      .lean();

    const titles = await PoliceThiefTitle.find({ userId: user._id })
      .sort({ unlockedAt: -1 })
      .lean();

    const recentMatches = await PoliceThiefMatchHistory.find({ "players.userId": user._id })
      .sort({ endedAt: -1 })
      .limit(15)
      .lean();

    const formattedMatches = recentMatches.map((m) => {
      const pInMatch = m.players?.find((p) => String(p.userId) === String(user._id)) || {};
      return {
        ...m,
        date: m.endedAt || m.createdAt,
        matchResult: pInMatch.isChampion ? "win" : "loss",
        rolePlayed: "Detective",
        scoreEarned: pInMatch.score || 0,
        rank: pInMatch.rank || 1,
        correctCatches: pInMatch.correctCatches || 0,
        wrongGuesses: pInMatch.wrongGuesses || 0,
        policeAccuracy: pInMatch.policeAccuracy || 0,
        thiefEscaped: pInMatch.thiefEscaped || 0,
      };
    });

    const statsObj = stats.toObject ? stats.toObject() : stats;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        avatar: statsObj.avatar || "1",
        title: statsObj.title || "Recruit Detective",
        level: statsObj.level || 1,
        xp: statsObj.xp || 0,
        createdAt: user.createdAt,
        lastPlayedAt: statsObj.lastPlayedAt || user.createdAt,
      },
      stats: statsObj,
      achievements,
      titles,
      recentMatches: formattedMatches,
    });
  } catch (err) {
    console.error("getPoliceThiefProfile API error:", err);
    res.status(500).json({ error: "Failed to fetch Police vs Thief profile" });
  }
}

export async function getPoliceThiefLeaderboard(req, res) {
  try {
    const category = req.query.category || "top_detective";
    const limit = parseInt(req.query.limit) || 50;

    const leaderboard = await PoliceThiefLeaderboardService.refreshLeaderboard(category, limit);
    res.json({ success: true, count: leaderboard.length, category, leaderboard });
  } catch (err) {
    console.error("getPoliceThiefLeaderboard API error:", err);
    res.status(500).json({ error: "Failed to fetch Police vs Thief leaderboard" });
  }
}

export async function getPoliceThiefAdminDashboard(req, res) {
  try {
    const totalMatches = await PoliceThiefMatchHistory.countDocuments();
    const totalStatsRecords = await PoliceThiefStats.countDocuments();

    const statsList = await PoliceThiefStats.find().lean();
    const totalCatchesSum = statsList.reduce((acc, s) => acc + (s.totalCorrectCatches || 0), 0);
    const totalGuessesSum = statsList.reduce((acc, s) => acc + (s.totalCorrectCatches || 0) + (s.totalWrongGuesses || 0), 0);
    const avgAccuracy = totalGuessesSum > 0 ? Math.round((totalCatchesSum / totalGuessesSum) * 100) : 0;

    const matchHistory = await PoliceThiefMatchHistory.find().lean();
    const totalDurationSum = matchHistory.reduce((acc, m) => acc + (m.duration || 0), 0);
    const avgMatchDuration = totalMatches > 0 ? Math.round(totalDurationSum / totalMatches) : 0;

    const recentMatches = await PoliceThiefMatchHistory.find()
      .sort({ endedAt: -1 })
      .limit(10)
      .lean();

    const topLeaderboard = await PoliceThiefLeaderboardService.refreshLeaderboard("top_detective", 10);

    const recentAchievements = await PoliceThiefAchievement.find()
      .sort({ unlockedAt: -1 })
      .limit(10)
      .lean();

    // Matches per day histogram (last 7 days)
    const matchesPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = matchHistory.filter((m) => {
        const mDate = new Date(m.endedAt || m.createdAt).toISOString().split("T")[0];
        return mDate === dateStr;
      }).length;
      matchesPerDay.push({ date: dateStr, count });
    }

    res.json({
      success: true,
      metrics: {
        totalMatches,
        activePlayers: totalStatsRecords,
        avgAccuracy,
        avgMatchDuration,
      },
      recentMatches,
      topLeaderboard,
      recentAchievements,
      matchesPerDay,
    });
  } catch (err) {
    console.error("getPoliceThiefAdminDashboard API error:", err);
    res.status(500).json({ error: "Failed to fetch Police vs Thief admin dashboard" });
  }
}

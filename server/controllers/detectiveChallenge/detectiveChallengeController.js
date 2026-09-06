import mongoose from "mongoose";
import User from "../../models/User.js";
import DetectiveChallengeStats from "../../models/detectiveChallenge/DetectiveChallengeStats.js";
import DetectiveChallengeMatch from "../../models/detectiveChallenge/DetectiveChallengeMatch.js";
import DetectiveChallengeAchievement from "../../models/detectiveChallenge/DetectiveChallengeAchievement.js";
import DetectiveChallengeTitle from "../../models/detectiveChallenge/DetectiveChallengeTitle.js";
import { DetectiveChallengeService } from "../../services/detectiveChallenge/DetectiveChallengeService.js";
import { DetectiveChallengeLeaderboardService } from "../../services/detectiveChallenge/DetectiveChallengeLeaderboardService.js";

export async function recordRoundResult(req, res) {
  try {
    const roundData = req.body;
    const result = await DetectiveChallengeService.recordRoundResult(roundData);
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
    const result = await DetectiveChallengeService.finalizeMatch(matchData);
    if (!result) return res.status(400).json({ error: "Invalid match data" });
    res.json({ success: true, match: result });
  } catch (err) {
    console.error("recordMatchResult API error:", err);
    res.status(500).json({ error: "Failed to record match result" });
  }
}

export async function getDetectiveProfile(req, res) {
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

    if (!user) {
      return res.json({
        success: true,
        user: {
          id: userId,
          username: "Detective",
          avatar: "1",
          title: "Junior Detective",
          level: 1,
          xp: 0,
        },
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalCorrectGuesses: 0,
          totalWrongGuesses: 0,
          overallAccuracy: 0,
          averageGuessTime: 0,
          fastestGuessTime: 0,
          longestStreak: 0,
          highestAccuracy: 0,
          title: "Junior Detective",
          level: 1,
          xp: 0,
        },
        achievements: [],
        titles: [],
        recentMatches: [],
      });
    }

    let stats = await DetectiveChallengeStats.findOne({ userId: user._id });
    if (!stats) {
      stats = new DetectiveChallengeStats({
        userId: user._id,
        username: user.username,
      });
      await stats.save();
    }

    const achievements = await DetectiveChallengeAchievement.find({ userId: user._id })
      .sort({ unlockedAt: -1 })
      .lean();

    const titles = await DetectiveChallengeTitle.find({ userId: user._id })
      .sort({ unlockedAt: -1 })
      .lean();

    const recentMatches = await DetectiveChallengeMatch.find({ "players.userId": user._id })
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
        scoreEarned: pInMatch.correctCount || 0,
        rank: pInMatch.rank || 1,
        accuracy: pInMatch.accuracy || 0,
        avgGuessTime: pInMatch.avgGuessTime || 0,
      };
    });

    const statsObj = stats.toObject ? stats.toObject() : stats;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        avatar: statsObj.avatar || "1",
        title: statsObj.title || "Junior Detective",
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
    console.error("getDetectiveProfile API error:", err);
    res.status(500).json({ error: "Failed to fetch Detective profile" });
  }
}

export async function getDetectiveLeaderboard(req, res) {
  try {
    const category = req.query.category || "highest_accuracy";
    const limit = parseInt(req.query.limit) || 50;

    const leaderboard = await DetectiveChallengeLeaderboardService.refreshLeaderboard(category, limit);
    res.json({ success: true, count: leaderboard.length, category, leaderboard });
  } catch (err) {
    console.error("getDetectiveLeaderboard API error:", err);
    res.status(500).json({ error: "Failed to fetch Detective leaderboard" });
  }
}

export async function getDetectiveAdminDashboard(req, res) {
  try {
    const totalMatches = await DetectiveChallengeMatch.countDocuments();
    const activePlayers = await DetectiveChallengeStats.countDocuments();

    const statsList = await DetectiveChallengeStats.find().lean();
    const totalAccuracySum = statsList.reduce((acc, s) => acc + (s.overallAccuracy || 0), 0);
    const avgAccuracy = statsList.length > 0 ? Math.round(totalAccuracySum / statsList.length) : 0;

    const validTimeStats = statsList.filter((s) => (s.averageGuessTime || 0) > 0);
    const totalAvgTime = validTimeStats.reduce((acc, s) => acc + (s.averageGuessTime || 0), 0);
    const averageGuessTime = validTimeStats.length > 0 ? parseFloat((totalAvgTime / validTimeStats.length).toFixed(2)) : 0;

    const fastestGuessEver = statsList.reduce((min, s) => {
      if (!s.fastestGuessTime || s.fastestGuessTime <= 0) return min;
      return min === 0 ? s.fastestGuessTime : Math.min(min, s.fastestGuessTime);
    }, 0);

    const recentMatches = await DetectiveChallengeMatch.find()
      .sort({ endedAt: -1 })
      .limit(10)
      .lean();

    const topLeaderboard = await DetectiveChallengeLeaderboardService.refreshLeaderboard("highest_accuracy", 10);

    // Matches per day (last 7 days)
    const matchesPerDay = [];
    const matchHistory = await DetectiveChallengeMatch.find().lean();
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
        activePlayers,
        avgAccuracy,
        averageGuessTime,
        fastestGuessEver,
      },
      recentMatches,
      topLeaderboard,
      matchesPerDay,
    });
  } catch (err) {
    console.error("getDetectiveAdminDashboard API error:", err);
    res.status(500).json({ error: "Failed to fetch Detective Challenge admin analytics" });
  }
}

export async function deleteDetectiveLeaderboardRecord(req, res) {
  try {
    const { id } = req.params;
    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await DetectiveChallengeStats.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await DetectiveChallengeStats.findOneAndDelete({ userId: id });
    }
    if (!deleted) {
      return res.status(404).json({ error: "Detective leaderboard record not found" });
    }
    await DetectiveChallengeLeaderboardService.refreshLeaderboard("highest_accuracy", 10);
    res.json({ success: true, message: "Detective leaderboard record deleted successfully." });
  } catch (err) {
    console.error("deleteDetectiveLeaderboardRecord error:", err);
    res.status(500).json({ error: "Failed to delete detective leaderboard record" });
  }
}

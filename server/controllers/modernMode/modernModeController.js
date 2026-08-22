import mongoose from "mongoose";
import ModernModeStats from "../../models/modernMode/ModernModeStats.js";
import ModernModeMatch from "../../models/modernMode/ModernModeMatch.js";
import ModernModeAchievement from "../../models/modernMode/ModernModeAchievement.js";
import User from "../../models/User.js";

const ACHIEVEMENTS_LIST = [
  {
    id: "ROYAL_GENIUS",
    title: "Royal Genius",
    description: "Correctly identify Rani 10 times as Raja",
    icon: "👑",
    maxProgress: 10,
  },
  {
    id: "QUEENS_INTUITION",
    title: "Queen's Intuition",
    description: "Correctly identify Raja 10 times as Rani",
    icon: "👸",
    maxProgress: 10,
  },
  {
    id: "MASTER_DETECTIVE",
    title: "Master Detective",
    description: "Catch 25 Thieves as Police",
    icon: "👮",
    maxProgress: 25,
  },
  {
    id: "ESCAPE_ARTIST",
    title: "Escape Artist",
    description: "Escape 20 times as Thief",
    icon: "🕵️",
    maxProgress: 20,
  },
  {
    id: "TRUSTED_WITNESS",
    title: "Trusted Witness",
    description: "Earn 20 Witness / Insight Bonuses as Villager",
    icon: "👨",
    maxProgress: 20,
  },
  {
    id: "ROYAL_GUARDIAN",
    title: "Royal Guardian",
    description: "Successfully protect 20 kingdom members as Mantri",
    icon: "🏛️",
    maxProgress: 20,
  },
  {
    id: "KINGDOM_SAVIOR",
    title: "Kingdom Savior",
    description: "Win 50 Modern Mode matches",
    icon: "🏆",
    maxProgress: 50,
  },
];

export async function getModernProfileStats(req, res) {
  try {
    const { userId } = req.params;
    let targetUserId = userId;

    if (!targetUserId || targetUserId === "undefined" || targetUserId === "null") {
      return res.status(400).json({ error: "Invalid User ID" });
    }

    let stats = null;
    if (mongoose.Types.ObjectId.isValid(targetUserId)) {
      stats = await ModernModeStats.findOne({ userId: targetUserId });
    }

    if (!stats) {
      try {
        const user = await User.findById(targetUserId).catch(() => null) || await User.findOne({ username: targetUserId }).catch(() => null);
        if (user) {
          targetUserId = user._id;
          stats = await ModernModeStats.findOne({ userId: user._id });
        }
      } catch (e) {
        // ignore error
      }
    }

    if (!stats) {
      return res.json({
        success: true,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
          highestScore: 0,
          currentWinStreak: 0,
          longestWinStreak: 0,
          timesRaja: 0,
          timesRani: 0,
          timesPolice: 0,
          timesThief: 0,
          timesMantri: 0,
          timesVillager: 0,
          correctRajaGuesses: 0,
          correctRaniGuesses: 0,
          policeCatches: 0,
          policeWrongGuesses: 0,
          thiefEscapes: 0,
          villagerWitnessBonuses: 0,
          villagerInsightBonuses: 0,
          mantriShieldSuccesses: 0,
          averageMatchDuration: 0,
          averageFinalScore: 0,
          policeSuccessRate: 0,
          thiefEscapeRate: 0,
          mostPlayedRole: "None",
          favoriteRole: "None",
          recentMatches: [],
        },
      });
    }

    const matches = await ModernModeMatch.find({ "players.userId": targetUserId })
      .sort({ createdAt: -1 })
      .limit(10);

    const recentMatches = matches.map((m) => {
      const p = m.players.find((player) => player.userId && player.userId.toString() === targetUserId.toString());
      return {
        matchId: m._id,
        roomCode: m.roomCode,
        role: p ? p.role : "Unknown",
        finalScore: p ? p.finalScore : 0,
        rank: p ? p.rank : 0,
        won: p ? p.isWinner : false,
        createdAt: m.createdAt,
      };
    });

    const roleCounts = {
      Raja: stats.timesRaja || 0,
      Rani: stats.timesRani || 0,
      Police: stats.timesPolice || 0,
      Thief: stats.timesThief || 0,
      Mantri: stats.timesMantri || 0,
      Villager: stats.timesVillager || 0,
    };

    let mostPlayedRole = "Raja";
    let maxCount = -1;
    Object.entries(roleCounts).forEach(([role, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPlayedRole = role;
      }
    });

    const policeTotal = (stats.policeCatches || 0) + (stats.policeWrongGuesses || 0);
    const policeSuccessRate = policeTotal > 0 ? Math.round((stats.policeCatches / policeTotal) * 100) : 0;

    const thiefTotal = stats.timesThief || 0;
    const thiefEscapeRate = thiefTotal > 0 ? Math.round((stats.thiefEscapes / thiefTotal) * 100) : 0;

    const avgScore = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
    const avgDuration = stats.gamesPlayed > 0 ? Math.round(stats.totalMatchDuration / stats.gamesPlayed) : 0;

    res.json({
      success: true,
      stats: {
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        totalScore: stats.totalScore,
        highestScore: stats.highestScore,
        currentWinStreak: stats.currentWinStreak,
        longestWinStreak: stats.longestWinStreak,
        timesRaja: stats.timesRaja,
        timesRani: stats.timesRani,
        timesPolice: stats.timesPolice,
        timesThief: stats.timesThief,
        timesMantri: stats.timesMantri,
        timesVillager: stats.timesVillager,
        correctRajaGuesses: stats.correctRajaGuesses,
        correctRaniGuesses: stats.correctRaniGuesses,
        policeCatches: stats.policeCatches,
        policeWrongGuesses: stats.policeWrongGuesses,
        thiefEscapes: stats.thiefEscapes,
        villagerWitnessBonuses: stats.villagerWitnessBonuses,
        villagerInsightBonuses: stats.villagerInsightBonuses,
        mantriShieldSuccesses: stats.mantriShieldSuccesses,
        averageMatchDuration: avgDuration,
        averageFinalScore: avgScore,
        policeSuccessRate,
        thiefEscapeRate,
        mostPlayedRole,
        favoriteRole: mostPlayedRole,
        recentMatches,
      },
    });
  } catch (err) {
    console.error("Error fetching modern profile stats:", err);
    res.status(500).json({ error: "Failed to fetch Modern Mode stats" });
  }
}

export async function getModernAchievements(req, res) {
  try {
    const { userId } = req.params;
    let targetUserId = userId;

    if (mongoose.Types.ObjectId.isValid(targetUserId)) {
      var stats = await ModernModeStats.findOne({ userId: targetUserId });
      var userAchievements = await ModernModeAchievement.find({ userId: targetUserId });
    } else {
      const user = await User.findOne({ username: targetUserId }).catch(() => null);
      if (user) {
        targetUserId = user._id;
        var stats = await ModernModeStats.findOne({ userId: targetUserId });
        var userAchievements = await ModernModeAchievement.find({ userId: targetUserId });
      }
    }
    if (!userAchievements) userAchievements = [];

    const unlockedMap = new Set(userAchievements.map((a) => a.achievementId));

    const progressMap = {
      ROYAL_GENIUS: stats ? stats.correctRajaGuesses : 0,
      QUEENS_INTUITION: stats ? stats.correctRaniGuesses : 0,
      MASTER_DETECTIVE: stats ? stats.policeCatches : 0,
      ESCAPE_ARTIST: stats ? stats.thiefEscapes : 0,
      TRUSTED_WITNESS: stats ? (stats.villagerWitnessBonuses || 0) + (stats.villagerInsightBonuses || 0) : 0,
      ROYAL_GUARDIAN: stats ? stats.mantriShieldSuccesses : 0,
      KINGDOM_SAVIOR: stats ? stats.gamesWon : 0,
    };

    const achievements = ACHIEVEMENTS_LIST.map((ach) => {
      const unlocked = unlockedMap.has(ach.id);
      const progress = progressMap[ach.id] || 0;
      const found = userAchievements.find((a) => a.achievementId === ach.id);
      return {
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        unlocked,
        unlockedAt: found ? found.unlockedAt : null,
        progress: Math.min(progress, ach.maxProgress),
        maxProgress: ach.maxProgress,
      };
    });

    res.json({ success: true, achievements });
  } catch (err) {
    console.error("Error fetching modern achievements:", err);
    res.status(500).json({ error: "Failed to fetch Modern Mode achievements" });
  }
}

export async function getModernLeaderboard(req, res) {
  try {
    const topStats = await ModernModeStats.find()
      .sort({ gamesWon: -1, totalScore: -1 })
      .limit(50);

    const leaderboard = topStats.map((s, idx) => ({
      rank: idx + 1,
      userId: s.userId,
      username: s.username,
      gamesPlayed: s.gamesPlayed,
      gamesWon: s.gamesWon,
      totalScore: s.totalScore,
      highestScore: s.highestScore,
      winStreak: s.longestWinStreak,
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("Error fetching modern leaderboard:", err);
    res.status(500).json({ error: "Failed to fetch Modern Mode leaderboard" });
  }
}

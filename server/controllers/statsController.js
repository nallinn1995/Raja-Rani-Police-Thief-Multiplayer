import mongoose from "mongoose";
import PlayerStats from "../models/PlayerStats.js";
import MatchHistory from "../models/MatchHistory.js";
import Achievement from "../models/Achievement.js";
import User from "../models/User.js";
import DetectiveChallengeStats from "../models/detectiveChallenge/DetectiveChallengeStats.js";
import DetectiveChallengeMatch from "../models/detectiveChallenge/DetectiveChallengeMatch.js";
import DetectiveChallengeAchievement from "../models/detectiveChallenge/DetectiveChallengeAchievement.js";
import ModernModeStats from "../models/modernMode/ModernModeStats.js";
import ModernModeMatch from "../models/modernMode/ModernModeMatch.js";
import ModernModeAchievement from "../models/modernMode/ModernModeAchievement.js";
import { calculateClassicXP, calculateLevel } from "../config/xpConfig.js";
import gameNotificationService from "../services/gameNotificationService.js";

// Helper for title calculation
function calculateTitle(stats) {
  if (stats.totalGames >= 100) {
    return "Legend Detective";
  }
  if (stats.totalGames >= 50) {
    return "Master Detective";
  }
  if (stats.totalWins >= 25) {
    return "Royal Champion";
  }
  if (stats.totalWins >= 10) {
    return "Senior Detective";
  }
  if (stats.totalGames >= 5) {
    return "Junior Detective";
  }
  return "Recruit Detective";
}

export async function recordMatchResults(matchData) {
  try {
    const { roomCode, gameMode, totalRounds, duration, players, roundSummaries } = matchData;
    if (!players || !Array.isArray(players)) return;

    // Sort players to determine winner for Classic Mode
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

    const winner = sortedPlayers[0];

    const matchPlayers = players.map((p) => {
      const pName = p.name || p.username;
      const isW = winner ? pName === (winner.name || winner.username) : false;
      return {
        userId: p.userId || null,
        username: pName,
        score: p.score || 0,
        rank: sortedPlayers.findIndex((sp) => (sp.name || sp.username) === pName) + 1,
        isWinner: isW,
        correctCatches: p.correctCatches || 0,
        wrongGuesses: p.wrongGuesses || 0,
        accuracy: p.accuracy || 0,
        policeTurnsCompleted: p.policeTurnsCompleted || 0,
        thiefEscaped: p.thiefEscaped || 0,
        thiefCaught: p.thiefCaught || 0,
        fastestCatch: p.fastestCatch || 0,
        title: p.title || "Recruit Detective",
        rajaTurns: p.rajaTurns || 0,
        raniTurns: p.raniTurns || 0,
        policeTurns: p.policeTurns || p.policeTurnsCompleted || 0,
        thiefTurns: p.thiefTurns || 0,
        rajaPoints: p.rajaPoints || 0,
        raniPoints: p.raniPoints || 0,
      };
    });

    // Save match history
    const match = new MatchHistory({
      roomCode,
      gameMode: gameMode || "CLASSIC_POINTS",
      totalRounds: totalRounds || 1,
      duration: duration || 0,
      players: matchPlayers,
      roundSummaries: roundSummaries || [],
      winnerUsername: winner ? (winner.name || winner.username) : "None",
    });
    await match.save();

    const todayStr = new Date().toISOString().split("T")[0];
    const currentWeekStr = `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7)}`;

    // Update stats for registered users (non-guest accounts)
    for (const p of matchPlayers) {
      try {
        let user = null;
        const targetId = p.userId || p.id;
        if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
          user = await User.findById(targetId);
        }
        if (!user && (p.username || p.name)) {
          const nameToSearch = String(p.username || p.name).trim();
          user = await User.findOne({ username: new RegExp(`^${nameToSearch}$`, "i") });
        }

        if (!user || user.isGuest) {
          continue; // Skip guest accounts
        }

        let stats = await PlayerStats.findOne({ userId: user._id });
        if (!stats) {
          stats = new PlayerStats({
            userId: user._id,
            username: user.username,
          });
        }

        // Initialize sub-objects defensively
        if (!stats.roleStats) {
          stats.roleStats = {
            raja: { timesAssigned: 0, totalPoints: 0 },
            rani: { timesAssigned: 0, totalPoints: 0 },
            police: { timesAssigned: 0, correctCatches: 0, wrongGuesses: 0, accuracy: 0 },
            thief: { timesAssigned: 0, escaped: 0, caught: 0, escapeRate: 0 },
          };
        }
        if (!stats.roleStats.raja) stats.roleStats.raja = { timesAssigned: 0, totalPoints: 0 };
        if (!stats.roleStats.rani) stats.roleStats.rani = { timesAssigned: 0, totalPoints: 0 };
        if (!stats.roleStats.police) stats.roleStats.police = { timesAssigned: 0, correctCatches: 0, wrongGuesses: 0, accuracy: 0 };
        if (!stats.roleStats.thief) stats.roleStats.thief = { timesAssigned: 0, escaped: 0, caught: 0, escapeRate: 0 };

        if (!stats.classicMode) {
          stats.classicMode = {
            gamesPlayed: 0,
            gamesWon: 0,
            highestScore: 0,
            bestRoundScore: 0,
            totalPointsEarned: 0,
            averageScore: 0,
          };
        }

        if (!stats.policeMode) {
          stats.policeMode = {
            gamesPlayed: 0,
            gamesWonPoliceMode: 0,
            detectiveWins: 0,
            totalCorrectCatches: 0,
            totalWrongGuesses: 0,
            policeAccuracy: 0,
            timesPlayedAsPolice: 0,
            timesPlayedAsThief: 0,
            thiefEscaped: 0,
            thiefCaught: 0,
            escapeRate: 0,
            currentDetectiveWinStreak: 0,
            longestDetectiveWinStreak: 0,
            currentEscapeStreak: 0,
            longestEscapeStreak: 0,
            fastestCorrectCatch: 0,
            averageGuessTime: 0,
            bestAccuracy: 0,
            totalGuessTimeSum: 0,
            totalGuessTimeCount: 0,
          };
        }

        if (!stats.records) {
          stats.records = {
            highestSingleMatchScore: 0,
            fastestCorrectCatch: 0,
            mostPointsInOneMatch: 0,
            longestWinStreak: 0,
            longestEscapeStreak: 0,
            longestDetectiveStreak: 0,
            mostRajaAssignments: 0,
            mostRaniAssignments: 0,
          };
        }

        if (!stats.daily) stats.daily = { dateStr: "", gamesPlayed: 0, wins: 0, playTime: 0 };
        if (!stats.weekly) stats.weekly = { weekStr: "", gamesPlayed: 0, wins: 0, playTime: 0, rank: 1 };

        // Global XP & Leveling using XP_CONFIG
        const oldXp = stats.xp || user.xp || 0;
        const oldLevelInfo = calculateLevel(oldXp);

        const matchXP = calculateClassicXP(p);
        const earnedXp = matchXP.totalXP;

        stats.xp = oldXp + earnedXp;
        const newLevelInfo = calculateLevel(stats.xp);
        stats.level = newLevelInfo.level;
        stats.lastPlayedAt = new Date();

        user.xp = stats.xp;
        user.level = stats.level;
        await user.save();

        p.matchXP = matchXP;
        p.levelUpInfo = {
          oldLevel: oldLevelInfo.level,
          newLevel: newLevelInfo.level,
          isLevelUp: newLevelInfo.level > oldLevelInfo.level,
          currentLevelInfo: newLevelInfo,
        };

        if (p.levelUpInfo.isLevelUp) {
          gameNotificationService.dispatchLevelUp({
            userId: user._id,
            username: user.username,
            newLevel: newLevelInfo.level,
            oldLevel: oldLevelInfo.level,
          });
        }

        // Lifetime Overall
        stats.totalGames = (stats.totalGames || 0) + 1;
        stats.totalRoundsPlayed = (stats.totalRoundsPlayed || 0) + (totalRounds || 1);
        stats.totalTimePlayed = (stats.totalTimePlayed || 0) + (duration || 0);
        stats.totalScore = (stats.totalScore || 0) + (p.score || 0);

        if (p.isWinner) {
          stats.totalWins = (stats.totalWins || 0) + 1;
          stats.currentWinStreak = (stats.currentWinStreak || 0) + 1;
          if (stats.currentWinStreak > (stats.longestWinStreak || 0)) {
            stats.longestWinStreak = stats.currentWinStreak;
          }
          if (user?._id) {
            gameNotificationService.dispatchGameWon({
              userId: user._id,
              username: user.username,
              roomCode: roomCode || "",
              score: p.score || 0,
            });
          }
        } else {
          stats.totalLosses = (stats.totalLosses || 0) + 1;
          stats.currentWinStreak = 0;
        }

        // Role Detailed Accumulations
        let rTurns = p.rajaTurns || 0;
        let rPts = p.rajaPoints || 0;
        let rnTurns = p.raniTurns || 0;
        let rnPts = p.raniPoints || 0;
        let policeT = p.policeTurns || p.policeTurnsCompleted || 0;
        let thiefT = p.thiefTurns || 0;

        // Fallback: If turn counts are 0 but role is present
        if (rTurns === 0 && rnTurns === 0 && policeT === 0 && thiefT === 0 && p.role) {
          if (p.role === "Raja") { rTurns = 1; rPts = 1000; }
          else if (p.role === "Rani") { rnTurns = 1; rnPts = 800; }
          else if (p.role === "Police") { policeT = 1; }
          else if (p.role === "Thief") { thiefT = 1; }
        }

        stats.roleStats.raja.timesAssigned = (stats.roleStats.raja.timesAssigned || 0) + rTurns;
        stats.roleStats.raja.totalPoints = (stats.roleStats.raja.totalPoints || 0) + rPts;

        stats.roleStats.rani.timesAssigned = (stats.roleStats.rani.timesAssigned || 0) + rnTurns;
        stats.roleStats.rani.totalPoints = (stats.roleStats.rani.totalPoints || 0) + rnPts;

        stats.roleStats.police.timesAssigned = (stats.roleStats.police.timesAssigned || 0) + policeT;
        stats.roleStats.police.correctCatches = (stats.roleStats.police.correctCatches || 0) + (p.correctCatches || 0);
        stats.roleStats.police.wrongGuesses = (stats.roleStats.police.wrongGuesses || 0) + (p.wrongGuesses || 0);
        const pAtt = stats.roleStats.police.correctCatches + stats.roleStats.police.wrongGuesses;
        stats.roleStats.police.accuracy = pAtt > 0 ? Math.round((stats.roleStats.police.correctCatches / pAtt) * 100) : 0;

        stats.roleStats.thief.timesAssigned = (stats.roleStats.thief.timesAssigned || 0) + thiefT;
        stats.roleStats.thief.escaped = (stats.roleStats.thief.escaped || 0) + (p.thiefEscaped || 0);
        stats.roleStats.thief.caught = (stats.roleStats.thief.caught || 0) + (p.thiefCaught || 0);
        const tTur = stats.roleStats.thief.escaped + stats.roleStats.thief.caught;
        stats.roleStats.thief.escapeRate = tTur > 0 ? Math.round((stats.roleStats.thief.escaped / tTur) * 100) : 0;

        // Classic Mode Specific Stats
        const cm = stats.classicMode;
        cm.gamesPlayed = (cm.gamesPlayed || 0) + 1;
        if (p.isWinner) cm.gamesWon = (cm.gamesWon || 0) + 1;
        cm.totalPointsEarned = (cm.totalPointsEarned || 0) + (p.score || 0);
        if ((p.score || 0) > (cm.highestScore || 0)) {
          cm.highestScore = p.score;
        }
        cm.averageScore = Math.round(cm.totalPointsEarned / cm.gamesPlayed);

        // Personal Lifetime Records
        const rec = stats.records;
        rec.highestSingleMatchScore = Math.max(rec.highestSingleMatchScore || 0, p.score || 0);
        rec.mostPointsInOneMatch = Math.max(rec.mostPointsInOneMatch || 0, p.score || 0);
        if (p.fastestCatch && p.fastestCatch > 0) {
          rec.fastestCorrectCatch = (!rec.fastestCorrectCatch || p.fastestCatch < rec.fastestCorrectCatch)
            ? p.fastestCatch
            : rec.fastestCorrectCatch;
        }
        rec.longestWinStreak = Math.max(rec.longestWinStreak || 0, stats.longestWinStreak || 0);
        rec.longestEscapeStreak = Math.max(rec.longestEscapeStreak || 0, stats.policeMode?.longestEscapeStreak || 0);
        rec.longestDetectiveStreak = Math.max(rec.longestDetectiveStreak || 0, stats.policeMode?.longestDetectiveWinStreak || 0);
        rec.mostRajaAssignments = Math.max(rec.mostRajaAssignments || 0, stats.roleStats?.raja?.timesAssigned || 0);
        rec.mostRaniAssignments = Math.max(rec.mostRaniAssignments || 0, stats.roleStats?.rani?.timesAssigned || 0);

        // Daily & Weekly Stats
        if (stats.daily.dateStr === todayStr) {
          stats.daily.gamesPlayed = (stats.daily.gamesPlayed || 0) + 1;
          if (p.isWinner) stats.daily.wins = (stats.daily.wins || 0) + 1;
          stats.daily.playTime = (stats.daily.playTime || 0) + (duration || 0);
        } else {
          stats.daily = { dateStr: todayStr, gamesPlayed: 1, wins: p.isWinner ? 1 : 0, playTime: duration || 0 };
        }

        if (stats.weekly.weekStr === currentWeekStr) {
          stats.weekly.gamesPlayed = (stats.weekly.gamesPlayed || 0) + 1;
          if (p.isWinner) stats.weekly.wins = (stats.weekly.wins || 0) + 1;
          stats.weekly.playTime = (stats.weekly.playTime || 0) + (duration || 0);
        } else {
          stats.weekly = { weekStr: currentWeekStr, gamesPlayed: 1, wins: p.isWinner ? 1 : 0, playTime: duration || 0, rank: 1 };
        }

        // Update Title
        stats.title = calculateTitle(stats);

        // Safe save with index drop retry
        try {
          await stats.save();
        } catch (saveErr) {
          if (saveErr && (saveErr.code === 11000 || String(saveErr).includes("user_1"))) {
            try {
              console.warn("Dropping legacy 'user_1' index from playerstats and retrying save...");
              await mongoose.connection.db.collection("playerstats").dropIndex("user_1");
              await stats.save();
            } catch (retryErr) {
              console.error(`Retry error saving stats for user ${user.username}:`, retryErr);
            }
          } else {
            console.error(`Error saving stats for user ${user.username}:`, saveErr);
          }
        }

        // Check achievements
        await checkAchievements(user._id, stats, p);

        // Server-side trimming: keep only the 15 most recent matches per user
        try {
          const userMatches = await MatchHistory.find({ "players.userId": user._id }).sort({ endedAt: -1, _id: -1 });
          if (userMatches.length > 15) {
            const idsToDelete = userMatches.slice(15).map((m) => m._id);
            await MatchHistory.deleteMany({ _id: { $in: idsToDelete } });
          }
        } catch (trimErr) {
          console.error("Error trimming match history for user:", user._id, trimErr);
        }
      } catch (playerErr) {
        console.error(`Error processing match stats for player ${p.username}:`, playerErr);
      }
    }
  } catch (err) {
    console.error("Error recording match results:", err);
  }
}

async function checkAchievements(userId, stats, playerMatchData = {}) {
  const achievements = [];
  const policeStats = stats.roleStats?.police || {};
  const thiefStats = stats.roleStats?.thief || {};

  if ((stats.totalGames || 0) >= 1) {
    achievements.push({
      code: "FIRST_STEPS",
      title: "First Steps",
      description: "Play your first match.",
      tier: "Common",
      category: "Classic Mode",
      xpReward: 100,
      coinReward: 200,
    });
  }
  if ((stats.totalWins || 0) >= 1) {
    achievements.push({
      code: "VICTORIOUS",
      title: "Victorious",
      description: "Win your first match.",
      tier: "Common",
      category: "Classic Mode",
      xpReward: 100,
      coinReward: 200,
    });
  }
  if ((policeStats.accuracy || 0) >= 80 && (policeStats.correctCatches || 0) >= 5) {
    achievements.push({
      code: "MASTER_DETECTIVE",
      title: "Master Detective",
      description: "Maintain 80%+ Detective Accuracy with at least 5 correct catches.",
      tier: "Legendary",
      category: "Detective Challenge",
      xpReward: 500,
      coinReward: 1000,
    });
  }
  if ((policeStats.correctCatches || 0) >= 10) {
    achievements.push({
      code: "SHARP_SHOOTER",
      title: "Sharp Shooter",
      description: "Achieve 10 Correct Catches as Police/Detective.",
      tier: "Epic",
      category: "Detective Challenge",
      xpReward: 300,
      coinReward: 600,
    });
  }
  if (playerMatchData.fastestCatch && playerMatchData.fastestCatch <= 5 && playerMatchData.fastestCatch > 0) {
    achievements.push({
      code: "GHOST_HUNTER",
      title: "Ghost Hunter",
      description: "Catch the Thief in under 5 seconds.",
      tier: "Rare",
      category: "Detective Challenge",
      xpReward: 200,
      coinReward: 400,
    });
  }
  if ((thiefStats.escaped || 0) >= 10) {
    achievements.push({
      code: "GHOST_THIEF",
      title: "Ghost Thief",
      description: "Achieve 10 consecutive Thief escapes.",
      tier: "Epic",
      category: "Classic Mode",
      xpReward: 300,
      coinReward: 600,
    });
  }
  if ((thiefStats.escaped || 0) >= 25) {
    achievements.push({
      code: "SHADOW_ESCAPE",
      title: "Shadow Escape",
      description: "Escape 25 rounds as Thief.",
      tier: "Rare",
      category: "Classic Mode",
      xpReward: 250,
      coinReward: 500,
    });
  }
  if ((policeStats.accuracy || 0) >= 70) {
    achievements.push({
      code: "OBSERVATION_KING",
      title: "Observation King",
      description: "Maintain 70%+ accuracy in 3 matches.",
      tier: "Rare",
      category: "Detective Challenge",
      xpReward: 200,
      coinReward: 300,
    });
  }
  if ((policeStats.correctCatches || 0) >= 15) {
    achievements.push({
      code: "SPEED_DETECTIVE",
      title: "Speed Detective",
      description: "Make 15 correct catches in under 6 seconds.",
      tier: "Epic",
      category: "Detective Challenge",
      xpReward: 300,
      coinReward: 600,
    });
  }
  if ((stats.classicMode?.totalPointsEarned || stats.totalScore || 0) >= 5000) {
    achievements.push({
      code: "ROYAL_SOVEREIGN",
      title: "Royal Sovereign",
      description: "Accumulate 5,000+ total points in Classic Mode.",
      tier: "Legendary",
      category: "Classic Mode",
      xpReward: 500,
      coinReward: 1000,
    });
  }
  if ((stats.roleStats?.raja?.timesAssigned || 0) >= 10) {
    achievements.push({
      code: "RAJAS_BOUNTY",
      title: "Raja's Bounty",
      description: "Assigned as Raja 10 times in Classic Mode.",
      tier: "Rare",
      category: "Classic Mode",
      xpReward: 200,
      coinReward: 400,
    });
  }
  if ((stats.totalWins || 0) >= 100) {
    achievements.push({
      code: "ULTIMATE_DETECTIVE",
      title: "Ultimate Detective",
      description: "Win 100 matches as Detective.",
      tier: "Legendary",
      category: "Detective Challenge",
      xpReward: 1000,
      coinReward: 2000,
    });
  }

  for (const ach of achievements) {
    try {
      const res = await Achievement.updateOne(
        { userId, code: ach.code },
        { $setOnInsert: { ...ach, userId, unlockedAt: new Date() } },
        { upsert: true }
      );
      if (res.upsertedCount > 0) {
        gameNotificationService.dispatchAchievementUnlocked({
          userId,
          username: playerMatchData?.name || "Player",
          achievementName: ach.title || ach.code,
          achievementCode: ach.code,
        });
      }
    } catch (e) {
      // ignore duplicates
    }
  }
}

export async function getPoliceLeaderboard(category = "top_detective", limit = 50) {
  try {
    let sortField = { "policeMode.detectiveWins": -1, "policeMode.policeAccuracy": -1 };

    switch (category) {
      case "highest_accuracy":
        sortField = { "policeMode.policeAccuracy": -1, "policeMode.totalCorrectCatches": -1 };
        break;
      case "most_wins":
        sortField = { "policeMode.detectiveWins": -1, "policeMode.totalCorrectCatches": -1 };
        break;
      case "most_catches":
        sortField = { "policeMode.totalCorrectCatches": -1, "policeMode.policeAccuracy": -1 };
        break;
      case "fastest_detective":
        sortField = { "policeMode.fastestCorrectCatch": 1, "policeMode.totalCorrectCatches": -1 };
        break;
      case "most_escapes":
        sortField = { "policeMode.thiefEscaped": -1, "policeMode.escapeRate": -1 };
        break;
      case "longest_detective_streak":
        sortField = { "policeMode.longestDetectiveWinStreak": -1, "policeMode.detectiveWins": -1 };
        break;
      case "longest_escape_streak":
        sortField = { "policeMode.longestEscapeStreak": -1, "policeMode.thiefEscaped": -1 };
        break;
      default:
        sortField = { "policeMode.detectiveWins": -1, "policeMode.policeAccuracy": -1 };
    }

    const query = category === "fastest_detective" ? { "policeMode.fastestCorrectCatch": { $gt: 0 } } : {};

    const list = await PlayerStats.find(query)
      .sort(sortField)
      .limit(limit)
      .lean();

    return list.map((item, index) => ({
      rank: index + 1,
      userId: item.userId,
      username: item.username,
      avatar: item.avatar || "1",
      title: item.title || "Recruit Detective",
      detectiveWins: item.policeMode?.detectiveWins || 0,
      correctCatches: item.policeMode?.totalCorrectCatches || 0,
      wrongGuesses: item.policeMode?.totalWrongGuesses || 0,
      accuracy: item.policeMode?.policeAccuracy || 0,
      policeTurns: item.policeMode?.timesPlayedAsPolice || 0,
      thiefEscaped: item.policeMode?.thiefEscaped || 0,
      escapeRate: item.policeMode?.escapeRate || 0,
      fastestCatch: item.policeMode?.fastestCorrectCatch || 0,
      longestDetectiveStreak: item.policeMode?.longestDetectiveWinStreak || 0,
      longestEscapeStreak: item.policeMode?.longestEscapeStreak || 0,
    }));
  } catch (err) {
    console.error("Error fetching police leaderboard:", err);
    return [];
  }
}

export async function getProfileDataById(userId, limit = 15) {
  try {
    if (!userId) return null;

    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ username: new RegExp(`^${String(userId).trim()}$`, "i") });
    }

    if (!user) {
      const fallbackName = String(userId).startsWith("guest_") ? "Guest Player" : String(userId);
      const levelInfo = calculateLevel(0);
      return {
        user: {
          id: userId,
          username: fallbackName,
          avatar: "1",
          description: "",
          country: "IN",
          level: 1,
          xp: 0,
          levelInfo,
          title: "Junior Detective",
          createdAt: new Date(),
          lastPlayedAt: new Date(),
        },
        stats: {
          avatar: "1",
          description: "",
          username: fallbackName,
          playerLevel: 1,
          xp: 0,
          levelInfo,
          xpBreakdown: {
            totalXp: 0,
            overallLevelInfo: levelInfo,
            classicMode: { xp: 0, levelInfo },
            modernMode: { xp: 0, levelInfo },
            detectiveChallenge: { xp: 0, levelInfo },
          },
          title: "Junior Detective",
          joinDate: new Date(),
          lastPlayedDate: new Date(),
          overallStats: {
            totalGames: 0,
            gamesPlayed: 0,
            totalWins: 0,
            gamesWon: 0,
            totalLosses: 0,
            gamesLost: 0,
            totalRoundsPlayed: 0,
            totalScore: 0,
            winRate: 0,
            totalTimePlayed: 0,
            totalPlayTime: 0,
            currentWinStreak: 0,
            longestWinStreak: 0,
          },
          roleStats: {},
          classicMode: { xp: 0, levelInfo },
          modernMode: { xp: 0, levelInfo },
          policeMode: {},
          detectiveChallenge: { xp: 0, levelInfo },
          records: { fastestCatch: 0, longestWinStreak: 0 },
          socialStats: { roomsCreated: 0, roomsJoined: 0, friendsAdded: 0, recentFriends: [] },
          social: { roomsCreated: 0, roomsJoined: 0, friendsAdded: 0, recentFriends: [] },
          daily: { gamesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
          weekly: { gamesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
        },
        achievements: [],
        recentMatches: [],
      };
    }

    let stats = await PlayerStats.findOne({ userId: user._id });
    if (!stats) {
      stats = new PlayerStats({
        userId: user._id,
        username: user.username,
      });
      try {
        await stats.save();
      } catch (saveErr) {
        if (saveErr && (saveErr.code === 11000 || String(saveErr).includes("user_1"))) {
          try {
            console.warn("Dropping legacy 'user_1' index on initial save...");
            await mongoose.connection.db.collection("playerstats").dropIndex("user_1");
            await stats.save();
          } catch (retryErr) {
            console.error("Error saving initial PlayerStats after index drop:", retryErr);
          }
        } else {
          console.error("Error saving initial PlayerStats:", saveErr);
        }
      }
    }

    const classicAchievements = await Achievement.find({ userId: user._id })
      .sort({ unlockedAt: -1 })
      .lean();
    const modernAchievements = await ModernModeAchievement.find({ userId: user._id }).lean();
    const dcAchievements = await DetectiveChallengeAchievement.find({ userId: user._id }).lean();

    const achievements = [
      ...classicAchievements,
      ...modernAchievements.map((a) => ({
        code: a.achievementId,
        title: a.achievementId,
        unlockedAt: a.unlockedAt,
        isUnlocked: true,
      })),
      ...dcAchievements.map((a) => ({
        code: a.achievementId || a.code,
        title: a.achievementId || a.code,
        unlockedAt: a.unlockedAt,
        isUnlocked: true,
      })),
    ];

    const detectiveStats = await DetectiveChallengeStats.findOne({ userId: user._id }).lean();
    const modernStats = await ModernModeStats.findOne({ userId: user._id }).lean();

    const rawRecentMatches = await MatchHistory.find({ "players.userId": user._id })
      .sort({ endedAt: -1 })
      .limit(limit)
      .lean();

    const rawDcMatches = await DetectiveChallengeMatch.find({
      $or: [
        { "players.userId": user._id },
        { "players.username": new RegExp(`^${String(user.username).trim()}$`, "i") }
      ]
    })
      .sort({ endedAt: -1 })
      .limit(limit)
      .lean();

    const rawModernMatches = await ModernModeMatch.find({
      $or: [
        { "players.userId": user._id },
        { "players.name": new RegExp(`^${String(user.username).trim()}$`, "i") }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formattedMatches = rawRecentMatches.map((m) => {
      const playerInMatch = m.players?.find((p) => String(p.userId) === String(user._id)) || {};
      return {
        ...m,
        date: m.endedAt || m.createdAt,
        matchResult: playerInMatch.isWinner ? "win" : "loss",
        rolePlayed: playerInMatch.role || "Player",
        scoreEarned: playerInMatch.score || 0,
        rank: playerInMatch.rank || 1,
        correctCatches: playerInMatch.correctCatches || 0,
        wrongGuesses: playerInMatch.wrongGuesses || 0,
      };
    });

    const formattedModernMatches = rawModernMatches.map((m) => {
      const playerInMatch = m.players?.find(
        (p) => String(p.userId) === String(user._id) || String(p.name).toLowerCase() === String(user.username).toLowerCase()
      ) || {};
      return {
        _id: m._id,
        roomCode: m.roomCode,
        gameMode: "MODERN_MODE",
        totalRounds: 1,
        duration: m.matchDuration || 0,
        date: m.createdAt || m.updatedAt,
        matchResult: playerInMatch.isWinner ? "win" : "loss",
        rolePlayed: playerInMatch.role || "Kingdom Player",
        scoreEarned: playerInMatch.finalScore || 0,
        rank: playerInMatch.rank || 1,
        winnerUsername: m.winnerName || "None",
        players: m.players,
      };
    });

    const formattedDcMatches = rawDcMatches.map((m) => {
      const playerInMatch = m.players?.find(
        (p) => String(p.userId) === String(user._id) || String(p.username).toLowerCase() === String(user.username).toLowerCase()
      ) || {};
      return {
        _id: m._id,
        roomCode: m.roomCode,
        gameMode: "DETECTIVE_CHALLENGE",
        totalRounds: m.totalRounds || 5,
        duration: m.duration || 0,
        date: m.endedAt || m.createdAt,
        matchResult: playerInMatch.isChampion ? "win" : "loss",
        rolePlayed: "Detective",
        scoreEarned: playerInMatch.correctCount || 0,
        rank: playerInMatch.rank || 1,
        correctCatches: playerInMatch.correctCount || 0,
        wrongGuesses: playerInMatch.wrongCount || 0,
        accuracy: playerInMatch.accuracy || 0,
        avgGuessTime: playerInMatch.avgGuessTime || 0,
        winnerUsername: m.championUsername || "None",
      };
    });

    const allMatches = [...formattedMatches, ...formattedModernMatches, ...formattedDcMatches]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    const statsObj = stats.toObject ? stats.toObject() : stats;
    const dailyObj = statsObj.daily || {};
    const weeklyObj = statsObj.weekly || {};

    const classicGames = statsObj.totalGames || 0;
    const classicWins = statsObj.totalWins || 0;
    const classicLosses = statsObj.totalLosses || 0;
    const classicRounds = statsObj.totalRoundsPlayed || 0;

    let derivedClassicTime = 0;
    rawRecentMatches.forEach((m) => {
      if (m.duration && m.duration > 0) {
        derivedClassicTime += m.duration;
      } else {
        const rCount = m.totalRounds || (m.roundSummaries ? m.roundSummaries.length : 1) || 1;
        derivedClassicTime += rCount * 60;
      }
    });

    const classicTime = Math.max(statsObj.totalTimePlayed || 0, derivedClassicTime);

    const modernGames = modernStats?.gamesPlayed || rawModernMatches.length || 0;
    const modernWins = modernStats?.gamesWon || 0;
    const modernLosses = Math.max(0, modernGames - modernWins);
    const modernTime = modernStats?.totalMatchDuration || 0;

    const dcGames = detectiveStats?.gamesPlayed || rawDcMatches.length || 0;
    const dcWins = detectiveStats?.gamesWon || 0;
    const dcLosses = Math.max(0, dcGames - dcWins);
    const dcRounds = (detectiveStats?.gamesPlayed || 0) * 5;
    const dcTime = detectiveStats?.totalPlayTime || 0;

    const combinedGames = classicGames + modernGames + dcGames;
    const combinedWins = classicWins + modernWins + dcWins;
    const combinedLosses = classicLosses + modernLosses + dcLosses;
    const combinedRounds = classicRounds + modernGames + dcRounds;
    const combinedTime = classicTime + modernTime + dcTime;
    const combinedWinRate = combinedGames > 0 ? Math.round((combinedWins / combinedGames) * 100) : 0;
    const combinedCurrentStreak = Math.max(statsObj.currentWinStreak || 0, modernStats?.currentWinStreak || 0, detectiveStats?.currentWinStreak || 0);
    const combinedLongestStreak = Math.max(statsObj.longestWinStreak || 0, modernStats?.longestWinStreak || 0, detectiveStats?.longestWinStreak || 0);

    const detectiveChallengeData = {
      gamesPlayed: dcGames,
      gamesWon: dcWins,
      gamesLost: dcLosses,
      overallAccuracy: detectiveStats?.overallAccuracy || 0,
      averageGuessTime: detectiveStats?.averageGuessTime || 0,
      fastestGuessTime: detectiveStats?.fastestGuessTime || 0,
      longestStreak: detectiveStats?.longestStreak || 0,
      title: detectiveStats?.title || "Junior Detective",
      level: detectiveStats?.level || 1,
      xp: detectiveStats?.xp || 0,
    };

    const coPlayersMap = new Map();
    [...rawRecentMatches, ...rawModernMatches, ...rawDcMatches].forEach((m) => {
      if (!m.players) return;
      const mode = m.gameMode === "DETECTIVE_CHALLENGE" 
        ? "Detective Challenge" 
        : (m.gameMode === "MODERN_MODE" || m.winnerName || m.details)
        ? "Modern Mode" 
        : "Classic Mode";

      m.players.forEach((p) => {
        const pName = p.username || p.name;
        if (!pName || pName.toLowerCase() === user.username.toLowerCase()) return;

        const key = pName.toLowerCase();
        if (!coPlayersMap.has(key)) {
          coPlayersMap.set(key, {
            username: pName,
            avatar: p.avatar || "1",
            matchesTogether: 0,
            lastPlayedMode: mode,
            lastPlayedDate: m.endedAt || m.createdAt || m.updatedAt,
          });
        }
        const item = coPlayersMap.get(key);
        item.matchesTogether += 1;
        item.lastPlayedMode = mode;
        item.lastPlayedDate = m.endedAt || m.createdAt || m.updatedAt;
      });
    });

    const recentFriendsList = Array.from(coPlayersMap.values())
      .sort((a, b) => b.matchesTogether - a.matchesTogether)
      .slice(0, 10);

    const socialStats = {
      roomsCreated: (statsObj.social?.roomsCreated || 0) + (statsObj.roomsCreated || 0),
      roomsJoined: combinedGames,
      friendsAdded: coPlayersMap.size,
      recentFriends: recentFriendsList,
    };

    let derivedClassicXp = 0;
    rawRecentMatches.forEach((m) => {
      if (!m.players || !Array.isArray(m.players)) return;
      const p = m.players.find(
        (pl) => (pl.userId && String(pl.userId) === String(user._id)) ||
                (pl.username && String(pl.username).toLowerCase() === String(user.username).toLowerCase())
      );
      if (p) {
        const scoreXp = Math.round((Number(p.score) || 0) / 10);
        const winBonus = p.isWinner ? 100 : 0;
        const catchBonus = (Number(p.correctCatches) || 0) * 30;
        derivedClassicXp += (20 + 30 + scoreXp + winBonus + catchBonus);
      }
    });

    const classicXp = statsObj.classicMode?.xp || derivedClassicXp;
    const modernXp = modernStats?.xp || 0;
    const detectiveXp = detectiveStats?.xp || 0;

    const ACHIEVEMENT_XP_MAP = {
      FIRST_STEPS: 100,
      VICTORIOUS: 100,
      MASTER_DETECTIVE: 500,
      SHARP_SHOOTER: 300,
      GHOST_HUNTER: 200,
      GHOST_THIEF: 300,
      SHADOW_ESCAPE: 250,
      OBSERVATION_KING: 200,
      SPEED_DETECTIVE: 300,
      ROYAL_SOVEREIGN: 500,
      RAJAS_BOUNTY: 200,
      ULTIMATE_DETECTIVE: 500,
      ROYAL_GENIUS: 300,
      QUEENS_INTUITION: 300,
      ESCAPE_ARTIST: 250,
      TRUSTED_WITNESS: 200,
      ROYAL_GUARDIAN: 300,
      KINGDOM_SAVIOR: 500,
    };

    const achievementXp = achievements.reduce(
      (sum, a) => sum + (Number(a.xpReward) || ACHIEVEMENT_XP_MAP[a.code] || 100),
      0
    );
    const totalCombinedXp = classicXp + modernXp + detectiveXp + achievementXp;
    const globalLevelInfo = calculateLevel(totalCombinedXp);

    const classicLevelInfo = calculateLevel(classicXp);
    const modernLevelInfo = calculateLevel(modernXp);
    const detectiveLevelInfo = calculateLevel(detectiveXp);

    // Derive dynamic roleStats from match history if stored roleStats is missing or zeroed out
    let derivedRajaTurns = 0, derivedRajaPts = 0;
    let derivedRaniTurns = 0, derivedRaniPts = 0;
    let derivedPoliceTurns = 0, derivedPoliceCatches = 0, derivedPoliceWrongs = 0;
    let derivedThiefTurns = 0, derivedThiefEscaped = 0, derivedThiefCaught = 0;

    rawRecentMatches.forEach((m) => {
      if (!m.players || !Array.isArray(m.players)) return;
      const p = m.players.find(
        (pl) => (pl.userId && String(pl.userId) === String(user._id)) ||
                (pl.username && String(pl.username).toLowerCase() === String(user.username).toLowerCase())
      );
      if (!p) return;

      const rTurns = p.rajaTurns || (p.role === "Raja" ? 1 : 0);
      const rnTurns = p.raniTurns || (p.role === "Rani" ? 1 : 0);
      const pTurns = p.policeTurns || p.policeTurnsCompleted || (p.role === "Police" ? 1 : 0);
      const tTurns = p.thiefTurns || (p.role === "Thief" ? 1 : 0);

      derivedRajaTurns += rTurns;
      derivedRajaPts += p.rajaPoints || (p.role === "Raja" ? (p.score || 1000) : 0);

      derivedRaniTurns += rnTurns;
      derivedRaniPts += p.raniPoints || (p.role === "Rani" ? (p.score || 800) : 0);

      derivedPoliceTurns += pTurns;
      derivedPoliceCatches += (p.correctCatches || 0);
      derivedPoliceWrongs += (p.wrongGuesses || 0);

      derivedThiefTurns += tTurns;
      derivedThiefEscaped += (p.thiefEscaped || 0);
      derivedThiefCaught += (p.thiefCaught || 0);
    });

    const pAttSum = derivedPoliceCatches + derivedPoliceWrongs;
    const derivedPoliceAcc = pAttSum > 0 ? Math.round((derivedPoliceCatches / pAttSum) * 100) : 0;

    const tTurSum = derivedThiefEscaped + derivedThiefCaught;
    const derivedThiefEscRate = tTurSum > 0 ? Math.round((derivedThiefEscaped / tTurSum) * 100) : 0;

    const storedRoleStats = statsObj.roleStats || {};
    const effectiveRoleStats = {
      raja: {
        timesAssigned: (storedRoleStats.raja?.timesAssigned || 0) || derivedRajaTurns,
        totalPoints: (storedRoleStats.raja?.totalPoints || 0) || derivedRajaPts,
      },
      rani: {
        timesAssigned: (storedRoleStats.rani?.timesAssigned || 0) || derivedRaniTurns,
        totalPoints: (storedRoleStats.rani?.totalPoints || 0) || derivedRaniPts,
      },
      police: {
        timesAssigned: (storedRoleStats.police?.timesAssigned || 0) || derivedPoliceTurns,
        correctCatches: (storedRoleStats.police?.correctCatches || 0) || derivedPoliceCatches,
        wrongGuesses: (storedRoleStats.police?.wrongGuesses || 0) || derivedPoliceWrongs,
        accuracy: (storedRoleStats.police?.accuracy || 0) || derivedPoliceAcc,
      },
      thief: {
        timesAssigned: (storedRoleStats.thief?.timesAssigned || 0) || derivedThiefTurns,
        escaped: (storedRoleStats.thief?.escaped || 0) || derivedThiefEscaped,
        caught: (storedRoleStats.thief?.caught || 0) || derivedThiefCaught,
        escapeRate: (storedRoleStats.thief?.escapeRate || 0) || derivedThiefEscRate,
      },
    };

    return {
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar || statsObj.avatar || "1",
        description: user.description || statsObj.description || "",
        country: statsObj.country || "IN",
        level: globalLevelInfo.level,
        xp: totalCombinedXp,
        levelInfo: globalLevelInfo,
        title: detectiveStats?.title || statsObj.title || "Junior Detective",
        createdAt: user.createdAt,
        lastPlayedAt: detectiveStats?.lastPlayedAt || statsObj.lastPlayedAt || user.createdAt,
      },
      stats: {
        avatar: user.avatar || statsObj.avatar || "1",
        description: user.description || statsObj.description || "",
        username: user.username,
        playerLevel: globalLevelInfo.level,
        xp: totalCombinedXp,
        levelInfo: globalLevelInfo,
        xpBreakdown: {
          totalXp: totalCombinedXp,
          overallLevelInfo: globalLevelInfo,
          classicMode: { xp: classicXp, levelInfo: classicLevelInfo },
          modernMode: { xp: modernXp, levelInfo: modernLevelInfo },
          detectiveChallenge: { xp: detectiveXp, levelInfo: detectiveLevelInfo },
          achievements: { xp: achievementXp, count: achievements.length },
        },
        title: detectiveStats?.title || statsObj.title || "Junior Detective",
        joinDate: user.createdAt,
        lastPlayedDate: detectiveStats?.lastPlayedAt || statsObj.lastPlayedAt || user.createdAt,
        overallStats: {
          totalGames: combinedGames,
          gamesPlayed: combinedGames,
          totalWins: combinedWins,
          gamesWon: combinedWins,
          totalLosses: combinedLosses,
          gamesLost: combinedLosses,
          totalRoundsPlayed: combinedRounds,
          totalScore: statsObj.totalScore || 0,
          winRate: combinedWinRate,
          totalTimePlayed: combinedTime,
          totalPlayTime: combinedTime,
          currentWinStreak: combinedCurrentStreak,
          longestWinStreak: combinedLongestStreak,
        },
        roleStats: effectiveRoleStats,
        classicMode: {
          ...(statsObj.classicMode || {}),
          xp: classicXp,
          levelInfo: classicLevelInfo,
        },
        modernMode: {
          ...(modernStats || {}),
          xp: modernXp,
          levelInfo: modernLevelInfo,
        },
        policeMode: statsObj.policeMode || {},
        detectiveChallenge: {
          ...detectiveChallengeData,
          xp: detectiveXp,
          levelInfo: detectiveLevelInfo,
        },
        records: {
          ...(statsObj.records || {}),
          fastestCatch: (() => {
            const cFast = statsObj.records?.fastestCatch;
            const dFast = detectiveStats?.fastestGuessTime;
            const validC = typeof cFast === "number" && cFast > 0 ? cFast : 999;
            const validD = typeof dFast === "number" && dFast > 0 ? dFast : 999;
            const minVal = Math.min(validC, validD);
            return minVal < 999 ? minVal : 0;
          })(),
          longestWinStreak: combinedLongestStreak,
        },
        socialStats,
        social: socialStats,
        daily: {
          ...dailyObj,
          winRate: dailyObj.gamesPlayed ? Math.round((dailyObj.wins / dailyObj.gamesPlayed) * 100) : 0,
        },
        weekly: {
          ...weeklyObj,
          winRate: weeklyObj.gamesPlayed ? Math.round((weeklyObj.wins / weeklyObj.gamesPlayed) * 100) : 0,
        },
      },
      achievements,
      recentMatches: allMatches,
    };
  } catch (err) {
    console.error("Error in getProfileDataById:", err);
    return null;
  }
}

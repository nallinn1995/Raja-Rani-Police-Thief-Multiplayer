import DetectiveChallengeStats from "../../models/detectiveChallenge/DetectiveChallengeStats.js";
import DetectiveChallengeTitle from "../../models/detectiveChallenge/DetectiveChallengeTitle.js";
import PlayerStats from "../../models/PlayerStats.js";
import { DetectiveChallengeTitleService } from "./DetectiveChallengeTitleService.js";
import { calculateDetectiveXP, calculateLevel } from "../../config/xpConfig.js";

export class DetectiveChallengeStatsService {
  static async getOrCreateStats(userId, username) {
    let stats = await DetectiveChallengeStats.findOne({ userId });
    if (!stats) {
      stats = new DetectiveChallengeStats({
        userId,
        username,
        title: "Junior Detective",
      });
      await stats.save();
    }
    return stats;
  }

  static async updatePlayerStats(user, playerMatchData, matchDuration) {
    if (!user || user.isGuest) return null;

    let stats = await this.getOrCreateStats(user._id, user.username);
    let playerStats = await PlayerStats.findOne({ userId: user._id });
    if (!playerStats) {
      playerStats = new PlayerStats({
        userId: user._id,
        username: user.username,
      });
    }

    // Global XP & Leveling calculation using XP_CONFIG
    const oldGlobalXp = playerStats.xp || user.xp || 0;
    const oldLevelInfo = calculateLevel(oldGlobalXp);

    const matchXP = calculateDetectiveXP(playerMatchData);
    const earnedXp = matchXP.totalXP;

    // Mode-specific Detective stats XP
    stats.xp = (stats.xp || 0) + earnedXp;
    const newDcLevelInfo = calculateLevel(stats.xp);
    stats.level = newDcLevelInfo.level;
    stats.lastPlayedAt = new Date();

    // Unified Global PlayerStats
    if (!playerStats.detectiveMode) {
      playerStats.detectiveMode = { gamesPlayed: 0, gamesWon: 0, xp: 0 };
    }
    playerStats.detectiveMode.gamesPlayed = (playerStats.detectiveMode.gamesPlayed || 0) + 1;
    if (playerMatchData.isChampion) {
      playerStats.detectiveMode.gamesWon = (playerStats.detectiveMode.gamesWon || 0) + 1;
    }
    playerStats.detectiveMode.xp = (playerStats.detectiveMode.xp || 0) + earnedXp;

    playerStats.totalGames = (playerStats.totalGames || 0) + 1;
    if (playerMatchData.isChampion) {
      playerStats.totalWins = (playerStats.totalWins || 0) + 1;
    } else {
      playerStats.totalLosses = (playerStats.totalLosses || 0) + 1;
    }
    playerStats.totalTimePlayed = (playerStats.totalTimePlayed || 0) + (matchDuration || 0);

    playerStats.xp = oldGlobalXp + earnedXp;
    const newGlobalLevelInfo = calculateLevel(playerStats.xp);
    playerStats.level = newGlobalLevelInfo.level;
    playerStats.lastPlayedAt = new Date();
    await playerStats.save();

    user.xp = playerStats.xp;
    user.level = playerStats.level;
    await user.save();

    // Match Counts
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    if (playerMatchData.isChampion) {
      stats.gamesWon = (stats.gamesWon || 0) + 1;
      stats.currentWinStreak = (stats.currentWinStreak || 0) + 1;
      if (stats.currentWinStreak > (stats.longestWinStreak || 0)) {
        stats.longestWinStreak = stats.currentWinStreak;
      }
    } else {
      stats.gamesLost = (stats.gamesLost || 0) + 1;
      stats.currentWinStreak = 0;
    }

    // Correct & Wrong
    const correctC = playerMatchData.correctCount || 0;
    const wrongC = playerMatchData.wrongCount || 0;
    stats.totalCorrectGuesses = (stats.totalCorrectGuesses || 0) + correctC;
    stats.totalWrongGuesses = (stats.totalWrongGuesses || 0) + wrongC;

    const totalGuesses = stats.totalCorrectGuesses + stats.totalWrongGuesses;
    stats.overallAccuracy = totalGuesses > 0 ? Math.round((stats.totalCorrectGuesses / totalGuesses) * 100) : 0;

    // Decision Speeds
    if (playerMatchData.fastestGuess && playerMatchData.fastestGuess > 0) {
      if (!stats.fastestGuessTime || playerMatchData.fastestGuess < stats.fastestGuessTime) {
        stats.fastestGuessTime = playerMatchData.fastestGuess;
      }
    }
    if (playerMatchData.avgGuessTime && playerMatchData.avgGuessTime > 0) {
      stats.totalGuessTimeSum = (stats.totalGuessTimeSum || 0) + playerMatchData.avgGuessTime;
      stats.totalGuessTimeCount = (stats.totalGuessTimeCount || 0) + 1;
      stats.averageGuessTime = parseFloat((stats.totalGuessTimeSum / stats.totalGuessTimeCount).toFixed(2));
    }

    // Streaks & Records
    if (playerMatchData.longestStreak && playerMatchData.longestStreak > (stats.longestStreak || 0)) {
      stats.longestStreak = playerMatchData.longestStreak;
    }
    if (playerMatchData.accuracy && playerMatchData.accuracy > (stats.highestAccuracy || 0)) {
      stats.highestAccuracy = playerMatchData.accuracy;
    }

    // Title Check
    const newTitle = DetectiveChallengeTitleService.calculateTitle(stats);
    if (newTitle !== stats.title) {
      stats.title = newTitle;
      try {
        await DetectiveChallengeTitle.updateOne(
          { userId: user._id, title: newTitle },
          { $setOnInsert: { userId: user._id, title: newTitle, category: "Detective", unlockedAt: new Date() } },
          { upsert: true }
        );
      } catch (tErr) {}
    }

    stats.matchXP = matchXP;
    stats.levelUpInfo = {
      oldLevel: oldLevelInfo.level,
      newLevel: newLevelInfo.level,
      isLevelUp: newLevelInfo.level > oldLevelInfo.level,
      currentLevelInfo: newLevelInfo,
    };

    await stats.save();
    return stats;
  }
}

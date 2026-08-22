import PoliceThiefStats from "../models/PoliceThiefStats.js";
import PoliceThiefTitle from "../models/PoliceThiefTitle.js";
import { TitleService } from "./TitleService.js";

export class PoliceThiefStatsService {
  static async getOrCreateStats(userId, username) {
    let stats = await PoliceThiefStats.findOne({ userId });
    if (!stats) {
      stats = new PoliceThiefStats({
        userId,
        username,
        title: "Recruit Detective",
      });
      await stats.save();
    }
    return stats;
  }

  static async updateStatsForMatchPlayer(user, playerMatchData, matchDuration, totalRounds) {
    if (!user || user.isGuest) return null;

    let stats = await this.getOrCreateStats(user._id, user.username);

    // XP & Level
    const earnedXp =
      (playerMatchData.score || 0) +
      50 +
      (playerMatchData.correctCatches || 0) * 30 +
      (playerMatchData.isChampion ? 100 : 0);

    stats.xp = (stats.xp || 0) + earnedXp;
    stats.level = Math.floor(stats.xp / 500) + 1;
    stats.lastPlayedAt = new Date();

    // Match Counts
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    if (playerMatchData.isChampion) {
      stats.gamesWon = (stats.gamesWon || 0) + 1;
      stats.detectiveWins = (stats.detectiveWins || 0) + 1;
      stats.currentDetectiveWinStreak = (stats.currentDetectiveWinStreak || 0) + 1;
      if (stats.currentDetectiveWinStreak > (stats.longestDetectiveWinStreak || 0)) {
        stats.longestDetectiveWinStreak = stats.currentDetectiveWinStreak;
      }
    } else {
      stats.gamesLost = (stats.gamesLost || 0) + 1;
      stats.currentDetectiveWinStreak = 0;
    }

    // Detective Metrics
    const correctC = playerMatchData.correctCatches || 0;
    const wrongG = playerMatchData.wrongGuesses || 0;
    stats.totalCorrectCatches = (stats.totalCorrectCatches || 0) + correctC;
    stats.totalWrongGuesses = (stats.totalWrongGuesses || 0) + wrongG;
    stats.timesPlayedAsPolice = (stats.timesPlayedAsPolice || 0) + (playerMatchData.policeTurnsCompleted || 0);

    const totalAttempts = stats.totalCorrectCatches + stats.totalWrongGuesses;
    stats.policeAccuracy = totalAttempts > 0 ? Math.round((stats.totalCorrectCatches / totalAttempts) * 100) : 0;

    // Fastest Catch
    if (playerMatchData.fastestCatch && playerMatchData.fastestCatch > 0) {
      if (!stats.fastestCorrectCatch || playerMatchData.fastestCatch < stats.fastestCorrectCatch) {
        stats.fastestCorrectCatch = playerMatchData.fastestCatch;
      }
    }

    // Thief Metrics
    const escaped = playerMatchData.thiefEscaped || 0;
    const caught = playerMatchData.thiefCaught || 0;
    stats.timesPlayedAsThief = (stats.timesPlayedAsThief || 0) + (playerMatchData.thiefTurns || escaped + caught || 0);
    stats.thiefEscaped = (stats.thiefEscaped || 0) + escaped;
    stats.thiefCaught = (stats.thiefCaught || 0) + caught;

    if (escaped > 0) {
      stats.currentEscapeStreak = (stats.currentEscapeStreak || 0) + escaped;
      if (stats.currentEscapeStreak > (stats.longestEscapeStreak || 0)) {
        stats.longestEscapeStreak = stats.currentEscapeStreak;
      }
    } else if (caught > 0) {
      stats.currentEscapeStreak = 0;
    }

    const totalThiefTurns = stats.thiefEscaped + stats.thiefCaught;
    stats.escapeRate = totalThiefTurns > 0 ? Math.round((stats.thiefEscaped / totalThiefTurns) * 100) : 0;

    // Lifetime Records
    stats.records = stats.records || {};
    stats.records.highestAccuracyInMatch = Math.max(stats.records.highestAccuracyInMatch || 0, playerMatchData.accuracy || 0);
    stats.records.mostCatchesInMatch = Math.max(stats.records.mostCatchesInMatch || 0, correctC);
    stats.records.mostEscapesInMatch = Math.max(stats.records.mostEscapesInMatch || 0, escaped);
    if (playerMatchData.fastestCatch && playerMatchData.fastestCatch > 0) {
      stats.records.fastestCatchSeconds = (!stats.records.fastestCatchSeconds || playerMatchData.fastestCatch < stats.records.fastestCatchSeconds)
        ? playerMatchData.fastestCatch
        : stats.records.fastestCatchSeconds;
    }

    // Update Title
    const newTitle = TitleService.calculateTitle(stats);
    if (newTitle !== stats.title) {
      stats.title = newTitle;
      try {
        await PoliceThiefTitle.updateOne(
          { userId: user._id, title: newTitle },
          { $setOnInsert: { userId: user._id, title: newTitle, category: TitleService.getTitleCategory(newTitle), unlockedAt: new Date() } },
          { upsert: true }
        );
      } catch (tErr) {
        // ignore title duplicate
      }
    }

    await stats.save();
    return stats;
  }
}

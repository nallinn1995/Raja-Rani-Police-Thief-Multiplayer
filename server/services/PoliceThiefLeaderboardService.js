import PoliceThiefStats from "../models/PoliceThiefStats.js";
import PoliceThiefLeaderboard from "../models/PoliceThiefLeaderboard.js";

export class PoliceThiefLeaderboardService {
  static async refreshLeaderboard(category = "top_detective", limit = 50) {
    let sortField = { detectiveWins: -1, policeAccuracy: -1 };
    let query = {};

    switch (category) {
      case "highest_accuracy":
        sortField = { policeAccuracy: -1, totalCorrectCatches: -1 };
        break;
      case "most_catches":
        sortField = { totalCorrectCatches: -1, policeAccuracy: -1 };
        break;
      case "fastest_detective":
        sortField = { fastestCorrectCatch: 1, totalCorrectCatches: -1 };
        query = { fastestCorrectCatch: { $gt: 0 } };
        break;
      case "most_escapes":
        sortField = { thiefEscaped: -1, escapeRate: -1 };
        break;
      case "longest_streak":
        sortField = { longestDetectiveWinStreak: -1, detectiveWins: -1 };
        break;
      default:
        sortField = { detectiveWins: -1, policeAccuracy: -1 };
    }

    const statsList = await PoliceThiefStats.find(query)
      .sort(sortField)
      .limit(limit)
      .lean();

    const leaderboardEntries = statsList.map((item, index) => ({
      rank: index + 1,
      userId: item.userId,
      username: item.username,
      avatar: item.avatar || "1",
      title: item.title || "Recruit Detective",
      metrics: {
        detectiveWins: item.detectiveWins || 0,
        correctCatches: item.totalCorrectCatches || 0,
        wrongGuesses: item.totalWrongGuesses || 0,
        accuracy: item.policeAccuracy || 0,
        policeTurns: item.timesPlayedAsPolice || 0,
        thiefEscaped: item.thiefEscaped || 0,
        escapeRate: item.escapeRate || 0,
        fastestCatch: item.fastestCorrectCatch || 0,
        longestStreak: item.longestDetectiveWinStreak || 0,
      },
    }));

    // Update snapshot cache in background
    try {
      await PoliceThiefLeaderboard.deleteMany({ category });
      if (leaderboardEntries.length > 0) {
        await PoliceThiefLeaderboard.insertMany(
          leaderboardEntries.map((e) => ({ ...e, category, updatedAt: new Date() }))
        );
      }
    } catch (e) {
      console.warn("Leaderboard snapshot notice:", e.message);
    }

    return leaderboardEntries;
  }
}

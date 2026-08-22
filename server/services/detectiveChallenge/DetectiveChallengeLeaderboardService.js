import DetectiveChallengeStats from "../../models/detectiveChallenge/DetectiveChallengeStats.js";
import DetectiveChallengeLeaderboard from "../../models/detectiveChallenge/DetectiveChallengeLeaderboard.js";

export class DetectiveChallengeLeaderboardService {
  static async refreshLeaderboard(category = "highest_accuracy", limit = 50) {
    let sortField = { overallAccuracy: -1, totalCorrectGuesses: -1 };
    let query = {};

    switch (category) {
      case "fastest_guess":
        sortField = { averageGuessTime: 1, overallAccuracy: -1 };
        query = { averageGuessTime: { $gt: 0 } };
        break;
      case "most_wins":
        sortField = { gamesWon: -1, overallAccuracy: -1 };
        break;
      case "longest_streak":
        sortField = { longestStreak: -1, overallAccuracy: -1 };
        break;
      case "highest_accuracy":
      default:
        sortField = { overallAccuracy: -1, totalCorrectGuesses: -1 };
    }

    const statsList = await DetectiveChallengeStats.find(query)
      .sort(sortField)
      .limit(limit)
      .lean();

    const leaderboardEntries = statsList.map((item, index) => ({
      rank: index + 1,
      userId: item.userId,
      username: item.username,
      avatar: item.avatar || "1",
      title: item.title || "Junior Detective",
      metrics: {
        accuracy: item.overallAccuracy || 0,
        avgGuessTime: item.averageGuessTime || 0,
        fastestGuess: item.fastestGuessTime || 0,
        totalWins: item.gamesWon || 0,
        longestStreak: item.longestStreak || 0,
        correctCount: item.totalCorrectGuesses || 0,
      },
    }));

    try {
      await DetectiveChallengeLeaderboard.deleteMany({ category });
      if (leaderboardEntries.length > 0) {
        await DetectiveChallengeLeaderboard.insertMany(
          leaderboardEntries.map((e) => ({ ...e, category, updatedAt: new Date() }))
        );
      }
    } catch (e) {
      console.warn("Detective leaderboard snapshot notice:", e.message);
    }

    return leaderboardEntries;
  }
}

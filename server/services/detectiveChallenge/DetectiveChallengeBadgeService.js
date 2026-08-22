export class DetectiveChallengeBadgeService {
  static getRoundBadge(isCorrect, guessTime, currentStreak) {
    if (!isCorrect) {
      if (guessTime > 6) return { badge: "😅 Better Luck Next Round", icon: "😅", code: "BETTER_LUCK" };
      return { badge: "💥 Wrong Suspect", icon: "💥", code: "WRONG_SUSPECT" };
    }

    if (guessTime <= 2.5) {
      return { badge: "⚡ Lightning Detective", icon: "⚡", code: "LIGHTNING_DETECTIVE" };
    }
    if (guessTime <= 4.0) {
      return { badge: "💨 Quick Thinker", icon: "💨", code: "QUICK_THINKER" };
    }
    if (currentStreak >= 3) {
      return { badge: "🔥 Sharp Detective", icon: "🔥", code: "SHARP_DETECTIVE" };
    }
    if (guessTime > 5.5) {
      return { badge: "😎 Calm Detective", icon: "😎", code: "CALM_DETECTIVE" };
    }

    return { badge: "🧠 Master Detective", icon: "🧠", code: "MASTER_DETECTIVE" };
  }

  static getMatchAwards(sortedPlayers) {
    if (!sortedPlayers || sortedPlayers.length === 0) return [];

    const champion = sortedPlayers[0];
    const mostAccurate = [...sortedPlayers].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0];
    const fastestPlayer = [...sortedPlayers]
      .filter((p) => (p.avgGuessTime || p.fastestGuess || 0) > 0)
      .sort((a, b) => (a.avgGuessTime || a.fastestGuess || 99) - (b.avgGuessTime || b.fastestGuess || 99))[0];
    const longestStreakPlayer = [...sortedPlayers].sort((a, b) => (b.longestStreak || 0) - (a.longestStreak || 0))[0];

    return [
      {
        title: "🏆 Detective Champion",
        player: champion?.username || champion?.name || "None",
        detail: `${champion?.accuracy || 0}% Accuracy (${champion?.correctCount || 0} Correct)`,
        icon: "🏆",
        code: "CHAMPION",
      },
      {
        title: "🎯 Perfect Accuracy",
        player: mostAccurate?.username || mostAccurate?.name || "None",
        detail: `${mostAccurate?.accuracy || 0}% Accuracy`,
        icon: "🎯",
        code: "ACCURACY",
      },
      {
        title: "⚡ Lightning Speed",
        player: fastestPlayer?.username || fastestPlayer?.name || "None",
        detail: fastestPlayer ? `${(fastestPlayer.avgGuessTime || fastestPlayer.fastestGuess || 0).toFixed(2)}s Avg Speed` : "N/A",
        icon: "⚡",
        code: "SPEED",
      },
      {
        title: "🔥 Streak Master",
        player: longestStreakPlayer?.username || longestStreakPlayer?.name || "None",
        detail: `${longestStreakPlayer?.longestStreak || 0} Consecutive Correct`,
        icon: "🔥",
        code: "STREAK",
      },
    ];
  }
}

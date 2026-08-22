export class TitleService {
  static calculateTitle(stats) {
    if (!stats) return "Recruit Detective";

    const detectiveWins = stats.detectiveWins || 0;
    const accuracy = stats.policeAccuracy || 0;
    const catches = stats.totalCorrectCatches || 0;
    const escapes = stats.thiefEscaped || 0;
    const policeTurns = stats.timesPlayedAsPolice || 0;
    const totalGames = stats.gamesPlayed || 0;

    if (detectiveWins >= 100 && accuracy >= 85) return "Legend Detective";
    if (detectiveWins >= 50 && accuracy >= 80) return "Master Detective";
    if (catches >= 100) return "Shadow Hunter";
    if (escapes >= 20) return "Master Escape Artist";
    if (detectiveWins >= 25 && accuracy >= 65) return "Elite Investigator";
    if (policeTurns >= 15 && accuracy >= 50) return "Senior Detective";
    if (policeTurns >= 5) return "Junior Detective";
    if (totalGames >= 50) return "Veteran Investigator";
    if (stats.gamesWon >= 25) return "Supreme Champion";

    return "Recruit Detective";
  }

  static getTitleCategory(title) {
    if (title.includes("Detective") || title.includes("Investigator") || title.includes("Hunter")) {
      return "Detective";
    }
    if (title.includes("Escape") || title.includes("Artist")) {
      return "Thief";
    }
    return "Veteran";
  }
}

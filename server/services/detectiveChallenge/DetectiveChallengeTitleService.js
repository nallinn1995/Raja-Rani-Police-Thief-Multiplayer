export class DetectiveChallengeTitleService {
  static calculateTitle(stats) {
    if (!stats) return "Junior Detective";

    const wins = stats.gamesWon || 0;
    const accuracy = stats.overallAccuracy || 0;
    const totalCorrect = stats.totalCorrectGuesses || 0;
    const fastest = stats.fastestGuessTime || 0;

    if (wins >= 50 && accuracy >= 85) return "Supreme Investigation King";
    if (wins >= 25 && accuracy >= 80) return "Master Detective";
    if (totalCorrect >= 50) return "Shadow Tracker";
    if (fastest > 0 && fastest <= 2.0) return "Lightning Investigator";
    if (wins >= 10 && accuracy >= 70) return "Senior Detective";
    if (totalCorrect >= 15) return "Experienced Detective";
    if (wins >= 1) return "Verified Detective";

    return "Junior Detective";
  }
}

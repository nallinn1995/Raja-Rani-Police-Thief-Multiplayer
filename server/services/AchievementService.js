import PoliceThiefAchievement from "../models/PoliceThiefAchievement.js";

export class AchievementService {
  static async evaluateAndAward(userId, stats, matchData) {
    if (!userId || !stats) return [];

    const candidates = [];
    const pm = stats;

    if ((pm.gamesPlayed || 0) >= 1) {
      candidates.push({
        code: "FIRST_POLICE_THIEF_GAME",
        title: "First Investigation",
        description: "Played your first Police vs Thief match!",
        icon: "🕵️",
      });
    }

    if ((pm.gamesWon || 0) >= 1) {
      candidates.push({
        code: "FIRST_DETECTIVE_WIN",
        title: "Case Closed",
        description: "Won your first Police vs Thief match as Champion!",
        icon: "🏆",
      });
    }

    if ((pm.policeAccuracy || 0) >= 80 && (pm.totalCorrectCatches || 0) >= 5) {
      candidates.push({
        code: "MASTER_DETECTIVE_ACH",
        title: "Master Detective",
        description: "Maintained 80%+ Detective Accuracy with 5+ Catches!",
        icon: "🎯",
      });
    }

    if ((pm.totalCorrectCatches || 0) >= 10) {
      candidates.push({
        code: "SHARP_SHOOTER",
        title: "Sharp Shooter",
        description: "Achieved 10 Correct Catches as Police!",
        icon: "⚡",
      });
    }

    if ((pm.detectiveWins || 0) >= 25) {
      candidates.push({
        code: "ELITE_INVESTIGATOR_ACH",
        title: "Elite Investigator",
        description: "Claimed 25 Detective Wins!",
        icon: "👑",
      });
    }

    if (pm.fastestCorrectCatch && pm.fastestCorrectCatch <= 5 && pm.fastestCorrectCatch > 0) {
      candidates.push({
        code: "GHOST_HUNTER",
        title: "Ghost Hunter",
        description: "Caught the Thief in under 5 seconds!",
        icon: "⏱️",
      });
    }

    if ((matchData?.accuracy === 100) && (matchData?.correctCatches || 0) >= 1) {
      candidates.push({
        code: "PERFECT_MATCH_ACH",
        title: "Flawless Detective",
        description: "100% Accuracy in a single Police vs Thief match!",
        icon: "🌟",
      });
    }

    if ((pm.thiefEscaped || 0) >= 15) {
      candidates.push({
        code: "MASTER_ESCAPE_ARTIST_ACH",
        title: "Master Escape Artist",
        description: "Successfully escaped 15 rounds as Thief!",
        icon: "🥷",
      });
    }

    if ((pm.longestEscapeStreak || 0) >= 5) {
      candidates.push({
        code: "UNTOUCHABLE_THIEF",
        title: "Untouchable Thief",
        description: "Achieved 5 consecutive Thief escapes!",
        icon: "👻",
      });
    }

    const awarded = [];
    for (const ach of candidates) {
      try {
        const existing = await PoliceThiefAchievement.findOne({ userId, code: ach.code });
        if (!existing) {
          const created = new PoliceThiefAchievement({
            userId,
            ...ach,
            unlockedAt: new Date(),
          });
          await created.save();
          awarded.push(created);
        }
      } catch (err) {
        // Ignore duplicate key errors gracefully
      }
    }

    return awarded;
  }
}

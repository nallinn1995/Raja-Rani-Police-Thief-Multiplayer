// Configurable XP Rules & Global Level Table
export const XP_CONFIG = {
  // Global Level Progression Table
  LEVEL_TABLE: [
    { level: 1, minXp: 0, requiredXp: 500 },
    { level: 2, minXp: 500, requiredXp: 700 },     // 500 to 1200
    { level: 3, minXp: 1200, requiredXp: 900 },    // 1200 to 2100
    { level: 4, minXp: 2100, requiredXp: 1300 },   // 2100 to 3400
    { level: 5, minXp: 3400, requiredXp: 1600 },   // 3400 to 5000
    { level: 6, minXp: 5000, requiredXp: 2000 },   // 5000 to 7000
    { level: 7, minXp: 7000, requiredXp: 2500 },   // 7000 to 9500
    { level: 8, minXp: 9500, requiredXp: 3000 },   // 9500 to 12500
    { level: 9, minXp: 12500, requiredXp: 3500 },  // 12500 to 16000
    { level: 10, minXp: 16000, requiredXp: 4000 },
  ],

  // Classic Mode Base & Bonus Constants
  CLASSIC_MODE: {
    PARTICIPATION_XP: 20,
    COMPLETION_XP: 30,
    SCORE_DIVISOR: 10, // Score / 10
    WINNER_BONUS: 100,
    POLICE_CATCH_BONUS: 30, // 30 per correct catch
  },

  // Detective Challenge Mode Base & Bonus Constants
  DETECTIVE_CHALLENGE: {
    PARTICIPATION_XP: 20,
    COMPLETION_XP: 30,
    CORRECT_GUESS_BONUS: 40, // 40 per correct catch
    CHAMPION_BONUS: 120,
    ACCURACY_MILESTONES: [
      { threshold: 100, bonus: 100 },
      { threshold: 90, bonus: 80 },
      { threshold: 80, bonus: 60 },
      { threshold: 70, bonus: 40 },
      { threshold: 60, bonus: 20 },
      { threshold: 0, bonus: 10 },
    ],
    SPEED_BONUS: 15, // if guess time <= 5s
  },
};

/**
 * Calculates Global Player Level and Level Progress Info from Total XP
 */
export function calculateLevel(xp = 0) {
  const currentXp = Math.max(0, Number(xp) || 0);

  let currentLevel = 1;
  let currentLevelMinXp = 0;
  let nextLevelXp = 500;

  for (let i = 0; i < XP_CONFIG.LEVEL_TABLE.length; i++) {
    const entry = XP_CONFIG.LEVEL_TABLE[i];
    const nextEntry = XP_CONFIG.LEVEL_TABLE[i + 1];

    if (nextEntry) {
      if (currentXp >= entry.minXp && currentXp < nextEntry.minXp) {
        currentLevel = entry.level;
        currentLevelMinXp = entry.minXp;
        nextLevelXp = nextEntry.minXp;
        break;
      }
    } else {
      // Level 10 or beyond
      if (currentXp >= entry.minXp) {
        const extraXp = currentXp - entry.minXp;
        const extraLevels = Math.floor(extraXp / entry.requiredXp);
        currentLevel = entry.level + extraLevels;
        currentLevelMinXp = entry.minXp + extraLevels * entry.requiredXp;
        nextLevelXp = currentLevelMinXp + entry.requiredXp;
        break;
      }
    }
  }

  const xpInCurrentLevel = currentXp - currentLevelMinXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelMinXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return {
    level: currentLevel,
    xp: currentXp,
    currentLevelMinXp,
    nextLevelXp,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercent: Math.round(progressPercent * 10) / 10,
  };
}

/**
 * Calculates Accuracy Bonus for Detective Challenge
 */
export function calculateAccuracyBonus(accuracy = 0) {
  const acc = Number(accuracy) || 0;
  for (const milestone of XP_CONFIG.DETECTIVE_CHALLENGE.ACCURACY_MILESTONES) {
    if (acc >= milestone.threshold) {
      return milestone.bonus;
    }
  }
  return 10;
}

/**
 * Calculates Classic Mode XP Breakdown
 */
export function calculateClassicXP(p = {}) {
  const participationXP = XP_CONFIG.CLASSIC_MODE.PARTICIPATION_XP;
  const completionXP = XP_CONFIG.CLASSIC_MODE.COMPLETION_XP;
  const scoreXP = Math.round((Number(p.score) || 0) / XP_CONFIG.CLASSIC_MODE.SCORE_DIVISOR);
  const winnerBonus = p.isWinner ? XP_CONFIG.CLASSIC_MODE.WINNER_BONUS : 0;
  const policeBonus = (Number(p.correctCatches) || 0) * XP_CONFIG.CLASSIC_MODE.POLICE_CATCH_BONUS;
  const accuracyBonus = 0;
  const speedBonus = 0;
  const achievementBonus = Number(p.achievementBonus) || 0;
  const dailyBonus = Number(p.dailyBonus) || 0;

  const totalXP =
    participationXP +
    completionXP +
    scoreXP +
    winnerBonus +
    policeBonus +
    accuracyBonus +
    speedBonus +
    achievementBonus +
    dailyBonus;

  return {
    participationXP,
    completionXP,
    scoreXP,
    winnerBonus,
    policeBonus,
    accuracyBonus,
    speedBonus,
    achievementBonus,
    dailyBonus,
    totalXP,
  };
}

/**
 * Calculates Detective Challenge XP Breakdown
 */
export function calculateDetectiveXP(p = {}) {
  const participationXP = XP_CONFIG.DETECTIVE_CHALLENGE.PARTICIPATION_XP;
  const completionXP = XP_CONFIG.DETECTIVE_CHALLENGE.COMPLETION_XP;
  const scoreXP = 0;
  const winnerBonus = p.isChampion || p.isWinner ? XP_CONFIG.DETECTIVE_CHALLENGE.CHAMPION_BONUS : 0;
  const policeBonus = (Number(p.correctCount || p.correctCatches) || 0) * XP_CONFIG.DETECTIVE_CHALLENGE.CORRECT_GUESS_BONUS;
  const accuracyBonus = calculateAccuracyBonus(p.accuracy || p.overallAccuracy);
  const speedBonus = p.fastestGuess && p.fastestGuess <= 5 && p.fastestGuess > 0 ? XP_CONFIG.DETECTIVE_CHALLENGE.SPEED_BONUS : 0;
  const achievementBonus = Number(p.achievementBonus) || 0;
  const dailyBonus = Number(p.dailyBonus) || 0;

  const totalXP =
    participationXP +
    completionXP +
    scoreXP +
    winnerBonus +
    policeBonus +
    accuracyBonus +
    speedBonus +
    achievementBonus +
    dailyBonus;

  return {
    participationXP,
    completionXP,
    scoreXP,
    winnerBonus,
    policeBonus,
    accuracyBonus,
    speedBonus,
    achievementBonus,
    dailyBonus,
    totalXP,
  };
}

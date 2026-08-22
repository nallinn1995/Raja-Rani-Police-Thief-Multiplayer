// Configurable XP Rules & Global Level Table (Frontend)
export interface LevelInfo {
  level: number;
  xp: number;
  currentLevelMinXp: number;
  nextLevelXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
}

export interface MatchXPBreakdown {
  participationXP: number;
  completionXP: number;
  scoreXP: number;
  winnerBonus: number;
  policeBonus: number;
  accuracyBonus: number;
  speedBonus: number;
  achievementBonus: number;
  dailyBonus: number;
  totalXP: number;
}

export const XP_CONFIG = {
  LEVEL_TABLE: [
    { level: 1, minXp: 0, requiredXp: 500 },
    { level: 2, minXp: 500, requiredXp: 700 },
    { level: 3, minXp: 1200, requiredXp: 900 },
    { level: 4, minXp: 2100, requiredXp: 1300 },
    { level: 5, minXp: 3400, requiredXp: 1600 },
    { level: 6, minXp: 5000, requiredXp: 2000 },
    { level: 7, minXp: 7000, requiredXp: 2500 },
    { level: 8, minXp: 9500, requiredXp: 3000 },
    { level: 9, minXp: 12500, requiredXp: 3500 },
    { level: 10, minXp: 16000, requiredXp: 4000 },
  ],
};

export function calculateLevel(xp = 0): LevelInfo {
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

import PlayerStats from "../../models/PlayerStats.js";
import ModernModeStats from "../../models/modernMode/ModernModeStats.js";

/**
 * Calculates XP earned in Modern Mode match.
 * Base XP: score * 0.2 + (won ? 150 : 50) + bonus/action modifiers.
 */
export function calculateModernModeXP({ finalScore = 0, isWinner = false, isBonusEarned = false }) {
  let xp = Math.floor(finalScore * 0.2);
  if (isWinner) {
    xp += 150;
  } else {
    xp += 50;
  }
  if (isBonusEarned) {
    xp += 50;
  }
  return Math.max(25, xp);
}

/**
 * Helper formula to compute level from total XP.
 * Standard level curve: Level N requires N*100 XP.
 */
export function calculateLevelFromXP(totalXP) {
  let level = 1;
  let xpNeeded = 100;
  let remaining = totalXP;
  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level++;
    xpNeeded = level * 100;
  }
  return level;
}

/**
 * Updates a user's global XP and Level in PlayerStats and ModernModeStats.
 */
export async function awardModernModeXP(userId, xpEarned, username = "Player") {
  if (!userId) return null;
  try {
    let stats = await PlayerStats.findOne({ userId });
    if (!stats) {
      stats = new PlayerStats({
        userId,
        username,
        xp: 0,
        level: 1,
      });
    }

    stats.xp = (stats.xp || 0) + xpEarned;
    stats.totalGames = (stats.totalGames || 0) + 1;
    stats.level = calculateLevelFromXP(stats.xp);
    stats.lastPlayedAt = new Date();
    await stats.save();

    let modernStats = await ModernModeStats.findOne({ userId });
    if (modernStats) {
      modernStats.xp = (modernStats.xp || 0) + xpEarned;
      await modernStats.save();
    }

    return { xpEarned, newXP: stats ? stats.xp : xpEarned };
  } catch (err) {
    console.error("Error updating Modern Mode XP:", err);
    return null;
  }
}

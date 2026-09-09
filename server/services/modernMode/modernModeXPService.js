import PlayerStats from "../../models/PlayerStats.js";
import ModernModeStats from "../../models/modernMode/ModernModeStats.js";
import User from "../../models/User.js";
import { calculateModernXP, calculateLevel } from "../../config/xpConfig.js";

/**
 * Calculates XP earned in Modern Mode match using central xpConfig.
 */
export function calculateModernModeXP(params = {}) {
  const result = calculateModernXP(params);
  return result.totalXP || Math.max(25, Math.floor((params.finalScore || 0) * 0.1) + (params.isWinner ? 100 : 50));
}

/**
 * Helper formula to compute level from total XP using the authoritative global LEVEL_TABLE.
 */
export function calculateLevelFromXP(totalXP) {
  return calculateLevel(totalXP).level;
}

/**
 * Updates a user's global XP and Level in PlayerStats, ModernModeStats, and User.
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

    if (!stats.modernMode) {
      stats.modernMode = { gamesPlayed: 0, gamesWon: 0, highestScore: 0, totalScore: 0, xp: 0 };
    }
    stats.modernMode.xp = (stats.modernMode.xp || 0) + xpEarned;

    // Increment overall total XP
    stats.xp = (stats.xp || 0) + xpEarned;
    const levelInfo = calculateLevel(stats.xp);
    stats.level = levelInfo.level;
    stats.lastPlayedAt = new Date();
    await stats.save();

    // Update modern mode stats model
    let modernStats = await ModernModeStats.findOne({ userId });
    if (modernStats) {
      modernStats.xp = (modernStats.xp || 0) + xpEarned;
      modernStats.level = levelInfo.level;
      await modernStats.save();
    }

    // Sync to User model
    await User.findByIdAndUpdate(userId, {
      $set: {
        xp: stats.xp,
        level: stats.level,
      },
    }).catch(() => {});

    return { xpEarned, newXP: stats ? stats.xp : xpEarned, level: stats.level };
  } catch (err) {
    console.error("Error updating Modern Mode XP:", err);
    return null;
  }
}


import mongoose from "mongoose";
import ModernModeMatch from "../../models/modernMode/ModernModeMatch.js";
import ModernModeStats from "../../models/modernMode/ModernModeStats.js";
import ModernModeAchievement from "../../models/modernMode/ModernModeAchievement.js";
import User from "../../models/User.js";
import GuestTrackingService from "../GuestTrackingService.js";
import { awardModernModeXP, calculateModernModeXP } from "./modernModeXPService.js";

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class ModernModeService {
  /**
   * Initializes state for a Modern Mode room.
   */
  static createRoomState(roomCode, players, options = {}) {
    const roleList = ["Raja", "Rani", "Police", "Thief", "Mantri", "Villager"];
    const shuffledRoles = shuffle(roleList);

    const baseScores = {
      Raja: 1000,
      Rani: 800,
      Police: 500,
      Thief: 0,
      Mantri: 700,
      Villager: 400,
    };

    const modernPlayers = players.map((p, index) => {
      const assignedRole = shuffledRoles[index];
      return {
        id: p.id,
        userId: p.userId || null,
        name: p.name,
        isHost: !!p.isHost,
        role: assignedRole,
        baseScore: baseScores[assignedRole],
        score: baseScores[assignedRole],
        lootedPoints: 0,
        preventedLoot: 0,
        bonusPoints: 0,
        penaltyPoints: 0,
        roundScore: 0,
        cumulativeScore: 0,
        finalScore: baseScores[assignedRole],
        roundHistory: [],
        socketId: p.socketId || null,
      };
    });

    const readyPlayersSet = new Set();
    const hostPlayer = modernPlayers.find((p) => p.isHost);
    if (hostPlayer) {
      readyPlayersSet.add(hostPlayer.id);
    }

    return {
      roomCode,
      currentRound: 1,
      totalRounds: options.totalRounds || 3,
      winCondition: options.winCondition || "rounds",
      targetScore: options.targetScore || 5000,
      phase: "rules", // rules -> mantri-shield -> royal-phase -> investigation-phase -> witness-phase -> result
      readyPlayers: readyPlayersSet,
      players: modernPlayers,
      mantriShieldTargetId: null,
      mantriShieldSuccess: false,
      mantriProtectedThief: false,
      rajaGuessId: null,
      rajaGuessSuccess: false,
      raniGuessId: null,
      raniGuessSuccess: false,
      policeGuessId: null,
      policeGuessSuccess: false,
      villagerChoice: null,
      villagerBonusEarned: false,
      villagerBonusType: "none",
      startTime: Date.now(),
    };
  }

  /**
   * Resets Modern Mode state for the next round.
   */
  static resetForNextRound(modernState) {
    modernState.currentRound += 1;
    modernState.isRoundFinalized = false;
    modernState.lastRoundResultData = null;
    modernState.phase = "mantri-shield";
    modernState.mantriShieldTargetId = null;
    modernState.mantriShieldSuccess = false;
    modernState.mantriProtectedThief = false;
    modernState.rajaGuessId = null;
    modernState.rajaGuessSuccess = false;
    modernState.raniGuessId = null;
    modernState.raniGuessSuccess = false;
    modernState.policeGuessId = null;
    modernState.policeGuessSuccess = false;
    modernState.villagerChoice = null;
    modernState.villagerBonusEarned = false;
    modernState.villagerBonusType = "none";

    const roleList = ["Raja", "Rani", "Police", "Thief", "Mantri", "Villager"];
    const shuffledRoles = shuffle(roleList);

    const baseScores = {
      Raja: 1000,
      Rani: 800,
      Police: 500,
      Thief: 0,
      Mantri: 700,
      Villager: 400,
    };

    modernState.players.forEach((p, index) => {
      const assignedRole = shuffledRoles[index];
      p.role = assignedRole;
      p.baseScore = baseScores[assignedRole];
      p.score = baseScores[assignedRole];
      p.lootedPoints = 0;
      p.preventedLoot = 0;
      p.bonusPoints = 0;
      p.penaltyPoints = 0;
      p.roundScore = 0;
      p.hasSubmittedAction = false;
      p.isShielded = false;
    });

    return modernState;
  }

  /**
   * Mantri Loot & Protection Resolution
   */
  static executeLootPhase(modernState) {
    const mantri = modernState.players.find((p) => p.role === "Mantri");
    const thief = modernState.players.find((p) => p.role === "Thief");
    const protectedPlayer = modernState.mantriShieldTargetId
      ? modernState.players.find((p) => p.id === modernState.mantriShieldTargetId)
      : null;

    if (protectedPlayer) {
      protectedPlayer.isShielded = true;
    }

    if (protectedPlayer && thief && protectedPlayer.id === thief.id) {
      modernState.mantriShieldSuccess = false;
      modernState.mantriProtectedThief = true;

      let stolenTotal = 0;
      modernState.players.forEach((p) => {
        if (p.role !== "Thief") {
          const stolenAmount = Math.floor(p.baseScore * 0.5);
          p.score -= stolenAmount;
          p.lootedPoints = stolenAmount;
          stolenTotal += stolenAmount;
        }
      });
      if (thief) {
        thief.score = stolenTotal;
        thief.lootedPoints = stolenTotal;
      }
    } else if (protectedPlayer) {
      modernState.mantriShieldSuccess = true;
      modernState.mantriProtectedThief = false;

      let stolenTotal = 0;
      modernState.players.forEach((p) => {
        if (p.role !== "Thief" && p.id !== protectedPlayer.id) {
          const stolenAmount = Math.floor(p.baseScore * 0.5);
          p.score -= stolenAmount;
          p.lootedPoints = stolenAmount;
          stolenTotal += stolenAmount;
        } else if (p.id === protectedPlayer.id) {
          p.lootedPoints = 0;
          p.preventedLoot = Math.floor(p.baseScore * 0.5);
        }
      });
      if (thief) {
        thief.score = stolenTotal;
        thief.lootedPoints = stolenTotal;
      }
    } else {
      let stolenTotal = 0;
      modernState.players.forEach((p) => {
        if (p.role !== "Thief") {
          const stolenAmount = Math.floor(p.baseScore * 0.5);
          p.score -= stolenAmount;
          p.lootedPoints = stolenAmount;
          stolenTotal += stolenAmount;
        }
      });
      if (thief) {
        thief.score = stolenTotal;
        thief.lootedPoints = stolenTotal;
      }
      modernState.mantriShieldSuccess = false;
      modernState.mantriProtectedThief = false;
    }

    return modernState;
  }

  /**
   * Evaluates final match results and scores for all 6 players.
   */
  static finalizeMatchResults(modernState) {
    if (modernState.isRoundFinalized && modernState.lastRoundResultData) {
      return modernState.lastRoundResultData;
    }
    modernState.isRoundFinalized = true;

    const raja = modernState.players.find((p) => p.role === "Raja");
    const rani = modernState.players.find((p) => p.role === "Rani");
    const police = modernState.players.find((p) => p.role === "Police");
    const thief = modernState.players.find((p) => p.role === "Thief");
    const mantri = modernState.players.find((p) => p.role === "Mantri");
    const villager = modernState.players.find((p) => p.role === "Villager");

    // 1. Raja Intuition Check
    if (raja) {
      if (modernState.rajaGuessId && rani && modernState.rajaGuessId === rani.id) {
        modernState.rajaGuessSuccess = true;
        raja.bonusPoints += 100;
      }
    }

    // 2. Rani Intuition Check
    if (rani) {
      if (modernState.raniGuessId && raja && modernState.raniGuessId === raja.id) {
        modernState.raniGuessSuccess = true;
        rani.bonusPoints += 100;
      }
    }

    // 3. Mantri Shield Support Bonus
    if (mantri && modernState.mantriShieldSuccess) {
      mantri.bonusPoints += 100;
    }

    // 4. Police Investigation Check
    if (police && thief) {
      if (modernState.policeGuessId && modernState.policeGuessId === thief.id) {
        modernState.policeGuessSuccess = true;

        police.score = 500;
        police.bonusPoints += 100;

        thief.score = 0;

        modernState.players.forEach((p) => {
          if (["Raja", "Rani", "Mantri", "Villager"].includes(p.role)) {
            if (p.lootedPoints > 0) {
              p.score += p.lootedPoints;
            }
          }
        });
      } else {
        modernState.policeGuessSuccess = false;
        police.score = 0;
      }
    }

    // 5. Villager Witness Statement Bonus Check
    if (villager) {
      if (modernState.policeGuessSuccess && modernState.villagerChoice === "agree") {
        modernState.villagerBonusEarned = true;
        modernState.villagerBonusType = "witness";
        villager.bonusPoints += 100;
      } else if (!modernState.policeGuessSuccess && modernState.villagerChoice === "disagree") {
        modernState.villagerBonusEarned = true;
        modernState.villagerBonusType = "insight";
        villager.bonusPoints += 100;
      } else {
        modernState.villagerBonusEarned = false;
        modernState.villagerBonusType = "none";
      }
    }

    // Calculate round scores and update cumulative total scores
    modernState.players.forEach((p) => {
      p.roundScore = p.score + p.bonusPoints - p.penaltyPoints;
      p.cumulativeScore = (p.cumulativeScore || 0) + p.roundScore;
      p.finalScore = p.cumulativeScore;
      if (!p.roundHistory) p.roundHistory = [];
      p.roundHistory.push({
        round: modernState.currentRound,
        roundScore: p.roundScore,
        bonusPoints: p.bonusPoints,
      });
    });

    // Check game over condition
    let isGameOver = false;
    if (modernState.winCondition === "target_score") {
      const hasReachedTarget = modernState.players.some((p) => p.cumulativeScore >= modernState.targetScore);
      isGameOver = hasReachedTarget || modernState.currentRound >= 10;
    } else {
      isGameOver = modernState.currentRound >= modernState.totalRounds;
    }

    modernState.isGameOver = isGameOver;

    // Sort by cumulative score descending
    const sorted = [...modernState.players].sort((a, b) => b.cumulativeScore - a.cumulativeScore);

    sorted.forEach((p, index) => {
      p.rank = index + 1;
      p.isWinner = index === 0;

      const awards = [];
      if (index === 0) awards.push("Champion");
      if (p.role === "Raja" && modernState.rajaGuessSuccess) awards.push("Royal Genius");
      if (p.role === "Rani" && modernState.raniGuessSuccess) awards.push("Royal Genius");
      if (p.role === "Police" && modernState.policeGuessSuccess) awards.push("Master Detective");
      if (p.role === "Thief" && !modernState.policeGuessSuccess) awards.push("Escape Artist");
      if (p.role === "Villager" && modernState.villagerBonusEarned) awards.push("Trusted Witness");
      if (p.role === "Mantri" && modernState.mantriShieldSuccess) awards.push("Royal Guardian");

      p.awards = awards;
    });

    const winner = sorted[0];

    const roundResultData = {
      currentRound: modernState.currentRound,
      totalRounds: modernState.totalRounds,
      winCondition: modernState.winCondition,
      targetScore: modernState.targetScore,
      isGameOver,
      rajaResult: {
        targetId: modernState.rajaGuessId,
        targetName: modernState.rajaGuessId
          ? modernState.players.find((p) => p.id === modernState.rajaGuessId)?.name || null
          : null,
        isCorrect: modernState.rajaGuessSuccess,
        bonusEarned: modernState.rajaGuessSuccess ? 100 : 0,
      },
      raniResult: {
        targetId: modernState.raniGuessId,
        targetName: modernState.raniGuessId
          ? modernState.players.find((p) => p.id === modernState.raniGuessId)?.name || null
          : null,
        isCorrect: modernState.raniGuessSuccess,
        bonusEarned: modernState.raniGuessSuccess ? 100 : 0,
      },
      policeResult: {
        policeId: police ? police.id : "",
        policeName: police ? police.name : "",
        guessedId: modernState.policeGuessId,
        guessedName: modernState.policeGuessId
          ? modernState.players.find((p) => p.id === modernState.policeGuessId)?.name || null
          : null,
        thiefId: thief ? thief.id : "",
        thiefName: thief ? thief.name : "",
        isCorrect: modernState.policeGuessSuccess,
        catchBonus: modernState.policeGuessSuccess ? 100 : 0,
      },
      villagerResult: {
        villagerId: villager ? villager.id : "",
        villagerName: villager ? villager.name : "",
        choice: modernState.villagerChoice,
        isBonusEarned: modernState.villagerBonusEarned,
        bonusType: modernState.villagerBonusType,
        bonusPoints: modernState.villagerBonusEarned ? 100 : 0,
      },
      mantriResult: {
        mantriId: mantri ? mantri.id : "",
        mantriName: mantri ? mantri.name : "",
        protectedTargetRole: modernState.mantriShieldTargetId
          ? modernState.players.find((p) => p.id === modernState.mantriShieldTargetId)?.role || null
          : null,
        protectedTargetName: modernState.mantriShieldTargetId
          ? modernState.players.find((p) => p.id === modernState.mantriShieldTargetId)?.name || null
          : null,
        isShieldSuccessful: modernState.mantriShieldSuccess,
        protectedThief: !!modernState.mantriProtectedThief,
        supportBonus: modernState.mantriShieldSuccess ? 100 : 0,
      },
      thiefResult: {
        thiefId: thief ? thief.id : "",
        thiefName: thief ? thief.name : "",
        escaped: !modernState.policeGuessSuccess,
        stolenTotal: thief ? thief.lootedPoints : 0,
        finalThiefScore: thief ? thief.finalScore : 0,
      },
      scores: sorted.map((p) => ({
        playerId: p.id,
        name: p.name,
        role: p.role,
        baseScore: p.baseScore,
        lootedPoints: p.lootedPoints,
        preventedLoot: p.preventedLoot,
        bonusPoints: p.bonusPoints,
        totalBonusPoints: p.roundHistory ? p.roundHistory.reduce((acc, r) => acc + (r.bonusPoints || 0), 0) : p.bonusPoints,
        penaltyPoints: p.penaltyPoints,
        roundScore: p.roundScore,
        cumulativeScore: p.cumulativeScore,
        finalScore: p.cumulativeScore,
        roundHistory: p.roundHistory || [],
        awards: p.awards,
        rank: p.rank,
      })),
      winner: {
        playerId: winner.id,
        name: winner.name,
        role: winner.role,
        score: winner.cumulativeScore,
      },
    };

    modernState.lastRoundResultData = roundResultData;
    return roundResultData;
  }

  /**
   * Persists match history, updates player stats, checks achievements, and awards XP.
   */
  static async recordMatch(roomCode, modernState, resultData) {
    try {
      if (!resultData || !resultData.isGameOver) {
        return;
      }

      const matchDuration = Math.round((Date.now() - (modernState.startTime || Date.now())) / 1000);

      // Auto-resolve missing or invalid player userIds for registered accounts
      for (const p of modernState.players) {
        if (!p.userId || !mongoose.Types.ObjectId.isValid(p.userId)) {
          try {
            const dbUser = await User.findOne({ username: p.name.trim(), isGuest: false });
            if (dbUser) {
              p.userId = dbUser._id;
            } else {
              p.userId = null;
              if (p.guestDeviceId) {
                GuestTrackingService.recordGuestMatchCompleted(p.guestDeviceId, p.name, "MODERN_MODE").catch(() => {});
              }
            }
          } catch (e) {
            console.error(`Failed to resolve user ID for ${p.name}:`, e);
          }
        }
      }

      // Save Match History
      const matchDoc = new ModernModeMatch({
        roomCode,
        players: modernState.players.map((p) => ({
          userId: p.userId || null,
          playerId: p.id,
          name: p.name,
          role: p.role,
          baseScore: p.baseScore,
          lootedPoints: p.lootedPoints,
          preventedLoot: p.preventedLoot,
          bonusPoints: p.bonusPoints,
          penaltyPoints: p.penaltyPoints,
          finalScore: p.finalScore,
          rank: p.rank,
          isWinner: p.isWinner,
          awards: p.awards,
        })),
        details: {
          mantriShieldTargetRole: resultData.mantriResult ? resultData.mantriResult.protectedTargetRole : null,
          mantriShieldTargetId: modernState.mantriShieldTargetId,
          mantriShieldSuccess: modernState.mantriShieldSuccess,
          rajaGuessId: modernState.rajaGuessId,
          rajaGuessSuccess: modernState.rajaGuessSuccess,
          raniGuessId: modernState.raniGuessId,
          raniGuessSuccess: modernState.raniGuessSuccess,
          policeGuessId: modernState.policeGuessId,
          policeGuessSuccess: modernState.policeGuessSuccess,
          villagerChoice: modernState.villagerChoice,
          villagerBonusEarned: modernState.villagerBonusEarned,
          villagerBonusType: modernState.villagerBonusType,
        },
        winnerId: resultData.winner ? resultData.winner.playerId : null,
        winnerName: resultData.winner ? resultData.winner.name : null,
        matchDuration,
      });

      await matchDoc.save();

      // Process Player Stats, Achievements, & XP for each player
      for (const p of modernState.players) {
        if (!p.userId) continue;

        let stats = await ModernModeStats.findOne({ userId: p.userId });
        if (!stats) {
          stats = new ModernModeStats({
            userId: p.userId,
            username: p.name,
          });
        }

        stats.gamesPlayed += 1;
        if (p.isWinner) {
          stats.gamesWon += 1;
          stats.currentWinStreak += 1;
          if (stats.currentWinStreak > stats.longestWinStreak) {
            stats.longestWinStreak = stats.currentWinStreak;
          }
        } else {
          stats.currentWinStreak = 0;
        }

        stats.totalScore += (p.finalScore || 0);
        if ((p.finalScore || 0) > stats.highestScore) {
          stats.highestScore = p.finalScore;
        }
        stats.totalMatchDuration += matchDuration;

        // Role counts
        if (p.role === "Raja") {
          stats.timesRaja += 1;
          if (modernState.rajaGuessSuccess) stats.correctRajaGuesses += 1;
        } else if (p.role === "Rani") {
          stats.timesRani += 1;
          if (modernState.raniGuessSuccess) stats.correctRaniGuesses += 1;
        } else if (p.role === "Police") {
          stats.timesPolice += 1;
          if (modernState.policeGuessSuccess) stats.policeCatches += 1;
          else stats.policeWrongGuesses += 1;
        } else if (p.role === "Thief") {
          stats.timesThief += 1;
          if (!modernState.policeGuessSuccess) stats.thiefEscapes += 1;
        } else if (p.role === "Mantri") {
          stats.timesMantri += 1;
          if (modernState.mantriShieldSuccess) {
            stats.mantriShieldSuccesses += 1;
            stats.mantriSupportBonusTotal = (stats.mantriSupportBonusTotal || 0) + 100;
            stats.mantriKingdomPointsSaved = (stats.mantriKingdomPointsSaved || 0) + 100;
          } else {
            stats.mantriShieldFailures = (stats.mantriShieldFailures || 0) + 1;
          }
          if (modernState.mantriProtectedThief) {
            stats.mantriProtectedThiefCount = (stats.mantriProtectedThiefCount || 0) + 1;
          }
        } else if (p.role === "Villager") {
          stats.timesVillager += 1;
          if (modernState.villagerBonusEarned) {
            if (modernState.villagerBonusType === "witness") stats.villagerWitnessBonuses += 1;
            else if (modernState.villagerBonusType === "insight") stats.villagerInsightBonuses += 1;
          }
        }

        await stats.save();

        // Check & Award Modern Mode Achievements
        await this.checkAchievements(p.userId, stats);

        // Calculate and award XP
        const xpEarned = calculateModernModeXP({
          finalScore: p.finalScore || 0,
          isWinner: p.isWinner,
          isBonusEarned: (p.bonusPoints || 0) > 0,
        });
        await awardModernModeXP(p.userId, xpEarned, p.name);
      }
    } catch (err) {
      console.error("Error recording Modern Mode match:", err);
    }
  }

  /**
   * Checks and awards Modern Mode achievements for a player.
   */
  static async checkAchievements(userId, stats) {
    try {
      const achievementsToTest = [
        { id: "ROYAL_GUARDIAN", condition: (stats.mantriShieldSuccesses || 0) >= 10 },
        { id: "KINGDOM_SAVIOR", condition: (stats.mantriKingdomPointsSaved || 0) >= 1000 },
        { id: "TRUSTED_MINISTER", condition: stats.gamesPlayed >= 20 && ((stats.mantriShieldSuccesses || 0) / (stats.timesMantri || 1)) >= 0.8 },
        { id: "MISGUIDED_ADVISOR", condition: (stats.mantriProtectedThiefCount || 0) >= 5 },
        { id: "ROYAL_GENIUS", condition: stats.correctRajaGuesses >= 10 },
        { id: "QUEENS_INTUITION", condition: stats.correctRaniGuesses >= 10 },
        { id: "MASTER_DETECTIVE", condition: stats.policeCatches >= 25 },
        { id: "ESCAPE_ARTIST", condition: stats.thiefEscapes >= 20 },
        { id: "TRUSTED_WITNESS", condition: stats.villagerWitnessBonuses + stats.villagerInsightBonuses >= 20 },
      ];

      for (const item of achievementsToTest) {
        if (item.condition) {
          const exists = await ModernModeAchievement.findOne({ userId, achievementId: item.id });
          if (!exists) {
            await ModernModeAchievement.create({ userId, achievementId: item.id });
          }
        }
      }
    } catch (err) {
      console.error("Error checking Modern Mode achievements:", err);
    }
  }
}

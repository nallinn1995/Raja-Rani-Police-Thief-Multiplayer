import mongoose from "mongoose";
import User from "../models/User.js";
import PoliceThiefRoundHistory from "../models/PoliceThiefRoundHistory.js";
import PoliceThiefMatchHistory from "../models/PoliceThiefMatchHistory.js";
import { PoliceThiefStatsService } from "./PoliceThiefStatsService.js";
import { AchievementService } from "./AchievementService.js";
import { PoliceThiefLeaderboardService } from "./PoliceThiefLeaderboardService.js";

export class PoliceThiefService {
  static async recordRound(roundData) {
    try {
      const {
        roomCode,
        roundNumber,
        policeUserId,
        policeName,
        actualThiefUserId,
        actualThiefName,
        guessedUserId,
        guessedName,
        isCorrect,
        guessTime,
      } = roundData;

      const roundHistory = new PoliceThiefRoundHistory({
        roomCode,
        roundNumber,
        policeUserId: policeUserId && mongoose.Types.ObjectId.isValid(policeUserId) ? policeUserId : undefined,
        policeName,
        actualThiefUserId: actualThiefUserId && mongoose.Types.ObjectId.isValid(actualThiefUserId) ? actualThiefUserId : undefined,
        actualThiefName,
        guessedUserId: guessedUserId && mongoose.Types.ObjectId.isValid(guessedUserId) ? guessedUserId : undefined,
        guessedName,
        isCorrect,
        guessTime: guessTime || 0,
      });

      await roundHistory.save();
      return roundHistory;
    } catch (err) {
      console.error("Error in PoliceThiefService.recordRound:", err);
      return null;
    }
  }

  static async finalizeMatch(matchData) {
    try {
      const { roomCode, totalRounds, duration, players, roundSummaries } = matchData;
      if (!players || !Array.isArray(players)) return null;

      // Sort players by detective score & accuracy to determine Champion
      const sortedPlayers = [...players].sort((a, b) => {
        const scoreA = a.detectiveScore ?? a.correctCatches ?? 0;
        const scoreB = b.detectiveScore ?? b.correctCatches ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.accuracy || 0) - (a.accuracy || 0);
      });

      const champion = sortedPlayers[0];

      const matchPlayers = players.map((p) => {
        const pName = p.name || p.username;
        const isChamp = champion ? pName === (champion.name || champion.username) : false;
        return {
          userId: p.userId || null,
          username: pName,
          rank: sortedPlayers.findIndex((sp) => (sp.name || sp.username) === pName) + 1,
          isChampion: isChamp,
          correctCatches: p.correctCatches || 0,
          wrongGuesses: p.wrongGuesses || 0,
          policeAccuracy: p.accuracy || 0,
          policeTurnsCompleted: p.policeTurnsCompleted || 0,
          thiefEscaped: p.thiefEscaped || 0,
          thiefCaught: p.thiefCaught || 0,
          escapeRate: p.escapeRate || 0,
          fastestCatch: p.fastestCatch || 0,
          title: p.title || "Recruit Detective",
          score: p.detectiveScore || p.score || 0,
        };
      });

      // Save match history
      const match = new PoliceThiefMatchHistory({
        roomCode,
        totalRounds: totalRounds || 1,
        duration: duration || 0,
        championUserId: champion?.userId && mongoose.Types.ObjectId.isValid(champion.userId) ? champion.userId : undefined,
        championUsername: champion ? (champion.name || champion.username) : "None",
        players: matchPlayers,
        roundSummaries: roundSummaries || [],
      });
      await match.save();

      // Update statistics for all registered players
      for (const p of matchPlayers) {
        try {
          let user = null;
          const targetId = p.userId || p.id;
          if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
            user = await User.findById(targetId);
          }
          if (!user && (p.username || p.name)) {
            const nameToSearch = String(p.username || p.name).trim();
            user = await User.findOne({ username: new RegExp(`^${nameToSearch}$`, "i") });
          }

          if (!user || user.isGuest) continue;

          const stats = await PoliceThiefStatsService.updateStatsForMatchPlayer(
            user,
            p,
            duration || 0,
            totalRounds || 1
          );

          if (stats) {
            await AchievementService.evaluateAndAward(user._id, stats, p);
          }
        } catch (pErr) {
          console.error(`Error updating stats for match player ${p.username}:`, pErr);
        }
      }

      // Refresh top detective leaderboard cache
      PoliceThiefLeaderboardService.refreshLeaderboard("top_detective", 50).catch(() => {});

      return match;
    } catch (err) {
      console.error("Error in PoliceThiefService.finalizeMatch:", err);
      return null;
    }
  }
}

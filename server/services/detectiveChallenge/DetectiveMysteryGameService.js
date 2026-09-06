import mongoose from "mongoose";
import User from "../../models/User.js";
import DetectiveChallengeMatch from "../../models/detectiveChallenge/DetectiveChallengeMatch.js";
import DetectiveChallengeStats from "../../models/detectiveChallenge/DetectiveChallengeStats.js";
import MatchHistory from "../../models/MatchHistory.js";
import PlayerStats from "../../models/PlayerStats.js";
import { DetectiveChallengeStatsService } from "./DetectiveChallengeStatsService.js";
import { DetectiveChallengeService } from "./DetectiveChallengeService.js";
import GuestTrackingService from "../GuestTrackingService.js";
import gameNotificationService from "../gameNotificationService.js";
import { checkAchievements } from "../../controllers/statsController.js";

export const DETECTIVE_CONFIG = {
  TOTAL_DOORS: 10,
  THIEF_DOORS: 1,
  SAFE_DOORS: 4,
  BOMB_DOORS: 3,
  CLUE_DOORS: 1,
  LIFE_DOORS: 1,
  STARTING_LIVES: 3,
  GAME_DURATION: 60, // seconds
};

// In-memory active detective games: roomCode -> DetectiveMysteryGame
const activeGames = new Map();

export class DetectiveMysteryGameService {
  /**
   * Generates a fresh random door mapping on the server.
   * Exactly 10 doors: 1 Thief, 4 Safe, 3 Bombs, 1 Clue, 1 Life.
   */
  static generateDoors() {
    const doorIds = Array.from({ length: DETECTIVE_CONFIG.TOTAL_DOORS }, (_, i) => i + 1);
    
    // Shuffle array using Fisher-Yates
    for (let i = doorIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [doorIds[i], doorIds[j]] = [doorIds[j], doorIds[i]];
    }

    const thiefDoor = doorIds[0];
    const bombDoors = new Set(doorIds.slice(1, 1 + DETECTIVE_CONFIG.BOMB_DOORS));
    const clueDoor = doorIds[1 + DETECTIVE_CONFIG.BOMB_DOORS];
    const lifeDoor = doorIds[1 + DETECTIVE_CONFIG.BOMB_DOORS + DETECTIVE_CONFIG.CLUE_DOORS];

    const mapping = new Map();
    for (let i = 1; i <= DETECTIVE_CONFIG.TOTAL_DOORS; i++) {
      if (i === thiefDoor) {
        mapping.set(i, "THIEF");
      } else if (bombDoors.has(i)) {
        mapping.set(i, "BOMB");
      } else if (i === clueDoor) {
        mapping.set(i, "CLUE");
      } else if (i === lifeDoor) {
        mapping.set(i, "LIFE");
      } else {
        mapping.set(i, "SAFE");
      }
    }

    // Dynamic row/column riddle for the Thief in 5x2 matrix
    // Row 1: doors 1-5, Row 2: doors 6-10
    const thiefRow = thiefDoor <= 5 ? 1 : 2;
    // Column 1..5: (door - 1) % 5 + 1
    const thiefCol = ((thiefDoor - 1) % 5) + 1;
    const colOtherDoor = thiefRow === 1 ? thiefDoor + 5 : thiefDoor - 5;
    const d1Str = thiefDoor < 10 ? `0${thiefDoor}` : `${thiefDoor}`;
    const d2Str = colOtherDoor < 10 ? `0${colOtherDoor}` : `${colOtherDoor}`;

    const riddles = [
      thiefRow === 1
        ? "The Thief is hiding on the First Row (Doors 01–05)!"
        : "The Thief is hiding on the Second Row (Doors 06–10)!",
      thiefRow === 1
        ? "Footsteps echo from the Northern Chamber (First Row)!"
        : "Shadows detected along the Southern Chamber (Second Row)!",
      `Suspicious activity spotted in Column ${thiefCol} (Doors ${d1Str} or ${d2Str})!`,
      thiefCol <= 2
        ? "The Thief was glimpsed fleeing towards the Left Wing (Columns 1–2)!"
        : thiefCol === 3
        ? "Mysterious echoes resonate from the Center Column (Column 3)!"
        : "A cold draft blows from the Right Wing (Columns 4–5)!",
    ];

    const riddle = riddles[Math.floor(Math.random() * riddles.length)];

    return {
      thiefDoor,
      bombDoors: Array.from(bombDoors),
      clueDoor,
      lifeDoor,
      riddle,
      mapping,
    };
  }

  /**
   * Initializes and starts a new Detective Mystery game in a room.
   */
  static startGame(roomCode, players, io) {
    const upperCode = roomCode.toUpperCase();
    const existing = activeGames.get(upperCode);
    if (existing?.timerTimeout) {
      clearTimeout(existing.timerTimeout);
    }

    const secretLayout = this.generateDoors();
    const now = Date.now();
    const endsAt = now + DETECTIVE_CONFIG.GAME_DURATION * 1000;

    const playerStates = new Map();
    players.forEach((p) => {
      playerStates.set(p.id, {
        id: p.id,
        userId: p.userId || null,
        guestDeviceId: p.guestDeviceId || null,
        name: p.name,
        avatar: p.avatar || "1",
        lives: DETECTIVE_CONFIG.STARTING_LIVES,
        attempts: 0,
        bombsTriggered: 0,
        safeDoorsFound: 0,
        revealedDoors: new Map(), // doorId -> result ("SAFE" | "BOMB" | "THIEF")
        status: "INVESTIGATING", // "INVESTIGATING" | "CAUGHT" | "ELIMINATED" | "TIMEOUT"
        caughtAt: null,
        investigationTimeMs: null,
        finalScore: 0,
        rank: 0,
        isProcessing: false,
      });
    });

    const game = {
      roomCode: upperCode,
      status: "ACTIVE", // "ACTIVE" | "FINISHED"
      startedAt: now,
      endsAt,
      duration: DETECTIVE_CONFIG.GAME_DURATION,
      secretLayout,
      players: playerStates,
      io,
      timerTimeout: null,
    };

    // Server-authoritative timer
    game.timerTimeout = setTimeout(() => {
      this.handleTimerExpired(upperCode);
    }, DETECTIVE_CONFIG.GAME_DURATION * 1000);

    activeGames.set(upperCode, game);

    // Broadcast public start state to clients (NEVER revealing secretLayout)
    const publicState = this.getPublicGameState(game);
    io.to(upperCode).emit("detective:gameStarted", publicState);

    console.log(`[DetectiveMystery] Started game in ${upperCode}. Thief Door: #${secretLayout.thiefDoor}`);
    return game;
  }

  /**
   * Returns sanitized public game state (no hidden mappings).
   */
  static getPublicGameState(game) {
    const remainingSeconds = Math.max(0, Math.ceil((game.endsAt - Date.now()) / 1000));
    
    const playersList = Array.from(game.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      lives: p.lives,
      attempts: p.attempts,
      bombsTriggered: p.bombsTriggered,
      safeDoorsFound: p.safeDoorsFound,
      status: p.status,
      investigationTimeMs: p.investigationTimeMs,
    }));

    return {
      roomCode: game.roomCode,
      status: game.status,
      startedAt: game.startedAt,
      endsAt: game.endsAt,
      remainingSeconds,
      totalDoors: DETECTIVE_CONFIG.TOTAL_DOORS,
      totalBombs: DETECTIVE_CONFIG.BOMB_DOORS,
      totalSafe: DETECTIVE_CONFIG.SAFE_DOORS,
      totalClues: DETECTIVE_CONFIG.CLUE_DOORS,
      totalLife: DETECTIVE_CONFIG.LIFE_DOORS,
      players: playersList,
    };
  }

  /**
   * Validates and resolves an open-door action sent by a player.
   */
  static async openDoor(roomCode, playerId, doorId, socket) {
    const upperCode = roomCode.toUpperCase();
    const game = activeGames.get(upperCode);

    if (!game) {
      socket.emit("detective:error", { message: "Active detective game not found." });
      return;
    }

    if (game.status !== "ACTIVE") {
      socket.emit("detective:error", { message: "Game has already finished." });
      return;
    }

    if (Date.now() > game.endsAt) {
      socket.emit("detective:error", { message: "Investigation time has expired." });
      return;
    }

    const player = game.players.get(playerId);
    if (!player) {
      socket.emit("detective:error", { message: "Player not found in active investigation." });
      return;
    }

    if (player.status !== "INVESTIGATING") {
      socket.emit("detective:error", { message: `Cannot open door. You are currently ${player.status}.` });
      return;
    }

    if (player.lives <= 0) {
      socket.emit("detective:error", { message: "You have run out of lives." });
      return;
    }

    const numDoorId = parseInt(doorId, 10);
    if (isNaN(numDoorId) || numDoorId < 1 || numDoorId > DETECTIVE_CONFIG.TOTAL_DOORS) {
      socket.emit("detective:error", { message: "Invalid door ID." });
      return;
    }

    if (player.revealedDoors.has(numDoorId)) {
      socket.emit("detective:error", { message: "Door already investigated by you." });
      return;
    }

    if (player.isProcessing) {
      return; // prevent rapid double clicks
    }

    player.isProcessing = true;

    try {
      // Determine door outcome authoritatively
      const outcome = game.secretLayout.mapping.get(numDoorId) || "SAFE";
      player.attempts += 1;
      player.revealedDoors.set(numDoorId, outcome);

      let investigationTimeMs = null;
      let clue = null;

      if (outcome === "SAFE") {
        player.safeDoorsFound += 1;
      } else if (outcome === "BOMB") {
        player.bombsTriggered += 1;
        player.lives = Math.max(0, player.lives - 1);
        if (player.lives === 0) {
          player.status = "ELIMINATED";
        }
      } else if (outcome === "LIFE") {
        player.lives += 1; // grant extra life
      } else if (outcome === "CLUE") {
        clue = game.secretLayout.riddle;
      } else if (outcome === "THIEF") {
        player.status = "CAUGHT";
        player.caughtAt = Date.now();
        player.investigationTimeMs = Math.max(0, player.caughtAt - game.startedAt);
        investigationTimeMs = player.investigationTimeMs;
      }

      // 1. Send private outcome exclusively to requesting player
      socket.emit("detective:doorResult", {
        doorId: numDoorId,
        result: outcome,
        clue,
        livesRemaining: player.lives,
        attempts: player.attempts,
        safeDoorsFound: player.safeDoorsFound,
        bombsTriggered: player.bombsTriggered,
        status: player.status,
        investigationTimeMs,
      });

      // 2. Broadcast public status update to room
      game.io.to(upperCode).emit("detective:playerUpdated", {
        playerId: player.id,
        name: player.name,
        lives: player.lives,
        attempts: player.attempts,
        safeDoorsFound: player.safeDoorsFound,
        bombsTriggered: player.bombsTriggered,
        status: player.status,
        investigationTimeMs,
      });

      console.log(`[DetectiveMystery] ${player.name} opened Door #${numDoorId} -> ${outcome} (Lives: ${player.lives})`);

      // 3. Check if all players in room are now resolved
      const allResolved = Array.from(game.players.values()).every(
        (p) => p.status === "CAUGHT" || p.status === "ELIMINATED"
      );

      if (allResolved) {
        console.log(`[DetectiveMystery] All players in ${upperCode} resolved! Finalizing match.`);
        this.finishGame(upperCode);
      }
    } finally {
      player.isProcessing = false;
    }
  }

  /**
   * Handles timer expiration when global 60s countdown hits 0.
   */
  static handleTimerExpired(roomCode) {
    const game = activeGames.get(roomCode);
    if (!game || game.status !== "ACTIVE") return;

    console.log(`[DetectiveMystery] 60s Timer expired for room ${roomCode}`);
    // Any player still investigating is timed out
    game.players.forEach((p) => {
      if (p.status === "INVESTIGATING") {
        p.status = "TIMEOUT";
      }
    });

    this.finishGame(roomCode);
  }

  /**
   * Calculates official scores using the specified 100-point scoring formula:
   * - Accuracy Score: 40 points
   * - Time Score: 30 points
   * - Lives Score: 20 points
   * - Efficiency Score: 10 points
   */
  static calculateScoresAndRanks(game) {
    const entries = Array.from(game.players.values()).map((p) => {
      const isCaught = p.status === "CAUGHT";
      const durationSec = DETECTIVE_CONFIG.GAME_DURATION;
      const invSec = p.investigationTimeMs ? p.investigationTimeMs / 1000 : durationSec;

      // 1. Accuracy Score (40 pts)
      // Accuracy = 1 / attempts. Accuracy Score = accuracy percentage * 40
      let accuracyPercent = 0;
      let accuracyScore = 0;
      if (isCaught && p.attempts > 0) {
        accuracyPercent = (1 / p.attempts) * 100;
        accuracyScore = (accuracyPercent / 100) * 40;
      }

      // 2. Time Score (30 pts)
      // timeScore = max(0, 30 * (gameDuration - investigationTime) / gameDuration)
      let timeScore = 0;
      if (isCaught) {
        timeScore = Math.max(0, 30 * ((durationSec - invSec) / durationSec));
      }

      // 3. Lives Score (20 pts)
      // 3 lives = 20, 2 lives = 13, 1 life = 7, 0 lives = 0
      let livesScore = 0;
      if (p.lives >= 3) livesScore = 20;
      else if (p.lives === 2) livesScore = 13;
      else if (p.lives === 1) livesScore = 7;
      else livesScore = 0;

      // 4. Efficiency Score (10 pts)
      // efficiencyScore = max(0, 10 - ((attempts - 1) * 1.5))
      let efficiencyScore = 0;
      if (p.attempts > 0) {
        efficiencyScore = Math.max(0, 10 - ((p.attempts - 1) * 1.5));
      }

      // Final Score (capped at 100)
      const rawTotal = accuracyScore + timeScore + livesScore + efficiencyScore;
      const finalScore = parseFloat(Math.min(100, Math.max(0, rawTotal)).toFixed(2));

      return {
        player: p,
        isCaught,
        accuracyPercent: parseFloat(accuracyPercent.toFixed(1)),
        accuracyScore: parseFloat(accuracyScore.toFixed(2)),
        timeScore: parseFloat(timeScore.toFixed(2)),
        livesScore: parseFloat(livesScore.toFixed(2)),
        efficiencyScore: parseFloat(efficiencyScore.toFixed(2)),
        finalScore,
        investigationTimeSec: p.investigationTimeMs ? parseFloat(invSec.toFixed(2)) : null,
      };
    });

    // Deterministic Tie-Breaker Ordering:
    // 1. CAUGHT status
    // 2. Higher final score
    // 3. Lower investigation time
    // 4. Higher accuracy
    // 5. More lives remaining
    // 6. Fewer attempts
    // 7. Earlier catch timestamp
    entries.sort((a, b) => {
      if (a.isCaught !== b.isCaught) return a.isCaught ? -1 : 1;
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;

      const aTime = a.player.investigationTimeMs ?? 999999;
      const bTime = b.player.investigationTimeMs ?? 999999;
      if (aTime !== bTime) return aTime - bTime;

      if (b.accuracyPercent !== a.accuracyPercent) return b.accuracyPercent - a.accuracyPercent;
      if (b.player.lives !== a.player.lives) return b.player.lives - a.player.lives;
      if (a.player.attempts !== b.player.attempts) return a.player.attempts - b.player.attempts;

      const aCatch = a.player.caughtAt ?? 9999999999999;
      const bCatch = b.player.caughtAt ?? 9999999999999;
      return aCatch - bCatch;
    });

    // Assign rank
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
      e.player.rank = idx + 1;
      e.player.finalScore = e.finalScore;
    });

    return entries;
  }

  /**
   * Finalizes the match, persists data to DB, and emits final leaderboard.
   */
  static async finishGame(roomCode) {
    const game = activeGames.get(roomCode);
    if (!game || game.status === "FINISHED") return;

    game.status = "FINISHED";
    if (game.timerTimeout) {
      clearTimeout(game.timerTimeout);
      game.timerTimeout = null;
    }

    const leaderboardEntries = this.calculateScoresAndRanks(game);
    const championEntry = leaderboardEntries[0];

    const finalLeaderboard = leaderboardEntries.map((e) => ({
      rank: e.rank,
      id: e.player.id,
      name: e.player.name,
      avatar: e.player.avatar,
      status: e.player.status,
      finalScore: e.finalScore,
      investigationTimeSec: e.investigationTimeSec,
      accuracyPercent: e.accuracyPercent,
      livesRemaining: e.player.lives,
      attempts: e.player.attempts,
      bombsTriggered: e.player.bombsTriggered,
      safeDoorsFound: e.player.safeDoorsFound,
      breakdown: {
        accuracyScore: e.accuracyScore,
        timeScore: e.timeScore,
        livesScore: e.livesScore,
        efficiencyScore: e.efficiencyScore,
      },
    }));

    // Broadcast completion to all players
    game.io.to(roomCode).emit("detective:gameFinished", {
      roomCode,
      leaderboard: finalLeaderboard,
      champion: championEntry ? {
        id: championEntry.player.id,
        name: championEntry.player.name,
        finalScore: championEntry.finalScore,
        status: championEntry.player.status,
      } : null,
      secretLayout: {
        thiefDoor: game.secretLayout.thiefDoor,
        bombDoors: game.secretLayout.bombDoors,
      },
    });

    console.log(`[DetectiveMystery] Match finished in ${roomCode}. Winner: ${championEntry?.player?.name} (${championEntry?.finalScore} pts)`);

    if (championEntry?.player?.userId) {
      gameNotificationService.dispatchDetectiveVictory({
        userId: championEntry.player.userId,
        username: championEntry.player.name,
        roomCode: game.roomCode,
        score: Math.round(championEntry.finalScore),
      });
    }

    // Asynchronously persist match history & stats
    this.persistMatchResults(game, leaderboardEntries).catch((err) => {
      console.error("[DetectiveMystery] Failed to persist match results:", err);
    });
  }

  /**
   * Persists match results into DetectiveChallengeMatch, MatchHistory, and PlayerStats.
   */
  static async persistMatchResults(game, leaderboardEntries) {
    try {
      const champion = leaderboardEntries[0];
      const matchDuration = Math.round((Date.now() - game.startedAt) / 1000);

      const dbPlayers = [];

      for (const e of leaderboardEntries) {
        const p = e.player;
        let userDoc = null;

        if (p.userId && mongoose.Types.ObjectId.isValid(p.userId)) {
          userDoc = await User.findById(p.userId);
        }
        if (!userDoc && p.userId) {
          userDoc = await User.findOne({ supabaseUid: p.userId });
        }
        if (!userDoc && p.name) {
          userDoc = await User.findOne({ username: new RegExp(`^${String(p.name).trim()}$`, "i") });
        }

        const resolvedUserId = userDoc ? userDoc._id : null;
        const isChampion = e.rank === 1 && p.status === "CAUGHT";

        dbPlayers.push({
          userId: resolvedUserId,
          username: p.name,
          rank: e.rank,
          isChampion,
          correctCount: p.status === "CAUGHT" ? 1 : 0,
          wrongCount: p.bombsTriggered,
          accuracy: e.accuracyPercent,
          avgGuessTime: e.investigationTimeSec || 0,
          fastestGuess: e.investigationTimeSec || 0,
          longestStreak: p.status === "CAUGHT" ? 1 : 0,
          finalScore: e.finalScore,
          attempts: p.attempts,
          bombsTriggered: p.bombsTriggered,
          safeDoorsFound: p.safeDoorsFound,
          livesRemaining: p.lives,
        });

        // Record guest analytics if applicable
        if (!resolvedUserId && p.guestDeviceId) {
          GuestTrackingService.recordGuestMatchCompleted(
            p.guestDeviceId,
            p.name,
            "DETECTIVE_CHALLENGE"
          ).catch(() => {});
        }

        // Update registered user stats & XP
        if (userDoc) {
          try {
            await DetectiveChallengeStatsService.updatePlayerStats(
              userDoc,
              {
                isChampion,
                correctCount: p.status === "CAUGHT" ? 1 : 0,
                wrongCount: p.bombsTriggered,
                accuracy: e.accuracyPercent,
                fastestGuess: e.investigationTimeSec || 0,
                score: e.finalScore,
              },
              matchDuration
            );

            // Synchronize overall PlayerStats
            await PlayerStats.updateOne(
              { userId: userDoc._id },
              {
                $set: { username: userDoc.username, lastPlayedAt: new Date() },
                $inc: {
                  totalGames: 1,
                  totalWins: isChampion ? 1 : 0,
                  totalLosses: isChampion ? 0 : 1,
                  totalTimePlayed: matchDuration,
                  totalScore: Math.round(e.finalScore || 0),
                  "policeMode.gamesPlayed": 1,
                  "policeMode.detectiveWins": isChampion ? 1 : 0,
                },
              },
              { upsert: true }
            ).catch(() => {});

            // Evaluate Detective Achievements
            const updatedPlayerStats = (await PlayerStats.findOne({ userId: userDoc._id })) || {};
            await checkAchievements(userDoc._id, updatedPlayerStats, {
              fastestCatch: e.investigationTimeSec,
              accuracy: e.accuracyPercent,
              correctCount: p.status === "CAUGHT" ? 1 : 0,
            }).catch(() => {});

            await DetectiveChallengeService.evaluateAchievements(
              userDoc._id,
              (await DetectiveChallengeStats.findOne({ userId: userDoc._id })) || {},
              {
                accuracy: e.accuracyPercent,
                correctCount: p.status === "CAUGHT" ? 1 : 0,
                livesRemaining: p.lives,
                bombsTriggered: p.bombsTriggered,
                fastestGuess: e.investigationTimeSec,
                finalScore: e.finalScore,
              }
            );
          } catch (statErr) {
            console.error(`[DetectiveMystery] Error updating stats for ${p.name}:`, statErr);
          }
        }
      }

      // 1. Save DetectiveChallengeMatch
      const detectiveMatch = new DetectiveChallengeMatch({
        roomCode: game.roomCode,
        totalRounds: 1,
        duration: matchDuration,
        championUserId: champion?.player.userId || null,
        championUsername: champion ? champion.player.name : "None",
        players: dbPlayers,
        roundLogs: [
          {
            roundNumber: 1,
            actualThiefCardId: `door-${game.secretLayout.thiefDoor}`,
            thiefName: `Door #${game.secretLayout.thiefDoor}`,
            playerSelections: leaderboardEntries.map((e) => ({
              username: e.player.name,
              selectedCardId: e.player.status === "CAUGHT" ? `door-${game.secretLayout.thiefDoor}` : "none",
              isCorrect: e.player.status === "CAUGHT",
              guessTime: e.investigationTimeSec || 0,
            })),
          },
        ],
        endedAt: new Date(),
      });
      await detectiveMatch.save();

      // 2. Save General MatchHistory for Profile and Admin Dashboard integration
      const generalMatch = new MatchHistory({
        roomCode: game.roomCode,
        gameMode: "DETECTIVE_CHALLENGE",
        totalRounds: 1,
        duration: matchDuration,
        winnerUsername: champion ? champion.player.name : "None",
        players: leaderboardEntries.map((e, idx) => ({
          userId: dbPlayers[idx]?.userId || (mongoose.Types.ObjectId.isValid(e.player.userId) ? e.player.userId : null),
          username: e.player.name,
          score: Math.round(e.finalScore * 10),
          rank: e.rank,
          isWinner: e.rank === 1,
          correctCatches: e.player.status === "CAUGHT" ? 1 : 0,
          wrongGuesses: e.player.bombsTriggered,
          accuracy: e.accuracyPercent,
          fastestCatch: e.investigationTimeSec || 0,
          title: e.player.status === "CAUGHT" ? "Master Detective" : "Investigator",
        })),
        roundSummaries: [
          {
            roundNumber: 1,
            policeName: champion ? champion.player.name : "All Detectives",
            actualThief: `Door #${game.secretLayout.thiefDoor}`,
            policeSelected: champion ? `Door #${game.secretLayout.thiefDoor}` : "None",
            isCorrect: champion?.player.status === "CAUGHT",
            guessTime: champion?.investigationTimeSec || 0,
          },
        ],
        endedAt: new Date(),
      });
      await generalMatch.save();

      console.log(`[DetectiveMystery] Successfully saved match records to DB for room ${game.roomCode}`);
    } catch (err) {
      console.error("[DetectiveMystery] Error saving match to DB:", err);
    }
  }

  /**
   * Returns current state for a reconnecting player.
   */
  static getReconnectingPlayerState(roomCode, playerId) {
    const game = activeGames.get(roomCode.toUpperCase());
    if (!game) return null;

    const player = game.players.get(playerId);
    const publicState = this.getPublicGameState(game);

    return {
      publicState,
      myState: player ? {
        id: player.id,
        lives: player.lives,
        attempts: player.attempts,
        safeDoorsFound: player.safeDoorsFound,
        bombsTriggered: player.bombsTriggered,
        status: player.status,
        investigationTimeMs: player.investigationTimeMs,
        clue: player && player.revealedDoors && Array.from(player.revealedDoors.values()).includes("CLUE") ? game.secretLayout.riddle : null,
        revealedDoors: Array.from(player.revealedDoors.entries()).map(([doorId, result]) => ({
          doorId,
          result,
        })),
      } : null,
    };
  }

  /**
   * Checks if an active game exists for the room.
   */
  static hasActiveGame(roomCode) {
    return activeGames.has(roomCode.toUpperCase());
  }
}

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
   * Generates an independent, validated 10-door secret layout.
   * Exactly 10 doors: 1 Thief, 4 Safe, 3 Bombs, 1 Clue, 1 Life.
   */
  static generatePlayerLayout(preferredThiefDoor = null) {
    const doorIds = Array.from({ length: DETECTIVE_CONFIG.TOTAL_DOORS }, (_, i) => i + 1);

    let thiefDoor;
    let otherDoors;

    if (preferredThiefDoor && preferredThiefDoor >= 1 && preferredThiefDoor <= DETECTIVE_CONFIG.TOTAL_DOORS) {
      thiefDoor = preferredThiefDoor;
      otherDoors = doorIds.filter((d) => d !== thiefDoor);
    } else {
      const thiefIdx = Math.floor(Math.random() * doorIds.length);
      thiefDoor = doorIds[thiefIdx];
      otherDoors = doorIds.filter((d) => d !== thiefDoor);
    }

    // Shuffle the remaining 9 doors using Fisher-Yates
    for (let i = otherDoors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherDoors[i], otherDoors[j]] = [otherDoors[j], otherDoors[i]];
    }

    const bombDoors = new Set(otherDoors.slice(0, DETECTIVE_CONFIG.BOMB_DOORS));
    const clueDoor = otherDoors[DETECTIVE_CONFIG.BOMB_DOORS];
    const lifeDoor = otherDoors[DETECTIVE_CONFIG.BOMB_DOORS + DETECTIVE_CONFIG.CLUE_DOORS];
    const safeDoors = otherDoors.slice(DETECTIVE_CONFIG.BOMB_DOORS + DETECTIVE_CONFIG.CLUE_DOORS);

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

    // Layout signature for comparing complete layouts across players
    const signature = Array.from({ length: DETECTIVE_CONFIG.TOTAL_DOORS }, (_, i) => `${i + 1}:${mapping.get(i + 1)}`).join(",");

    // Generate coordinated, valid riddles that point to THIS player's own thief door
    const layoutRiddles = this.generateLayoutRiddles(thiefDoor);

    return {
      thiefDoor,
      bombDoors: Array.from(bombDoors).sort((a, b) => a - b),
      clueDoor,
      lifeDoor,
      safeDoors: Array.from(safeDoors).sort((a, b) => a - b),
      riddle: layoutRiddles.defaultRiddle,
      clueRiddles: layoutRiddles.riddles,
      riddleType: layoutRiddles.archetype,
      mapping,
      signature,
    };
  }

  /**
   * Generates independent secret layouts for all players in a match.
   * Guarantees:
   * 1. Every player gets a complete 10-door layout (1 Thief, 4 Safe, 3 Bomb, 1 Clue, 1 Life).
   * 2. No two players receive the exact same complete secret layout in the match.
   * 3. Thief doors are distributed independently across players.
   */
  static generateUniqueLayoutsForPlayers(players) {
    const playerCount = players.length;
    // Permute available doors 1..10 to assign distinct thief doors where possible
    const availableThiefDoors = Array.from({ length: DETECTIVE_CONFIG.TOTAL_DOORS }, (_, i) => i + 1);
    for (let i = availableThiefDoors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableThiefDoors[i], availableThiefDoors[j]] = [availableThiefDoors[j], availableThiefDoors[i]];
    }

    const playerLayouts = new Map();
    const usedSignatures = new Set();

    players.forEach((p, index) => {
      let layout;
      let attempts = 0;
      const preferredThief = index < availableThiefDoors.length ? availableThiefDoors[index] : null;

      do {
        layout = this.generatePlayerLayout(preferredThief);
        attempts++;
      } while (playerCount > 1 && usedSignatures.has(layout.signature) && attempts < 100);

      usedSignatures.add(layout.signature);
      playerLayouts.set(p.id, layout);
    });

    return playerLayouts;
  }

  /**
   * Legacy alias for generatePlayerLayout.
   */
  static generateDoors() {
    return this.generatePlayerLayout();
  }

  /**
   * Generates coordinated riddles for all screen resolution matrix layouts.
   * Layouts supported:
   *  - 'desktop-5-2': 5 columns x 2 rows (Row 1: 01-05, Row 2: 06-10)
   *  - 'mobile-4-4-2': 3 rows (Row 1: 01-04, Row 2: 05-08, Row 3: 09-10)
   *  - 'mobile-2-5': 5 rows x 2 columns (Row 1: 01-02, ..., Row 5: 09-10)
   */
  static generateLayoutRiddles(thiefDoor) {
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

    // Pick a random archetype: 'ROW', 'CHAMBER', 'COLUMN', 'WING'
    const archetypes = ["ROW", "CHAMBER", "COLUMN", "WING"];
    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    const riddles = {
      "desktop-5-2": "",
      "mobile-4-4-2": "",
      "mobile-2-5": "",
    };

    if (archetype === "ROW") {
      // Desktop 5x2: Row 1 (01-05) vs Row 2 (06-10)
      riddles["desktop-5-2"] = thiefDoor <= 5
        ? "The Thief is hiding on the First Row (Doors 01–05)!"
        : "The Thief is hiding on the Second Row (Doors 06–10)!";

      // Mobile 4-4-2: Row 1 (01-04), Row 2 (05-08), Row 3 (09-10)
      if (thiefDoor <= 4) {
        riddles["mobile-4-4-2"] = "The Thief is hiding on the First Row (Doors 01–04)!";
      } else if (thiefDoor <= 8) {
        riddles["mobile-4-4-2"] = "The Thief is hiding on the Second Row (Doors 05–08)!";
      } else {
        riddles["mobile-4-4-2"] = "The Thief is hiding on the Third Row (Doors 09–10)!";
      }

      // Mobile 2-5: Rows 1..5
      const m25Row = Math.ceil(thiefDoor / 2);
      const m25D1 = pad((m25Row - 1) * 2 + 1);
      const m25D2 = pad((m25Row - 1) * 2 + 2);
      riddles["mobile-2-5"] = `The Thief is hiding on Row ${m25Row} (Doors ${m25D1} or ${m25D2})!`;
    } else if (archetype === "CHAMBER") {
      // Desktop 5x2: Northern (01-05) vs Southern (06-10)
      riddles["desktop-5-2"] = thiefDoor <= 5
        ? "Footsteps echo from the Northern Chamber (Top Row: Doors 01–05)!"
        : "Shadows detected along the Southern Chamber (Bottom Row: Doors 06–10)!";

      // Mobile 4-4-2: Northern (01-04), Central (05-08), Southern (09-10)
      if (thiefDoor <= 4) {
        riddles["mobile-4-4-2"] = "Footsteps echo from the Northern Chamber (Top Row: Doors 01–04)!";
      } else if (thiefDoor <= 8) {
        riddles["mobile-4-4-2"] = "Shadows detected in the Central Chamber (Middle Row: Doors 05–08)!";
      } else {
        riddles["mobile-4-4-2"] = "Creaking sounds rise from the Southern Chamber (Bottom Row: Doors 09–10)!";
      }

      // Mobile 2-5: Upper (01-04), Central (05-06), Lower (07-10)
      if (thiefDoor <= 4) {
        riddles["mobile-2-5"] = "Footsteps echo from the Upper Chambers (Doors 01–04)!";
      } else if (thiefDoor <= 6) {
        riddles["mobile-2-5"] = "Shadows detected in the Central Chamber (Doors 05–06)!";
      } else {
        riddles["mobile-2-5"] = "Creaking sounds rise from the Lower Chambers (Doors 07–10)!";
      }
    } else if (archetype === "COLUMN") {
      // Desktop 5x2: Columns 1..5
      const dCol = ((thiefDoor - 1) % 5) + 1;
      const dOther = thiefDoor <= 5 ? thiefDoor + 5 : thiefDoor - 5;
      riddles["desktop-5-2"] = `Suspicious activity spotted in Column ${dCol} (Doors ${pad(Math.min(thiefDoor, dOther))} or ${pad(Math.max(thiefDoor, dOther))})!`;

      // Mobile 4-4-2:
      // Col 1: 01, 05
      // Col 2: 02, 06, 09
      // Col 3: 03, 07, 10
      // Col 4: 04, 08
      if (thiefDoor === 1 || thiefDoor === 5) {
        riddles["mobile-4-4-2"] = "Suspicious activity spotted in Column 1 (Doors 01 or 05)!";
      } else if (thiefDoor === 2 || thiefDoor === 6 || thiefDoor === 9) {
        riddles["mobile-4-4-2"] = "Suspicious activity spotted in Column 2 (Doors 02, 06, or 09)!";
      } else if (thiefDoor === 3 || thiefDoor === 7 || thiefDoor === 10) {
        riddles["mobile-4-4-2"] = "Suspicious activity spotted in Column 3 (Doors 03, 07, or 10)!";
      } else {
        riddles["mobile-4-4-2"] = "Suspicious activity spotted in Column 4 (Doors 04 or 08)!";
      }

      // Mobile 2-5: Left col (odd) vs Right col (even)
      if (thiefDoor % 2 === 1) {
        riddles["mobile-2-5"] = "Suspicious activity spotted in the Left Column (Doors 01, 03, 05, 07, 09)!";
      } else {
        riddles["mobile-2-5"] = "Suspicious activity spotted in the Right Column (Doors 02, 04, 06, 08, 10)!";
      }
    } else {
      // WING
      // Desktop 5x2: Left Wing (cols 1-2), Center Column (col 3), Right Wing (cols 4-5)
      const dCol = ((thiefDoor - 1) % 5) + 1;
      if (dCol <= 2) {
        riddles["desktop-5-2"] = "The Thief was glimpsed fleeing towards the Left Wing (Columns 1–2)!";
      } else if (dCol === 3) {
        riddles["desktop-5-2"] = "Mysterious echoes resonate from the Center Column (Column 3: Doors 03 or 08)!";
      } else {
        riddles["desktop-5-2"] = "A cold draft blows from the Right Wing (Columns 4–5)!";
      }

      // Mobile 4-4-2:
      // Left Wing: cols 1-2 (Doors 01, 02, 05, 06, 09)
      // Right Wing: cols 3-4 (Doors 03, 04, 07, 08, 10)
      if ([1, 2, 5, 6, 9].includes(thiefDoor)) {
        riddles["mobile-4-4-2"] = "The Thief was glimpsed fleeing towards the Left Wing (Columns 1–2)!";
      } else {
        riddles["mobile-4-4-2"] = "A cold draft blows from the Right Wing (Columns 3–4)!";
      }

      // Mobile 2-5: Left Wing vs Right Wing
      if (thiefDoor % 2 === 1) {
        riddles["mobile-2-5"] = "The Thief was glimpsed fleeing towards the Left Wing (Column 1)!";
      } else {
        riddles["mobile-2-5"] = "A cold draft blows from the Right Wing (Column 2)!";
      }
    }

    return {
      archetype,
      riddles,
      defaultRiddle: riddles["desktop-5-2"],
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

    const playerLayouts = this.generateUniqueLayoutsForPlayers(players);
    const now = Date.now();
    const endsAt = now + DETECTIVE_CONFIG.GAME_DURATION * 1000;

    const playerStates = new Map();
    players.forEach((p) => {
      const secretLayout = playerLayouts.get(p.id);
      playerStates.set(p.id, {
        id: p.id,
        socketId: p.socketId || null,
        userId: p.userId || null,
        guestDeviceId: p.guestDeviceId || null,
        name: p.name,
        avatar: p.avatar || "1",
        lives: DETECTIVE_CONFIG.STARTING_LIVES,
        attempts: 0,
        bombsTriggered: 0,
        safeDoorsFound: 0,
        cluesFound: 0,
        lifeDoorsFound: 0,
        secretLayout, // Server-only private secret layout for this player
        revealedDoors: new Map(), // doorId -> result ("SAFE" | "BOMB" | "THIEF" | "CLUE" | "LIFE")
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

    console.log(`[DetectiveMystery] Started game in ${upperCode} with ${players.length} detectives (independent layouts).`);
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
  static async openDoor(roomCode, playerId, doorId, socket, clientLayout = 'desktop-5-2') {
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

    if (socket?.id) {
      player.socketId = socket.id;
    }

    player.isProcessing = true;

    try {
      // Determine door outcome authoritatively from player's private secret layout
      const outcome = player.secretLayout.mapping.get(numDoorId) || "SAFE";
      player.attempts += 1;
      player.revealedDoors.set(numDoorId, outcome);

      let investigationTimeMs = null;
      let clue = null;
      let clueRiddles = null;

      if (outcome === "SAFE") {
        player.safeDoorsFound += 1;
      } else if (outcome === "BOMB") {
        player.bombsTriggered += 1;
        player.lives = Math.max(0, player.lives - 1);
        if (player.lives === 0) {
          player.status = "ELIMINATED";
        }
      } else if (outcome === "LIFE") {
        player.lifeDoorsFound += 1;
        player.lives = Math.min(DETECTIVE_CONFIG.STARTING_LIVES, player.lives + 1); // Strictly capped at 3
      } else if (outcome === "CLUE") {
        player.cluesFound += 1;
        const layoutKey = (clientLayout && player.secretLayout.clueRiddles?.[clientLayout]) ? clientLayout : 'desktop-5-2';
        clue = player.secretLayout.clueRiddles?.[layoutKey] || player.secretLayout.riddle;
        clueRiddles = player.secretLayout.clueRiddles || null;
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
        clueRiddles,
        livesRemaining: player.lives,
        attempts: player.attempts,
        safeDoorsFound: player.safeDoorsFound,
        bombsTriggered: player.bombsTriggered,
        status: player.status,
        investigationTimeMs,
      });

      // 2. Broadcast public status update to room (NO doorId or outcome leaked)
      game.io.to(upperCode).emit("detective:playerUpdated", {
        id: player.id,
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

      // 3. Check if all players in room are now resolved (each is CAUGHT or ELIMINATED)
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

    // Any player still investigating at match end is timed out
    game.players.forEach((p) => {
      if (p.status === "INVESTIGATING") {
        p.status = "TIMEOUT";
      }
    });

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

    const championPayload = championEntry ? {
      id: championEntry.player.id,
      name: championEntry.player.name,
      finalScore: championEntry.finalScore,
      status: championEntry.player.status,
    } : null;

    // Send personalized results to each player socket (containing only their own secret layout)
    let socketsInRoom = [];
    try {
      if (typeof game.io?.in === "function") {
        socketsInRoom = await game.io.in(roomCode).fetchSockets();
      }
    } catch (err) {
      console.warn("[DetectiveMystery] Error fetching sockets in room:", err);
    }

    const notifiedSocketIds = new Set();

    if (socketsInRoom && socketsInRoom.length > 0) {
      for (const s of socketsInRoom) {
        const p = Array.from(game.players.values()).find((pl) => pl.socketId === s.id);
        if (p && p.secretLayout) {
          s.emit("detective:gameFinished", {
            roomCode,
            leaderboard: finalLeaderboard.map((entry) => ({
              ...entry,
              thiefDoor: entry.id === p.id ? p.secretLayout.thiefDoor : undefined,
            })),
            champion: championPayload,
            secretLayout: {
              thiefDoor: p.secretLayout.thiefDoor,
              bombDoors: p.secretLayout.bombDoors,
            },
          });
          notifiedSocketIds.add(s.id);
        }
      }
    }

    for (const p of game.players.values()) {
      if (p.socketId && !notifiedSocketIds.has(p.socketId) && p.secretLayout) {
        game.io.to(p.socketId).emit("detective:gameFinished", {
          roomCode,
          leaderboard: finalLeaderboard.map((entry) => ({
            ...entry,
            thiefDoor: entry.id === p.id ? p.secretLayout.thiefDoor : undefined,
          })),
          champion: championPayload,
          secretLayout: {
            thiefDoor: p.secretLayout.thiefDoor,
            bombDoors: p.secretLayout.bombDoors,
          },
        });
        notifiedSocketIds.add(p.socketId);
      }
    }

    // Room fallback broadcast without leaking secret layouts
    if (typeof game.io?.to === "function") {
      const roomTarget = game.io.to(roomCode);
      if (typeof roomTarget.except === "function" && notifiedSocketIds.size > 0) {
        roomTarget.except(Array.from(notifiedSocketIds)).emit("detective:gameFinished", {
          roomCode,
          leaderboard: finalLeaderboard,
          champion: championPayload,
          secretLayout: null,
        });
      } else if (notifiedSocketIds.size === 0) {
        roomTarget.emit("detective:gameFinished", {
          roomCode,
          leaderboard: finalLeaderboard,
          champion: championPayload,
          secretLayout: null,
        });
      }
    }

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
            actualThiefCardId: champion?.player?.secretLayout?.thiefDoor ? `door-${champion.player.secretLayout.thiefDoor}` : "door-1",
            thiefName: champion?.player?.secretLayout?.thiefDoor ? `Door #${champion.player.secretLayout.thiefDoor}` : "Mystery Door",
            playerSelections: leaderboardEntries.map((e) => ({
              username: e.player.name,
              selectedCardId: e.player.status === "CAUGHT" && e.player.secretLayout?.thiefDoor ? `door-${e.player.secretLayout.thiefDoor}` : "none",
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
            actualThief: champion?.player?.secretLayout?.thiefDoor ? `Door #${champion.player.secretLayout.thiefDoor}` : "Mystery Door",
            policeSelected: champion?.player?.secretLayout?.thiefDoor ? `Door #${champion.player.secretLayout.thiefDoor}` : "None",
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
        clue: player && player.revealedDoors && Array.from(player.revealedDoors.values()).includes("CLUE") ? (player.secretLayout?.riddle || null) : null,
        clueRiddles: player && player.revealedDoors && Array.from(player.revealedDoors.values()).includes("CLUE") ? (player.secretLayout?.clueRiddles || null) : null,
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

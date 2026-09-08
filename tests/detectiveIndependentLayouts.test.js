import assert from "assert";
import { DetectiveMysteryGameService, DETECTIVE_CONFIG } from "../server/services/detectiveChallenge/DetectiveMysteryGameService.js";

// Helper mock Socket
class MockSocket {
  constructor(id, playerId) {
    this.id = id;
    this.playerId = playerId;
    this.emitted = [];
  }
  emit(event, payload) {
    this.emitted.push({ event, payload });
  }
  reset() {
    this.emitted = [];
  }
}

// Helper mock Server IO
class MockIO {
  constructor() {
    this.roomEmissions = [];
    this.sockets = new Map();
  }
  to(room) {
    const self = this;
    return {
      emit(event, payload) {
        self.roomEmissions.push({ room, event, payload });
      },
      except(socketIds) {
        return {
          emit(event, payload) {
            self.roomEmissions.push({ room, event, payload, except: socketIds });
          }
        };
      }
    };
  }
  in(room) {
    const self = this;
    return {
      async fetchSockets() {
        return Array.from(self.sockets.values());
      }
    };
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING DETECTIVE CHALLENGE INDEPENDENT LAYOUTS TEST SUITE");
  console.log("=================================================");

  let passedTests = 0;

  function test(desc, fn) {
    try {
      fn();
      passedTests++;
      console.log(`✓ PASS: ${desc}`);
    } catch (err) {
      console.error(`✗ FAIL: ${desc}`);
      console.error(err);
      process.exit(1);
    }
  }

  async function testAsync(desc, fn) {
    try {
      await fn();
      passedTests++;
      console.log(`✓ PASS: ${desc}`);
    } catch (err) {
      console.error(`✗ FAIL: ${desc}`);
      console.error(err);
      process.exit(1);
    }
  }

  // TEST 1, 4, 5, 6, 7, 8, 9: Layout properties for 1-player
  test("1. One-player game layout generation & composition", () => {
    const p1 = [{ id: "p1", name: "Alice", socketId: "s1" }];
    const layouts = DetectiveMysteryGameService.generateUniqueLayoutsForPlayers(p1);
    assert.strictEqual(layouts.size, 1);
    const layout = layouts.get("p1");

    // 4. Exactly 10 doors
    assert.strictEqual(layout.mapping.size, 10);
    for (let i = 1; i <= 10; i++) {
      assert.ok(layout.mapping.has(i));
    }

    // 5. Exactly 1 Thief
    const thiefCount = Array.from(layout.mapping.values()).filter((v) => v === "THIEF").length;
    assert.strictEqual(thiefCount, 1);
    assert.strictEqual(layout.thiefDoor >= 1 && layout.thiefDoor <= 10, true);

    // 6. Exactly 4 Safe
    const safeCount = Array.from(layout.mapping.values()).filter((v) => v === "SAFE").length;
    assert.strictEqual(safeCount, 4);

    // 7. Exactly 3 Bomb
    const bombCount = Array.from(layout.mapping.values()).filter((v) => v === "BOMB").length;
    assert.strictEqual(bombCount, 3);
    assert.strictEqual(layout.bombDoors.length, 3);

    // 8. Exactly 1 Clue
    const clueCount = Array.from(layout.mapping.values()).filter((v) => v === "CLUE").length;
    assert.strictEqual(clueCount, 1);

    // 9. Exactly 1 Extra Life
    const lifeCount = Array.from(layout.mapping.values()).filter((v) => v === "LIFE").length;
    assert.strictEqual(lifeCount, 1);
  });

  // TEST 2, 10, 11: Two-player game: different complete layouts & thief positions
  test("2, 10, 11. Two-player game layout uniqueness & different thief positions", () => {
    const players = [
      { id: "p1", name: "Alice", socketId: "s1" },
      { id: "p2", name: "Bob", socketId: "s2" },
    ];
    const layouts = DetectiveMysteryGameService.generateUniqueLayoutsForPlayers(players);
    assert.strictEqual(layouts.size, 2);
    const l1 = layouts.get("p1");
    const l2 = layouts.get("p2");

    // 10. Different complete layouts
    assert.notStrictEqual(l1.signature, l2.signature);

    // 11. Different thief positions
    assert.notStrictEqual(l1.thiefDoor, l2.thiefDoor);
  });

  // TEST 3, 10, 11: Six-player game: all unique complete layouts & distributed thief positions
  test("3. Six-player game: all layouts completely unique", () => {
    const players = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      socketId: `s${i + 1}`,
    }));
    const layouts = DetectiveMysteryGameService.generateUniqueLayoutsForPlayers(players);
    assert.strictEqual(layouts.size, 6);

    const signatures = new Set();
    const thiefDoors = new Set();

    players.forEach((p) => {
      const l = layouts.get(p.id);
      assert.strictEqual(l.mapping.size, 10);
      assert.strictEqual(signatures.has(l.signature), false, "No duplicate signatures allowed");
      signatures.add(l.signature);
      thiefDoors.add(l.thiefDoor);
    });

    assert.strictEqual(signatures.size, 6);
    assert.strictEqual(thiefDoors.size, 6, "All 6 players receive distinct thief doors");
  });

  // TEST 12: Door 03 can have different outcomes for different players
  test("12. Door 03 can produce different outcomes across multiple independent player layouts", () => {
    const outcomesForDoor3 = new Set();
    // Generate multiple player layouts
    for (let i = 0; i < 30; i++) {
      const l = DetectiveMysteryGameService.generatePlayerLayout();
      outcomesForDoor3.add(l.mapping.get(3));
    }
    // With 30 trials, door 3 should have produced at least 2 or 3 distinct outcomes (SAFE, BOMB, THIEF, etc.)
    assert.ok(outcomesForDoor3.size >= 2, `Door 3 had outcomes: ${Array.from(outcomesForDoor3)}`);
  });

  // TEST 15, 16: Clue points to player's own thief door
  test("15, 16. Player clue points to THAT player's own thief door", () => {
    // Player 1 with thief at 3
    const l1 = DetectiveMysteryGameService.generatePlayerLayout(3);
    assert.strictEqual(l1.thiefDoor, 3);
    assert.ok(
      l1.clueRiddles["desktop-5-2"].includes("01–05") ||
      l1.clueRiddles["desktop-5-2"].includes("03") ||
      l1.clueRiddles["desktop-5-2"].includes("Left Wing") ||
      l1.clueRiddles["desktop-5-2"].includes("Center Column"),
      `Clue should point to door 3, got: ${l1.clueRiddles["desktop-5-2"]}`
    );

    // Player 2 with thief at 8
    const l2 = DetectiveMysteryGameService.generatePlayerLayout(8);
    assert.strictEqual(l2.thiefDoor, 8);
    assert.ok(
      l2.clueRiddles["desktop-5-2"].includes("06–10") ||
      l2.clueRiddles["desktop-5-2"].includes("08") ||
      l2.clueRiddles["desktop-5-2"].includes("Center Column") ||
      l2.clueRiddles["desktop-5-2"].includes("Southern"),
      `Clue should point to door 8, got: ${l2.clueRiddles["desktop-5-2"]}`
    );
  });

  // TEST 13, 14, 21, 23, 24, 25: Multiplayer active game simulation
  await testAsync("13, 14, 21, 23, 24, 25. Multiplayer game active flow & fog of war", async () => {
    const io = new MockIO();
    const p1Socket = new MockSocket("s1", "p1");
    const p2Socket = new MockSocket("s2", "p2");
    io.sockets.set("s1", p1Socket);
    io.sockets.set("s2", p2Socket);

    const players = [
      { id: "p1", name: "Alice", socketId: "s1" },
      { id: "p2", name: "Bob", socketId: "s2" },
    ];

    const game = DetectiveMysteryGameService.startGame("TESTROOM", players, io);

    // 23, 24. Public gameStarted emission must NEVER contain secretLayout
    const startEmission = io.roomEmissions.find((e) => e.event === "detective:gameStarted");
    assert.ok(startEmission);
    assert.strictEqual(startEmission.payload.secretLayout, undefined);
    assert.strictEqual(startEmission.payload.thiefDoor, undefined);
    assert.strictEqual(startEmission.payload.bombDoors, undefined);

    // 25. Synchronized timer
    assert.strictEqual(startEmission.payload.remainingSeconds, 60);

    const p1State = game.players.get("p1");
    const p2State = game.players.get("p2");

    // Find a bomb door for Player 1
    const p1BombDoor = p1State.secretLayout.bombDoors[0];

    // Player 1 opens their bomb door
    await DetectiveMysteryGameService.openDoor("TESTROOM", "p1", p1BombDoor, p1Socket);

    // 13, 21. Bomb decreases only Player 1's lives
    assert.strictEqual(p1State.lives, 2);
    assert.strictEqual(p2State.lives, 3, "Player 2's lives should not be decreased");

    // 14. Player 1's revealed door does NOT appear in Player 2's revealedDoors
    assert.strictEqual(p1State.revealedDoors.has(p1BombDoor), true);
    assert.strictEqual(p2State.revealedDoors.has(p1BombDoor), false);

    // Room update emitted for playerUpdated does NOT contain doorId or outcome
    const p1Update = io.roomEmissions.find((e) => e.event === "detective:playerUpdated" && e.payload.playerId === "p1");
    assert.ok(p1Update);
    assert.strictEqual(p1Update.payload.doorId, undefined);
    assert.strictEqual(p1Update.payload.result, undefined);
    assert.strictEqual(p1Update.payload.lives, 2);
  });

  // TEST 17: Cannot open same door twice
  await testAsync("17. Cannot open the same door twice", async () => {
    const io = new MockIO();
    const p1Socket = new MockSocket("s1", "p1");
    io.sockets.set("s1", p1Socket);

    const players = [{ id: "p1", name: "Alice", socketId: "s1" }];
    const game = DetectiveMysteryGameService.startGame("ROOM_TWICE", players, io);

    p1Socket.reset();
    await DetectiveMysteryGameService.openDoor("ROOM_TWICE", "p1", 1, p1Socket);
    assert.strictEqual(game.players.get("p1").attempts, 1);

    // Attempt opening door 1 again
    p1Socket.reset();
    await DetectiveMysteryGameService.openDoor("ROOM_TWICE", "p1", 1, p1Socket);
    const err = p1Socket.emitted.find((e) => e.event === "detective:error");
    assert.ok(err, "Should emit error when opening same door twice");
    assert.strictEqual(game.players.get("p1").attempts, 1, "Attempts should not increment");
  });

  // TEST 18: Cannot open doors after elimination
  await testAsync("18. Cannot open doors after elimination", async () => {
    const io = new MockIO();
    const p1Socket = new MockSocket("s1", "p1");
    io.sockets.set("s1", p1Socket);

    const players = [{ id: "p1", name: "Alice", socketId: "s1" }];
    const game = DetectiveMysteryGameService.startGame("ROOM_ELIM", players, io);
    const p1 = game.players.get("p1");

    // Manually trigger 3 bombs to eliminate
    for (const bDoor of p1.secretLayout.bombDoors) {
      await DetectiveMysteryGameService.openDoor("ROOM_ELIM", "p1", bDoor, p1Socket);
    }
    assert.strictEqual(p1.lives, 0);
    assert.strictEqual(p1.status, "ELIMINATED");

    // Try opening another door
    p1Socket.reset();
    await DetectiveMysteryGameService.openDoor("ROOM_ELIM", "p1", p1.secretLayout.safeDoors[0], p1Socket);
    const err = p1Socket.emitted.find((e) => e.event === "detective:error");
    assert.ok(err, "Should reject door open after elimination");
  });

  // TEST 19: Cannot open doors after timer expires
  await testAsync("19. Cannot open doors after timer expires", async () => {
    const io = new MockIO();
    const p1Socket = new MockSocket("s1", "p1");
    io.sockets.set("s1", p1Socket);

    const players = [{ id: "p1", name: "Alice", socketId: "s1" }];
    const game = DetectiveMysteryGameService.startGame("ROOM_EXPIRE", players, io);

    // Fast-forward game end timer
    game.endsAt = Date.now() - 1000;

    p1Socket.reset();
    await DetectiveMysteryGameService.openDoor("ROOM_EXPIRE", "p1", 1, p1Socket);
    const err = p1Socket.emitted.find((e) => e.event === "detective:error");
    assert.ok(err, "Should reject opening doors after timer expires");
  });

  // TEST 20: Lives cannot exceed 3
  await testAsync("20. Extra life cannot increase lives beyond 3", async () => {
    const io = new MockIO();
    const p1Socket = new MockSocket("s1", "p1");
    io.sockets.set("s1", p1Socket);

    const players = [{ id: "p1", name: "Alice", socketId: "s1" }];
    const game = DetectiveMysteryGameService.startGame("ROOM_LIFE", players, io);
    const p1 = game.players.get("p1");
    assert.strictEqual(p1.lives, 3);

    // Open extra life door while at 3 lives
    await DetectiveMysteryGameService.openDoor("ROOM_LIFE", "p1", p1.secretLayout.lifeDoor, p1Socket);
    assert.strictEqual(p1.lives, 3, "Lives must be capped at 3");
  });

  // TEST 22, 30: Thief capture affects only that player's investigation & final results
  await testAsync("22, 30. Thief capture affects only that player & final results are accurate", async () => {
    const io = new MockIO();
    const p1Socket = new MockSocket("s1", "p1");
    const p2Socket = new MockSocket("s2", "p2");
    io.sockets.set("s1", p1Socket);
    io.sockets.set("s2", p2Socket);

    const players = [
      { id: "p1", name: "Alice", socketId: "s1" },
      { id: "p2", name: "Bob", socketId: "s2" },
    ];
    const game = DetectiveMysteryGameService.startGame("ROOM_WIN", players, io);
    const p1 = game.players.get("p1");
    const p2 = game.players.get("p2");

    // Player 1 catches thief
    await DetectiveMysteryGameService.openDoor("ROOM_WIN", "p1", p1.secretLayout.thiefDoor, p1Socket);

    // Player 1 is CAUGHT, but game remains ACTIVE while Player 2 is still investigating
    assert.strictEqual(p1.status, "CAUGHT");
    assert.strictEqual(game.status, "ACTIVE", "Game should remain active for other players who are still investigating");

    // Player 2 now catches thief
    await DetectiveMysteryGameService.openDoor("ROOM_WIN", "p2", p2.secretLayout.thiefDoor, p2Socket);
    assert.strictEqual(p2.status, "CAUGHT");
    assert.strictEqual(game.status, "FINISHED", "Game finishes once all players are resolved");

    // 30. Final result checks
    // p1Socket should receive their own thiefDoor
    const p1Finish = p1Socket.emitted.find((e) => e.event === "detective:gameFinished");
    assert.ok(p1Finish);
    assert.strictEqual(p1Finish.payload.secretLayout.thiefDoor, p1.secretLayout.thiefDoor);

    // p2Socket should receive their own thiefDoor
    const p2Finish = p2Socket.emitted.find((e) => e.event === "detective:gameFinished");
    assert.ok(p2Finish);
    assert.strictEqual(p2Finish.payload.secretLayout.thiefDoor, p2.secretLayout.thiefDoor);

    // And their thief doors are different
    assert.notStrictEqual(p1Finish.payload.secretLayout.thiefDoor, p2Finish.payload.secretLayout.thiefDoor);
  });

  // TEST 26, 27: Reconnect sync restores only player's own authorized state
  await testAsync("26, 27. Reconnect does not expose secret layout and restores only authorized state", async () => {
    const io = new MockIO();
    const p1Socket = new MockSocket("s1", "p1");
    const p2Socket = new MockSocket("s2", "p2");
    io.sockets.set("s1", p1Socket);
    io.sockets.set("s2", p2Socket);

    const players = [
      { id: "p1", name: "Alice", socketId: "s1" },
      { id: "p2", name: "Bob", socketId: "s2" },
    ];
    const game = DetectiveMysteryGameService.startGame("ROOM_REC", players, io);
    const p1 = game.players.get("p1");

    // Player 1 opens safe door
    await DetectiveMysteryGameService.openDoor("ROOM_REC", "p1", p1.secretLayout.safeDoors[0], p1Socket);

    // Player 2 requests reconnect state
    const p2Sync = DetectiveMysteryGameService.getReconnectingPlayerState("ROOM_REC", "p2");
    assert.ok(p2Sync);
    assert.strictEqual(p2Sync.publicState.secretLayout, undefined);
    // Player 2's myState does not contain Player 1's opened door
    assert.strictEqual(p2Sync.myState.revealedDoors.length, 0);

    // Player 1 requests reconnect state
    const p1Sync = DetectiveMysteryGameService.getReconnectingPlayerState("ROOM_REC", "p1");
    assert.ok(p1Sync);
    assert.strictEqual(p1Sync.myState.revealedDoors.length, 1);
    assert.strictEqual(p1Sync.myState.revealedDoors[0].doorId, p1.secretLayout.safeDoors[0]);
    assert.strictEqual(p1Sync.myState.revealedDoors[0].result, "SAFE");
  });

  // TEST 28, 29: Race condition & simultaneous door opens
  await testAsync("28, 29. Simultaneous rapid door clicks handled safely", async () => {
    const io = new MockIO();
    const p1Socket = new MockSocket("s1", "p1");
    io.sockets.set("s1", p1Socket);

    const players = [{ id: "p1", name: "Alice", socketId: "s1" }];
    const game = DetectiveMysteryGameService.startGame("ROOM_RACE", players, io);
    const p1 = game.players.get("p1");
    // Simulate rapid concurrent clicks
    let doorToClick = 1;
    for (const [door, outcome] of p1.secretLayout.mapping.entries()) {
      if (outcome === "SAFE") {
        doorToClick = door;
        break;
      }
    }
    const p1Open1 = DetectiveMysteryGameService.openDoor("ROOM_RACE", "p1", doorToClick, p1Socket);
    const p1Open2 = DetectiveMysteryGameService.openDoor("ROOM_RACE", "p1", doorToClick, p1Socket);

    await Promise.all([p1Open1, p1Open2]);
    assert.strictEqual(p1.attempts, 1, "Only 1 open should be registered, not duplicate");
    assert.strictEqual(p1.safeDoorsFound, 1);
  });

  console.log("=================================================");
  console.log(`ALL ${passedTests} TESTS PASSED SUCCESSFULLY!`);
  console.log("=================================================");
}

runTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});

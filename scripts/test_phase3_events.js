import assert from "node:assert";
import notificationFrequencyService from "../server/services/notificationFrequencyService.js";
import gameNotificationService from "../server/services/gameNotificationService.js";
import notificationAudienceService from "../server/services/notificationAudienceService.js";

async function runTests() {
  console.log("==========================================");
  console.log("RUNNING PHASE 3 NOTIFICATION UNIT TESTS");
  console.log("==========================================");

  // 1. Template Interpolation Test
  console.log("\n[Test 1] Template Variable Interpolation");
  const template = "Hey {{username}}! Room {{roomCode}} has {{playerCount}} players waiting!";
  const rendered = gameNotificationService.renderTemplate(template, {
    username: "RajaGamer",
    roomCode: "ROYAL99",
    playerCount: 4,
  });
  console.log("Rendered result:", rendered);
  assert.strictEqual(
    rendered,
    "Hey RajaGamer! Room ROYAL99 has 4 players waiting!",
    "Template variables should be safely replaced"
  );
  console.log("✅ Template Interpolation passed");

  // 2. Quiet Hours Logic Test
  console.log("\n[Test 2] Quiet Hours Evaluation");
  // Test with custom hours
  const quietHoursConfig = {
    enabled: true,
    start: "22:00",
    end: "08:00",
    timezone: "UTC",
  };
  
  // Late night 23:30 UTC -> should be in quiet hours
  const lateNightUtc = new Date("2026-09-05T23:30:00Z");
  const isNight = notificationFrequencyService.isInQuietHours(quietHoursConfig, lateNightUtc);
  console.log("Late night (23:30 UTC) in quiet hours:", isNight);
  assert.strictEqual(isNight, true, "23:30 UTC should be within 22:00-08:00 quiet hours");

  // Midday 14:00 UTC -> should NOT be in quiet hours
  const midDayUtc = new Date("2026-09-05T14:00:00Z");
  const isDay = notificationFrequencyService.isInQuietHours(quietHoursConfig, midDayUtc);
  console.log("Midday (14:00 UTC) in quiet hours:", isDay);
  assert.strictEqual(isDay, false, "14:00 UTC should NOT be within 22:00-08:00 quiet hours");
  console.log("✅ Quiet Hours Evaluation passed");

  // 3. Daily Limits Test
  console.log("\n[Test 3] Daily Limits Checking");
  const maxCap = notificationFrequencyService.DEFAULT_MAX_GENERAL_PER_DAY;
  console.log(`Max daily push cap configured: ${maxCap}`);
  assert(maxCap >= 3, "Max daily push cap should be defined and reasonable");
  console.log("✅ Daily Limits passed");

  // 4. Audience Stats Query Builder Test
  console.log("\n[Test 4] Audience Filter Query Validation");
  const testFilter = {
    levelMin: 10,
    levelMax: 50,
    gameMode: "police-thief",
    lastPlayedDays: 7,
  };
  const statsQuery = notificationAudienceService.buildStatsQuery(testFilter);
  console.log("Generated Mongo query for audience:", JSON.stringify(statsQuery, null, 2));
  assert.strictEqual(statsQuery.level.$gte, 10);
  assert.strictEqual(statsQuery.level.$lte, 50);
  assert(statsQuery["policeMode.gamesPlayed"] !== undefined);
  assert(statsQuery.lastPlayedAt.$lte !== undefined);
  console.log("✅ Audience Query Builder passed");

  console.log("\n==========================================");
  console.log("ALL PHASE 3 LOGIC TESTS PASSED SUCCESSFULLY! 🎉");
  console.log("==========================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

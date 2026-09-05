import {
  getUtcDateForTimezone,
  getLocalTimeParts,
  calculateNextRunAt,
} from "../server/services/campaignScheduler.js";

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING PHASE 2 SCHEDULER & RECURRENCE TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Timezone calculation for Asia/Kolkata (UTC +5:30)
  // 8:00 PM (20:00) on 2026-09-06 in Asia/Kolkata must equal 14:30:00 UTC on 2026-09-06
  const kolkataDate = getUtcDateForTimezone(2026, 9, 6, 20, 0, "Asia/Kolkata");
  assert(
    kolkataDate.toISOString() === "2026-09-06T14:30:00.000Z",
    `Asia/Kolkata 20:00 on 2026-09-06 converts to UTC 14:30 (${kolkataDate.toISOString()})`
  );

  // Formatting back to Asia/Kolkata must equal 8:00 PM
  const formattedKolkata = kolkataDate.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  assert(
    formattedKolkata.includes("8:00 PM"),
    `UTC converts back to 8:00 PM in Asia/Kolkata (${formattedKolkata})`
  );

  // TEST 2: Timezone calculation for America/New_York (EDT is UTC -4)
  // 8:00 PM (20:00) on 2026-09-06 in America/New_York must equal 00:00:00 UTC on 2026-09-07
  const nyDate = getUtcDateForTimezone(2026, 9, 6, 20, 0, "America/New_York");
  assert(
    nyDate.toISOString() === "2026-09-07T00:00:00.000Z",
    `America/New_York 20:00 on 2026-09-06 converts to UTC 00:00 next day (${nyDate.toISOString()})`
  );

  // TEST 3: One-Time Schedule Calculation
  const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in future
  const oneTimeSchedule = {
    timezone: "Asia/Kolkata",
    startAt: futureDate.toISOString(),
  };
  const nextOneTime = calculateNextRunAt(oneTimeSchedule, new Date(), true);
  assert(
    nextOneTime && Math.abs(nextOneTime.getTime() - futureDate.getTime()) < 1000,
    "One-time schedule returns exact future startAt"
  );

  // TEST 4: Recurring DAILY Schedule Calculation
  const dailySchedule = {
    timezone: "Asia/Kolkata",
    startAt: "2026-01-01T00:00:00.000Z",
    recurrence: {
      frequency: "DAILY",
      timeOfDay: "19:00",
    },
  };
  // Pretend current time is 2026-09-05 12:00 UTC (17:30 IST) -> next occurrence should be today at 19:00 IST
  const baselineBefore1900 = new Date("2026-09-05T12:00:00.000Z");
  const nextDailyToday = calculateNextRunAt(dailySchedule, baselineBefore1900, false);
  const localPartsToday = getLocalTimeParts(nextDailyToday, "Asia/Kolkata");
  assert(
    localPartsToday.year === 2026 &&
      localPartsToday.month === 9 &&
      localPartsToday.day === 5 &&
      localPartsToday.hour === 19 &&
      localPartsToday.minute === 0,
    `Daily run before 19:00 IST schedules for today at 19:00 IST (Actual: ${localPartsToday.day}/${localPartsToday.month} ${localPartsToday.hour}:${localPartsToday.minute})`
  );

  // Pretend current time is 2026-09-05 14:00 UTC (19:30 IST) -> next occurrence should be tomorrow at 19:00 IST
  const baselineAfter1900 = new Date("2026-09-05T14:00:00.000Z");
  const nextDailyTomorrow = calculateNextRunAt(dailySchedule, baselineAfter1900, false);
  const localPartsTomorrow = getLocalTimeParts(nextDailyTomorrow, "Asia/Kolkata");
  assert(
    localPartsTomorrow.year === 2026 &&
      localPartsTomorrow.month === 9 &&
      localPartsTomorrow.day === 6 &&
      localPartsTomorrow.hour === 19 &&
      localPartsTomorrow.minute === 0,
    `Daily run after 19:00 IST advances to tomorrow at 19:00 IST (Actual: ${localPartsTomorrow.day}/${localPartsTomorrow.month} ${localPartsTomorrow.hour}:${localPartsTomorrow.minute})`
  );

  // TEST 5: Recurring WEEKLY on selected days [1, 5] (Monday, Friday)
  const weeklySchedule = {
    timezone: "Asia/Kolkata",
    startAt: "2026-01-01T00:00:00.000Z",
    recurrence: {
      frequency: "WEEKLY",
      daysOfWeek: [1, 5], // Monday & Friday
      timeOfDay: "20:00",
    },
  };
  // 2026-09-05 is a Saturday. Next run must be Monday 2026-09-07 at 20:00 IST.
  const nextWeekly = calculateNextRunAt(weeklySchedule, new Date("2026-09-05T10:00:00.000Z"), false);
  const weeklyParts = getLocalTimeParts(nextWeekly, "Asia/Kolkata");
  assert(
    weeklyParts.dayOfWeek === 1 && weeklyParts.day === 7 && weeklyParts.hour === 20,
    `Weekly run from Saturday advances to next Monday (day 1, Sep 7) at 20:00 IST (Actual: dayOfWeek ${weeklyParts.dayOfWeek}, day ${weeklyParts.day})`
  );

  // TEST 6: Recurring MONTHLY (1st of month at 10:00)
  const monthlySchedule = {
    timezone: "Asia/Kolkata",
    startAt: "2026-01-01T00:00:00.000Z",
    recurrence: {
      frequency: "MONTHLY",
      dayOfMonth: 1,
      timeOfDay: "10:00",
    },
  };
  // From 2026-09-05, next 1st of month is 2026-10-01 at 10:00 IST
  const nextMonthly = calculateNextRunAt(monthlySchedule, new Date("2026-09-05T10:00:00.000Z"), false);
  const monthlyParts = getLocalTimeParts(nextMonthly, "Asia/Kolkata");
  assert(
    monthlyParts.month === 10 && monthlyParts.day === 1 && monthlyParts.hour === 10,
    `Monthly run on Sep 5 advances to Oct 1 at 10:00 IST (Actual: ${monthlyParts.month}/${monthlyParts.day} at ${monthlyParts.hour}:00)`
  );

  // TEST 7: Recurring with endAt boundary
  const boundedSchedule = {
    timezone: "Asia/Kolkata",
    startAt: "2026-09-01T00:00:00.000Z",
    endAt: "2026-09-05T00:00:00.000Z",
    recurrence: {
      frequency: "DAILY",
      timeOfDay: "20:00",
    },
  };
  const pastEnd = calculateNextRunAt(boundedSchedule, new Date("2026-09-06T00:00:00.000Z"), false);
  assert(pastEnd === null, "Returns null when past endAt boundary");

  console.log(`\n=================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

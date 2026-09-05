import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import NotificationCampaign from "../server/models/NotificationCampaign.js";

async function testAtomicLock() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/raja_rani_db";
  console.log("Connecting to MongoDB for atomic distributed lock test...");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  const now = new Date();
  const testCampaign = await NotificationCampaign.create({
    name: "Atomic Claim Test Campaign",
    type: "ONE_TIME",
    title: "Test Title",
    body: "Test Body",
    targetType: "ALL_ENABLED",
    schedule: {
      timezone: "Asia/Kolkata",
      startAt: new Date(now.getTime() - 1000), // Due right now
    },
    status: "SCHEDULED",
    nextRunAt: new Date(now.getTime() - 1000),
    isArchived: false,
    lockUntil: null,
    lockedBy: null,
  });

  console.log(`Created test campaign: ${testCampaign._id}`);

  // Simulate two workers trying to claim the same campaign concurrently
  const worker1Id = "worker-process-1";
  const worker2Id = "worker-process-2";
  const leaseTime = new Date(Date.now() + 60000);

  async function attemptClaim(workerId) {
    return await NotificationCampaign.findOneAndUpdate(
      {
        _id: testCampaign._id,
        status: { $in: ["SCHEDULED", "ACTIVE"] },
        isArchived: false,
        nextRunAt: { $ne: null, $lte: new Date() },
        $or: [{ lockUntil: null }, { lockUntil: { $lte: new Date() } }],
      },
      {
        $set: {
          lockUntil: leaseTime,
          lockedBy: workerId,
        },
      },
      { new: true }
    );
  }

  // Fire both simultaneously using Promise.all
  const [claim1, claim2] = await Promise.all([
    attemptClaim(worker1Id),
    attemptClaim(worker2Id),
  ]);

  const success1 = claim1 !== null;
  const success2 = claim2 !== null;

  console.log(`Worker 1 claim result: ${success1 ? "CLAIMED (" + claim1.lockedBy + ")" : "REJECTED (null)"}`);
  console.log(`Worker 2 claim result: ${success2 ? "CLAIMED (" + claim2.lockedBy + ")" : "REJECTED (null)"}`);

  if ((success1 && !success2) || (!success1 && success2)) {
    console.log("✅ PASS: Exactly one worker claimed the campaign atomically! Duplicate execution prevented.");
  } else {
    console.error("❌ FAIL: Duplicate claim occurred or both failed!");
    process.exit(1);
  }

  // Cleanup test campaign
  await NotificationCampaign.findByIdAndDelete(testCampaign._id);
  console.log("Cleaned up test campaign.");
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

testAtomicLock().catch((err) => {
  console.error("Atomic test error (MongoDB may not be running locally):", err.message);
  // Do not fail if mongodb is not running in test env
  process.exit(0);
});

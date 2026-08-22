import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function clearDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/rajarani";
  console.log("Connecting to database:", uri);
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    const collections = await mongoose.connection.db.collections();
    console.log("Collections found:", collections.map((c) => c.collectionName));

    for (const collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`Cleared ${result.deletedCount} documents from collection: ${collection.collectionName}`);
    }

    console.log("✅ ALL DATABASE ENTRIES CLEARED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearDatabase();

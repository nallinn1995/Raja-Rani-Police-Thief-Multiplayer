import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import User from "../server/models/User.js";
import { hashPassword } from "../server/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

async function createAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas.");

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "myadmin123456";

  const passwordHash = await hashPassword(password);

  const existing = await User.findOne({ username: new RegExp(`^${username}$`, "i") });
  if (existing) {
    existing.role = "admin";
    existing.passwordHash = passwordHash;
    existing.isBanned = false;
    await existing.save();
    console.log(`Updated existing user "${existing.username}" to role: "admin" with current password.`);
  } else {
    const newAdmin = new User({
      username,
      email: "admin@rajaranigame.online",
      role: "admin",
      passwordHash,
      isGuest: false,
    });
    await newAdmin.save();
    console.log(`Created new administrator user "${username}" in MongoDB.`);
  }

  await mongoose.disconnect();
  console.log("Done!");
}

createAdmin().catch((err) => {
  console.error("Error creating admin user:", err);
  process.exit(1);
});

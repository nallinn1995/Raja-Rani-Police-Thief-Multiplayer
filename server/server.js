import express from "express";
import path from "path";
import { createServer } from "http";
import { Server as SocketIoServer } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { body, validationResult } from "express-validator";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import { OAuth2Client } from "google-auth-library";

// Fix Windows/ISP DNS SRV resolution issue for MongoDB Atlas (mongodb+srv://)
dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Fallback if environment restricts setServers
}
import User from "./models/User.js";
import PlayerStats from "./models/PlayerStats.js";
import { getProfileDataById, recordMatchResults } from "./controllers/statsController.js";
import {
  getModernProfileStats,
  getModernAchievements,
  getModernLeaderboard,
} from "./controllers/modernMode/modernModeController.js";
import {
  getDetectiveProfile,
  getDetectiveLeaderboard,
  getDetectiveAdminDashboard,
  recordRoundResult as recordDetectiveRound,
  recordMatchResult as recordDetectiveMatch,
} from "./controllers/detectiveChallenge/detectiveChallengeController.js";
import {
  adminLogin,
  getOverviewStats,
  getAllUsers,
  createAdminUser,
  updateUser,
  deleteUser,
  toggleBanUser,
  getActiveRoomsData,
  closeRoom,
  kickPlayer,
  getPlayerStatsList,
  updatePlayerStatsRecord,
  resetPlayerStatsRecord,
  getMatchesList,
  deleteMatchRecord,
  clearAllMatches,
  broadcastSystemMessage,
  getModernModeAdminData,
  getOrInitSystemConfig,
  updateSystemConfigInDB,
  getAllGuests,
  verifyAdminToken,
} from "./controllers/adminController.js";
import {
  registerPushInstallation,
  updatePushPreferences,
  disassociateUserInstallation,
  syncUserInstallation,
  getAdminNotificationData,
  sendAdminNotification,
} from "./controllers/notificationController.js";
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  archiveCampaign,
  getCampaignRuns,
  getTemplates,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
} from "./controllers/campaignController.js";
import {
  trackNotificationEvent,
  getNotificationAnalytics,
  exportAnalyticsCsv,
  getAutomaticEvents,
  updateAutomaticEvent,
  estimateAudience,
} from "./controllers/notificationAnalyticsController.js";
import campaignScheduler from "./services/campaignScheduler.js";
import gameNotificationService from "./services/gameNotificationService.js";
import rateLimit from "express-rate-limit";
import GuestTrackingService from "./services/GuestTrackingService.js";
import {
  hashPassword,
  verifyPassword,
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  getBearerToken,
} from "./security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist")));

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/raja_rani_db";
const safeUri = MONGODB_URI.replace(/:([^@]+)@/, ":****@");
console.log(`🔌 Attempting MongoDB connection to: ${safeUri}`);

mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    campaignScheduler.startScheduler();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// Example API endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

// Helper to format user response with avatar and description
async function formatUserResponse(userDoc) {
  let avatar = userDoc.avatar;
  let description = userDoc.description;
  if (!avatar || !description) {
    const stats = await PlayerStats.findOne({ userId: userDoc._id }).catch(() => null);
    if (stats) {
      if (!avatar) avatar = stats.avatar;
      if (!description) description = stats.description;
    }
  }
  return {
    id: userDoc._id,
    _id: userDoc._id,
    username: userDoc.username,
    email: userDoc.email,
    isGuest: userDoc.isGuest,
    role: userDoc.role || "user",
    avatar: avatar || "1",
    description: description || "",
    createdAt: userDoc.createdAt,
  };
}

// AUTH API ENDPOINTS

// 1. Sign In
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.findOne({
      username: new RegExp(`^${username.trim()}$`, "i"),
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "This account has been suspended" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: "Account credentials invalid. Please reset password or sign up." });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    const userData = await formatUserResponse(user);

    return res.json({
      success: true,
      token,
      refreshToken,
      user: userData,
    });
  } catch (err) {
    console.error("Sign in error:", err);
    res.status(500).json({ error: "Internal server error during sign in" });
  }
});

// 2. Sign Up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const cleanUsername = username.trim();
    const existing = await User.findOne({
      username: new RegExp(`^${cleanUsername}$`, "i"),
    });

    if (existing) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const passwordHash = await hashPassword(password);
    const newUser = new User({
      username: cleanUsername,
      email: email ? email.trim().toLowerCase() : undefined,
      passwordHash,
      isGuest: false,
      avatar: "1",
      description: "",
    });

    const token = issueAccessToken(newUser);
    const refreshToken = issueRefreshToken(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    const userData = await formatUserResponse(newUser);

    return res.json({
      success: true,
      token,
      refreshToken,
      user: userData,
    });
  } catch (err) {
    console.error("Sign up error:", err);
    res.status(500).json({ error: "Internal server error during sign up" });
  }
});

// 2.5 Google Sign-In / Continue with Google
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "Google credential token is required" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const client = new OAuth2Client(clientId);
    let payload = null;

    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId ? [clientId] : undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error("Google token verification failed:", verifyErr.message);
      return res.status(401).json({ error: "Invalid or expired Google authentication token" });
    }

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: "Unable to verify Google user profile" });
    }

    const { sub: googleId, email, name } = payload;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // 1. Check if user already exists by googleId
    let user = await User.findOne({ googleId });

    // 2. If not found by googleId, check by verified email
    if (!user && cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
      if (user) {
        // Link Google ID to existing registered account with this verified email
        user.googleId = googleId;
        if (!user.authProvider || user.authProvider === "local") {
          user.authProvider = "google";
        }
        await user.save();
      }
    }

    // 3. If still not found, create a new registered Google user
    if (!user) {
      let baseUsername = (name || cleanEmail?.split("@")[0] || "Player")
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .slice(0, 15);
      if (!baseUsername || baseUsername.length < 2) baseUsername = "GooglePlayer";

      let targetUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: new RegExp(`^${targetUsername}$`, "i") })) {
        targetUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
        counter++;
        if (counter > 20) {
          targetUsername = `Player_${Date.now().toString().slice(-4)}`;
          break;
        }
      }

      user = new User({
        username: targetUsername,
        email: cleanEmail,
        googleId,
        authProvider: "google",
        isGuest: false,
        avatar: "1",
        description: "",
      });

      await user.save();

      // Initialize PlayerStats record for new Google registered user
      const stats = new PlayerStats({
        userId: user._id,
        username: user.username,
        level: 1,
        xp: 0,
        title: "Recruit Detective",
      });
      await stats.save().catch(() => {});
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "This account has been suspended" });
    }

    const token = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    const userData = await formatUserResponse(user);

    return res.json({
      success: true,
      token,
      refreshToken,
      user: userData,
    });
  } catch (err) {
    console.error("Google authentication error:", err);
    res.status(500).json({ error: "Internal server error during Google authentication" });
  }
});

// 3. Forgot Password
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { emailOrUsername } = req.body;
    if (!emailOrUsername) {
      return res.status(400).json({ error: "Email or username is required" });
    }

    const search = emailOrUsername.trim();
    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${search}$`, "i") },
        { email: search.toLowerCase() },
      ],
    });

    if (!user) {
      return res.json({ success: true, message: "If an account exists, a reset code was sent." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otpCode;
    user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    console.log(`🔑 Reset Code for ${user.username}: ${otpCode}`);

    return res.json({ success: true, message: "Reset code sent successfully", otpCode });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to process forgot password request" });
  }
});

// 4. Reset Password
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { emailOrUsername, otpCode, newPassword } = req.body;
    if (!emailOrUsername || !otpCode || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const search = emailOrUsername.trim();
    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${search}$`, "i") },
        { email: search.toLowerCase() },
      ],
    }).select("+resetOtp +resetOtpExpires +passwordHash");

    if (!user || user.resetOtp !== otpCode || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// 5. Refresh Session
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token required" });

    const payload = verifyRefreshToken(refreshToken);
    if (!payload || !payload.sub) return res.status(401).json({ error: "Invalid refresh token" });

    const user = await User.findById(payload.sub);
    if (!user || user.isBanned) return res.status(401).json({ error: "User unauthorized" });

    const newToken = issueAccessToken(user);
    const newRefreshToken = issueRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    const userData = await formatUserResponse(user);

    return res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
      user: userData,
    });
  } catch (err) {
    res.status(401).json({ error: "Token refresh failed" });
  }
});

// 6. Get Current User Profile
app.get("/api/auth/me", async (req, res) => {
  try {
    const token = getBearerToken(req);
    const identity = verifyAccessToken(token);
    if (!identity || !identity.sub) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(identity.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userData = await formatUserResponse(user);

    return res.json({
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching user profile" });
  }
});

// 7. Get Full Profile Dashboard Data for User
app.get("/api/profile/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = await getProfileDataById(userId);
    if (!profileData) {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.json(profileData);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// 8. Update User Profile (Username, Description, Avatar)
app.put("/api/profile/update", async (req, res) => {
  try {
    const token = getBearerToken(req);
    const identity = verifyAccessToken(token);
    const { userId, username, description, avatar } = req.body;

    const targetUserId = identity?.sub || userId;
    if (!targetUserId) return res.status(401).json({ error: "Unauthorized" });

    let user = null;
    if (mongoose.Types.ObjectId.isValid(targetUserId)) {
      user = await User.findById(targetUserId);
    }
    if (!user && username) {
      user = await User.findOne({ username: new RegExp(`^${String(username).trim()}$`, "i") });
    }

    if (!user) {
      return res.json({
        success: true,
        user: {
          id: targetUserId,
          username: username || "Guest Player",
          description: description || "",
          avatar: avatar || "1",
          isGuest: true,
        },
      });
    }

    if (username && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      const existing = await User.findOne({
        username: new RegExp(`^${cleanUsername}$`, "i"),
      });
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      user.username = cleanUsername;
    }

    if (description !== undefined) user.description = description;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // Also sync with PlayerStats model if exists
    await PlayerStats.updateOne(
      { userId: user._id },
      { $set: { avatar: user.avatar, description: user.description, username: user.username } }
    ).catch(() => {});

    const updatedProfile = await getProfileDataById(user._id);
    return res.json(updatedProfile);
  } catch (err) {
    console.error("Error updating user profile:", err);
    return res.status(500).json({ error: "Failed to update user profile" });
  }
});

// MODERN MODE ENDPOINTS
app.get("/api/modern-mode/stats/:userId", getModernProfileStats);
app.get("/api/modern-mode/achievements/:userId", getModernAchievements);
app.get("/api/modern-mode/leaderboard", getModernLeaderboard);

// DETECTIVE CHALLENGE ENDPOINTS
app.get("/api/detective-challenge/profile/:userId", getDetectiveProfile);
app.get("/api/detective-challenge/leaderboard", getDetectiveLeaderboard);
app.post("/api/detective-challenge/round", recordDetectiveRound);
app.post("/api/detective-challenge/match", recordDetectiveMatch);
app.get("/api/admin/detective-challenge/dashboard", getDetectiveAdminDashboard);

// ADMIN API ENDPOINTS
app.post("/api/admin/login", adminLogin);
app.get("/api/admin/overview", async (req, res) => {
  try {
    const data = await getOverviewStats(rooms, io);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/users", getAllUsers);
app.get("/api/admin/guests", getAllGuests);
app.post("/api/admin/users", createAdminUser);
app.put("/api/admin/users/:id", updateUser);
app.delete("/api/admin/users/:id", deleteUser);
app.post("/api/admin/users/:id/ban", toggleBanUser);

// GUEST PING ENDPOINT
app.post("/api/guest/ping", async (req, res) => {
  try {
    const { guestDeviceId, username } = req.body;
    if (!guestDeviceId) {
      return res.status(400).json({ error: "guestDeviceId is required" });
    }
    const guest = await GuestTrackingService.recordGuestPing(guestDeviceId, username);
    return res.json({ success: true, guest });
  } catch (err) {
    console.error("Guest ping error:", err);
    return res.status(500).json({ error: "Failed to record guest ping" });
  }
});

// OFFLINE GAME METRIC ENDPOINT (ISOLATED - ONLY +1 COUNTER FOR ADMIN ANALYTICS)
app.post("/api/stats/offline-game-started", async (req, res) => {
  try {
    const { userId, guestDeviceId } = req.body || {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      await PlayerStats.findOneAndUpdate(
        { userId },
        { $inc: { offlineGamesPlayed: 1 }, $set: { lastPlayedAt: new Date() } },
        { upsert: false }
      );
    } else if (guestDeviceId) {
      await GuestSession.findOneAndUpdate(
        { guestDeviceId },
        { $inc: { offlineGamesPlayed: 1 }, $set: { lastSeenAt: new Date() } },
        { upsert: false }
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Error recording offline game metric:", err);
    return res.status(500).json({ error: "Failed to record offline game start" });
  }
});

app.get("/api/admin/rooms", (req, res) => {
  res.json(getActiveRoomsData(rooms));
});
app.delete("/api/admin/rooms/:roomCode", (req, res) => {
  closeRoom(rooms, io, req.params.roomCode);
  res.json({ success: true, message: "Room closed" });
});
app.post("/api/admin/rooms/:roomCode/kick", (req, res) => {
  kickPlayer(rooms, io, req.params.roomCode, req.body.playerId);
  res.json({ success: true, message: "Player kicked" });
});

app.get("/api/admin/player-stats", getPlayerStatsList);
app.put("/api/admin/player-stats/:id", updatePlayerStatsRecord);
app.post("/api/admin/player-stats/:id/reset", resetPlayerStatsRecord);

app.get("/api/admin/matches", getMatchesList);
app.delete("/api/admin/matches/:id", deleteMatchRecord);
app.delete("/api/admin/matches", clearAllMatches);

app.post("/api/admin/broadcast", (req, res) => {
  broadcastSystemMessage(io, req.body.message, req.body.type);
  res.json({ success: true, message: "Broadcast sent" });
});
app.get("/api/admin/modern-mode/dashboard", getModernModeAdminData);
app.get("/api/config", async (req, res) => {
  const config = await getOrInitSystemConfig();
  res.json({ success: true, config });
});
app.get("/api/admin/config", async (req, res) => {
  const config = await getOrInitSystemConfig();
  res.json({ success: true, config });
});
app.put("/api/admin/config", async (req, res) => {
  const updatedConfig = await updateSystemConfigInDB(req.body);
  if (typeof io !== "undefined" && io) {
    io.emit("system_config_updated", updatedConfig);
  }
  res.json({ success: true, config: updatedConfig });
});

// PUSH NOTIFICATION API ENDPOINTS (PHASE 1)
const pushSendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { error: "Too many notification requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public client installation management
app.post("/api/notifications/installations", registerPushInstallation);
app.put("/api/notifications/preferences", updatePushPreferences);
app.post("/api/notifications/disassociate", disassociateUserInstallation);
app.post("/api/notifications/sync-user", syncUserInstallation);

// Protected Admin Notification Endpoints
app.get("/api/admin/notifications", verifyAdminToken, getAdminNotificationData);
app.post("/api/admin/notifications/send", verifyAdminToken, pushSendLimiter, sendAdminNotification);

// Phase 2 Protected Admin Notification Campaigns
app.get("/api/admin/notifications/campaigns", verifyAdminToken, getCampaigns);
app.post("/api/admin/notifications/campaigns", verifyAdminToken, createCampaign);
app.get("/api/admin/notifications/campaigns/:id", verifyAdminToken, getCampaignById);
app.patch("/api/admin/notifications/campaigns/:id", verifyAdminToken, updateCampaign);
app.post("/api/admin/notifications/campaigns/:id/pause", verifyAdminToken, pauseCampaign);
app.post("/api/admin/notifications/campaigns/:id/resume", verifyAdminToken, resumeCampaign);
app.post("/api/admin/notifications/campaigns/:id/cancel", verifyAdminToken, cancelCampaign);
app.delete("/api/admin/notifications/campaigns/:id", verifyAdminToken, archiveCampaign);
app.get("/api/admin/notifications/campaigns/:id/runs", verifyAdminToken, getCampaignRuns);

// Phase 2 Protected Admin Notification Templates
app.get("/api/admin/notifications/templates", verifyAdminToken, getTemplates);
app.post("/api/admin/notifications/templates", verifyAdminToken, createTemplate);
app.patch("/api/admin/notifications/templates/:id", verifyAdminToken, updateTemplate);
app.post("/api/admin/notifications/templates/:id/duplicate", verifyAdminToken, duplicateTemplate);
app.delete("/api/admin/notifications/templates/:id", verifyAdminToken, deleteTemplate);

// Phase 3 Notification Analytics, Tracking, and Automatic Event Controls
app.post("/api/notifications/track", trackNotificationEvent);
app.get("/api/admin/notifications/analytics", verifyAdminToken, getNotificationAnalytics);
app.get("/api/admin/notifications/analytics/export", verifyAdminToken, exportAnalyticsCsv);
app.get("/api/admin/notifications/automatic-events", verifyAdminToken, getAutomaticEvents);
app.put("/api/admin/notifications/automatic-events/:eventType", verifyAdminToken, updateAutomaticEvent);
app.post("/api/admin/notifications/audience/estimate", verifyAdminToken, estimateAudience);

// Room invitation endpoint
app.post("/api/rooms/:roomCode/invite", (req, res) => {
  try {
    const { roomCode } = req.params;
    const { recipientUserId, senderName } = req.body;
    const upperCode = roomCode.toUpperCase();
    const room = rooms.get(upperCode);
    if (!room) {
      return res.status(404).json({ error: "Room not found or expired" });
    }
    if (!recipientUserId) {
      return res.status(400).json({ error: "recipientUserId is required" });
    }
    gameNotificationService.dispatchRoomInvitation({
      senderName: senderName || "A friend",
      recipientUserId,
      roomCode: upperCode,
    });
    return res.json({ success: true, message: "Invitation dispatched" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send room invite" });
  }
});

const io = new SocketIoServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

gameNotificationService.setSocketServer(io);

// Game state storage
const rooms = new Map();
const playerSockets = new Map();
const DISCONNECT_TIMEOUT = 30000;

// Generate unique 6-digit alphanumeric room code
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Shuffle array function
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create room endpoint
app.post(
  "/api/rooms",
  [
    body("roomName").trim().escape(),
    body("playerName").trim().escape(),
    body("totalRounds").isInt({ min: 1, max: 10 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomName, playerName, totalRounds, gameMode, winCondition, targetScore, userId, guestDeviceId } = req.body;

    const token = getBearerToken(req);
    const identity = verifyAccessToken(token);
    const verifiedUserId = identity?.sub && identity.sub === userId ? userId : null;
    const resolvedGuestDeviceId = !verifiedUserId ? (guestDeviceId || null) : null;

    if (resolvedGuestDeviceId) {
      GuestTrackingService.recordGuestActivity(resolvedGuestDeviceId, playerName, gameMode || "CLASSIC_POINTS").catch(() => {});
    }

    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    const room = {
      id: roomCode,
      name: roomName,
      totalRounds: parseInt(totalRounds) || 3,
      currentRound: 0,
      gameMode: gameMode || "CLASSIC_POINTS",
      winCondition: winCondition || "rounds",
      targetScore: winCondition === "target_score" ? (parseInt(targetScore) || 5000) : undefined,
      cardsState: [],
      cardAssignments: [],
      players: [
        {
          id: uuidv4(),
          userId: verifiedUserId,
          guestDeviceId: resolvedGuestDeviceId,
          name: playerName,
          isHost: true,
          score: 0,
          role: null,
          socketId: null,
        },
      ],
      gameState: "waiting", // waiting, classic-card-selection, police-reveal, guessing, results, finished
      roles: ["Raja", "Rani", "Police", "Thief"],
      policeId: null,
      currentGuess: null,
      messages: [],
    };

    rooms.set(roomCode, room);

    res.json({
      success: true,
      roomCode,
      playerId: room.players[0].id,
      room: {
        id: room.id,
        name: room.name,
        totalRounds: room.totalRounds,
        gameMode: room.gameMode,
        winCondition: room.winCondition,
        targetScore: room.targetScore,
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          score: p.score,
        })),
      },
    });
  }
);

// Join room endpoint
app.post(
  "/api/rooms/:roomCode/join",
  [body("playerName").trim().escape()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomCode } = req.params;
    const { playerName, userId, guestDeviceId } = req.body;

    const token = getBearerToken(req);
    const identity = verifyAccessToken(token);
    const verifiedUserId = identity?.sub && identity.sub === userId ? userId : null;
    const resolvedGuestDeviceId = !verifiedUserId ? (guestDeviceId || null) : null;

    const room = rooms.get(roomCode.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.players.length >= 4) {
      return res.status(400).json({ error: "Room is full" });
    }

    if (room.gameState !== "waiting") {
      return res.status(400).json({ error: "Game already in progress" });
    }

    // Check if name already exists
    if (
      room.players.some(
        (p) => p.name.toLowerCase() === playerName.toLowerCase()
      )
    ) {
      return res.status(400).json({ error: "Player name already taken" });
    }

    if (resolvedGuestDeviceId) {
      GuestTrackingService.recordGuestActivity(resolvedGuestDeviceId, playerName, room.gameMode || "CLASSIC_POINTS").catch(() => {});
    }

    const newPlayer = {
      id: uuidv4(),
      userId: verifiedUserId,
      guestDeviceId: resolvedGuestDeviceId,
      name: playerName,
      isHost: false,
      score: 0,
      role: null,
      socketId: null,
      disconnected: false,
      lastSeen: Date.now(),
    };

    room.players.push(newPlayer);

    res.json({
      success: true,
      playerId: newPlayer.id,
      room: {
        id: room.id,
        name: room.name,
        totalRounds: room.totalRounds,
        gameMode: room.gameMode,
        winCondition: room.winCondition,
        targetScore: room.targetScore,
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          score: p.score,
        })),
      },
    });

    // Notify all players in the room
    io.to(roomCode).emit("player-joined", {
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        score: p.score,
      })),
    });

    // Start game if room is full and notify players
    if (room.players.length === 4) {
      const userIds = room.players.map((p) => p.userId).filter(Boolean);
      gameNotificationService.dispatchRoomReady({
        roomCode: roomCode.toUpperCase(),
        recipientUserIds: userIds,
      });
      setTimeout(() => startGame(roomCode), 2000);
    }
  }
);

// Socket connection handling

io.on("connection_error", (err) => {
  console.log("🚨 Engine connection error:", err.code, err.message);
});
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomCode, playerId }) => {
    const upperCode = roomCode.toUpperCase();
    const room = rooms.get(upperCode);

    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      socket.emit("error", { message: "Player not found in this room" });
      return;
    }

    // Join socket room
    socket.join(upperCode);

    // Update player's socket
    player.socketId = socket.id;
    player.disconnected = false;
    playerSockets.set(socket.id, { roomCode: upperCode, playerId });

    if (player.userId) {
      gameNotificationService.registerUserSocket(player.userId, socket.id);
      socket.data = socket.data || {};
      socket.data.userId = player.userId;
    }

    console.log(
      `✅ Player ${playerId} connected/reconnected to room ${upperCode}`
    );

    io.to(upperCode).emit("player-reconnected", { playerId });

    // Emit full room state
    socket.emit("room-state", {
      room: {
        id: room.id,
        name: room.name,
        totalRounds: room.totalRounds,
        currentRound: room.currentRound,
        gameState: room.gameState,
        gameMode: room.gameMode,
        winCondition: room.winCondition,
        targetScore: room.targetScore,
        cardsState: room.cardsState,
        guessingEndTime: room.guessingEndTime,
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          score: p.score,
          role: p.id === playerId ? p.role : null,
          disconnected: !!p.disconnected,
        })),
      },
      playerId,
      policeId: room.policeId,
    });

    if (room.gameState === "classic-card-selection" && room.cardsState) {
      socket.emit("classic:startCardSelection", {
        cardsState: room.cardsState,
      });
      const myCard = room.cardsState.find((c) => c.selectedBy === playerId);
      if (myCard && player.role) {
        socket.emit("classic:roleRevealedPrivate", {
          cardId: myCard.id,
          role: player.role,
        });
      }
    }

    socket.emit("chat-history", room.messages);

    // FIX #5: Re-send all-roles to Police if they reconnect during the guessing phase.
    // Without this, the Police arrives back with no knowledge of who is who.
    if (room.gameState === "guessing" && room.policeId === playerId) {
      socket.emit("all-roles", {
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          isHost: p.isHost,
        })),
      });
    }
  });

  socket.on("chat-message", ({ roomCode, playerId, message }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (room) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        const sanitizedMessage = message.trim();
        const chatMessage = {
          id: uuidv4(),
          playerId,
          playerName: player.name,
          message: sanitizedMessage,
          timestamp: new Date().toISOString(),
        };

        room.messages.push(chatMessage);
        io.to(roomCode).emit("chat-message", chatMessage);
      }
    }
  });

  socket.on("classic:selectCard", ({ roomCode, playerId, cardId }) => {
    if (!roomCode || !playerId || !cardId) return;
    const upperCode = roomCode.toUpperCase();
    const room = rooms.get(upperCode);
    if (!room || room.gameState !== "classic-card-selection") return;

    const player = room.players.find((p) => p.id === playerId);
    const alreadySelected = room.cardsState?.some((c) => c.selectedBy === playerId);
    if (!player || alreadySelected) return;

    const cardIndex = parseInt(cardId.replace("card-", ""));
    const card = room.cardsState?.[cardIndex];
    if (!card || card.selectedBy) return;

    const role = room.cardAssignments[cardIndex];
    card.selectedBy = playerId;
    player.role = role;

    io.to(upperCode).emit("classic:playerCardSelected", {
      playerId,
      cardId,
      cardsState: room.cardsState,
    });

    socket.emit("classic:roleRevealedPrivate", {
      cardId,
      role,
    });

    socket.emit("role-assigned", {
      role,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.id === playerId ? p.role : null,
        isHost: p.isHost,
      })),
    });

    const allSelected = room.cardsState.every((c) => c.selectedBy !== null);
    if (allSelected) {
      setTimeout(() => {
        if (room.gameState === "classic-card-selection") {
          room.gameState = "police-reveal";
          io.to(upperCode).emit("police-reveal-phase");
        }
      }, 1500);
    }
  });

  socket.on("police-reveal", ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (room && room.gameState === "police-reveal") {
      const player = room.players.find((p) => p.id === playerId);
      if (player && player.role === "Police") {
        room.gameState = "guessing";
        room.policeId = playerId;
        room.guessingEndTime = Date.now() + 30000;

        if (room.guessTimeout) clearTimeout(room.guessTimeout);

        room.guessTimeout = setTimeout(() => {
          const r = rooms.get(roomCode.toUpperCase());
          if (r && r.gameState === "guessing") {
            const thief = r.players.find((p) => p.role === "Thief");
            const police = r.players.find((p) => p.role === "Police");
            const raja = r.players.find((p) => p.role === "Raja");
            const rani = r.players.find((p) => p.role === "Rani");
            const isCorrect = false;

            if (raja) {
              raja.score = (raja.score || 0) + 1000;
              raja.rajaTurns = (raja.rajaTurns || 0) + 1;
              raja.rajaPoints = (raja.rajaPoints || 0) + 1000;
            }
            if (rani) {
              rani.score = (rani.score || 0) + 800;
              rani.raniTurns = (rani.raniTurns || 0) + 1;
              rani.raniPoints = (rani.raniPoints || 0) + 800;
            }
            if (thief) {
              thief.score = (thief.score || 0) + 500;
              thief.thiefTurns = (thief.thiefTurns || 0) + 1;
              thief.thiefEscaped = (thief.thiefEscaped || 0) + 1;
            }
            if (police) {
              police.score = (police.score || 0) + 0;
              police.policeTurns = (police.policeTurns || 0) + 1;
              police.wrongGuesses = (police.wrongGuesses || 0) + 1;
            }

            r.gameState = "results";
            r.currentGuess = { guessedThiefId: null, isCorrect };

            const isGameOver = checkIsGameOver(r);

            io.to(roomCode.toUpperCase()).emit("round-result", {
              isCorrect,
              thief: thief ? { id: thief.id, name: thief.name } : { id: "", name: "Thief" },
              guessedPlayer: { id: "timeout", name: "Nobody (Time out)" },
              players: r.players.map((p) => ({
                id: p.id,
                name: p.name,
                role: p.role,
                score: p.score,
                isHost: p.isHost,
              })),
              currentRound: r.currentRound,
              totalRounds: r.totalRounds,
              gameMode: r.gameMode,
              winCondition: r.winCondition,
              targetScore: r.targetScore,
              isGameOver,
            });

            if (isGameOver) {
              setTimeout(() => {
                endGame(roomCode);
              }, 5000);
            }
          }
        }, 30000);

        // Send all roles to police player
        socket.emit("all-roles", {
          players: room.players.map((p) => ({
            id: p.id,
            name: p.name,
            role: p.role,
            isHost: p.isHost,
          })),
        });

        io.to(roomCode).emit("police-revealed", {
          policeId: playerId,
          policeName: player.name,
          guessingEndTime: room.guessingEndTime,
        });
      }
    }
  });

  socket.on("make-guess", ({ roomCode, playerId, guessedThiefId }) => {
    if (!roomCode || !playerId || !guessedThiefId) return;
    const upperCode = roomCode.toUpperCase();
    const room = rooms.get(upperCode);
    if (room && room.gameState === "guessing" && room.policeId === playerId) {
      if (room.guessTimeout) {
        clearTimeout(room.guessTimeout);
        room.guessTimeout = null;
      }

      const police = room.players.find((p) => p.role === "Police");
      const raja = room.players.find((p) => p.role === "Raja");
      const rani = room.players.find((p) => p.role === "Rani");
      const thief = room.players.find((p) => p.role === "Thief");

      const isCorrect = thief ? thief.id === guessedThiefId : false;

      // Calculate scores and role performance turns
      if (raja) {
        raja.score = (raja.score || 0) + 1000;
        raja.rajaTurns = (raja.rajaTurns || 0) + 1;
        raja.rajaPoints = (raja.rajaPoints || 0) + 1000;
      }
      if (rani) {
        rani.score = (rani.score || 0) + 800;
        rani.raniTurns = (rani.raniTurns || 0) + 1;
        rani.raniPoints = (rani.raniPoints || 0) + 800;
      }
      if (police) {
        police.policeTurns = (police.policeTurns || 0) + 1;
        if (isCorrect) {
          police.score = (police.score || 0) + 500;
          police.correctCatches = (police.correctCatches || 0) + 1;
        } else {
          police.score = (police.score || 0) + 0;
          police.wrongGuesses = (police.wrongGuesses || 0) + 1;
        }
      }
      if (thief) {
        thief.thiefTurns = (thief.thiefTurns || 0) + 1;
        if (isCorrect) {
          thief.score = (thief.score || 0) + 0;
          thief.thiefCaught = (thief.thiefCaught || 0) + 1;
        } else {
          thief.score = (thief.score || 0) + 500;
          thief.thiefEscaped = (thief.thiefEscaped || 0) + 1;
        }
      }

      room.gameState = "results";
      room.currentGuess = { guessedThiefId, isCorrect };

      const guessedPlayerObj = room.players.find((p) => p.id === guessedThiefId);

      const isGameOver = checkIsGameOver(room);

      io.to(upperCode).emit("round-result", {
        isCorrect,
        police: police ? { id: police.id, name: police.name } : undefined,
        thief: thief ? { id: thief.id, name: thief.name } : { id: "", name: "Thief" },
        guessedPlayer: guessedPlayerObj || { id: guessedThiefId, name: "Player" },
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          score: p.score,
          isHost: p.isHost,
        })),
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        gameMode: room.gameMode,
        winCondition: room.winCondition,
        targetScore: room.targetScore,
        isGameOver,
      });

      if (isGameOver) {
        setTimeout(() => {
          endGame(upperCode);
        }, 5000);
      }
    }
  });

  socket.on("next-round", ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (room && room.gameState === "results") {
      const player = room.players.find((p) => p.id === playerId);
      if (player && player.isHost) {
        if (!checkIsGameOver(room)) {
          startNextRound(roomCode);
        }
      }
    }
  });

  // --- WebRTC signaling ---
  socket.on("voice-offer", ({ roomCode, senderId, targetId, sdp }) => {
    if (!roomCode || !targetId || !sdp) return;
    const room = rooms.get(roomCode.toUpperCase());
    let targetSocketId = null;
    if (room && room.players) {
      const targetPlayer = room.players.find((p) => p.id === targetId);
      if (targetPlayer && targetPlayer.socketId) targetSocketId = targetPlayer.socketId;
    }
    if (!targetSocketId) {
      for (const [sockId, info] of playerSockets.entries()) {
        if (info.playerId === targetId) {
          targetSocketId = sockId;
          break;
        }
      }
    }
    if (targetSocketId) {
      io.to(targetSocketId).emit("voice-offer", { senderId, sdp });
    }
  });

  socket.on("voice-answer", ({ roomCode, senderId, targetId, sdp }) => {
    if (!roomCode || !targetId || !sdp) return;
    const room = rooms.get(roomCode.toUpperCase());
    let targetSocketId = null;
    if (room && room.players) {
      const targetPlayer = room.players.find((p) => p.id === targetId);
      if (targetPlayer && targetPlayer.socketId) targetSocketId = targetPlayer.socketId;
    }
    if (!targetSocketId) {
      for (const [sockId, info] of playerSockets.entries()) {
        if (info.playerId === targetId) {
          targetSocketId = sockId;
          break;
        }
      }
    }
    if (targetSocketId) {
      io.to(targetSocketId).emit("voice-answer", { senderId, sdp });
    }
  });

  socket.on("voice-candidate", ({ roomCode, senderId, targetId, candidate }) => {
    if (!roomCode || !targetId || !candidate) return;
    const room = rooms.get(roomCode.toUpperCase());
    let targetSocketId = null;
    if (room && room.players) {
      const targetPlayer = room.players.find((p) => p.id === targetId);
      if (targetPlayer && targetPlayer.socketId) targetSocketId = targetPlayer.socketId;
    }
    if (!targetSocketId) {
      for (const [sockId, info] of playerSockets.entries()) {
        if (info.playerId === targetId) {
          targetSocketId = sockId;
          break;
        }
      }
    }
    if (targetSocketId) {
      io.to(targetSocketId).emit("voice-candidate", { senderId, candidate });
    }
  });

  socket.on("voice-ping", ({ roomCode, senderId }) => {
    if (!roomCode) return;
    socket.to(roomCode.toUpperCase()).emit("voice-peer-ready", { senderId });
  });

  socket.on("player-speaking", ({ roomCode, playerId, isSpeaking }) => {
    if (!roomCode) return;
    socket.to(roomCode.toUpperCase()).emit("player-speaking-update", { playerId, isSpeaking });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (socket.data?.userId) {
      gameNotificationService.unregisterUserSocket(socket.data.userId, socket.id);
    }

    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const { roomCode, playerId } = playerInfo;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    // ------------------------------------------
    // ✅ MARK PLAYER AS TEMPORARILY OFFLINE
    // ------------------------------------------
    player.disconnected = true;
    player.lastSeen = Date.now();

    console.log(
      `Player ${playerId} temporarily disconnected from room ${roomCode}`
    );

    // Notify others
    io.to(roomCode).emit("player-disconnected", { playerId });

    // IMPORTANT:
    // ❌ DO NOT remove player from room here
    // ❌ DO NOT delete playerId mapping (we need it for reconnection)
    //
    // But we CAN remove old socket id mapping because a new socket.id will be created
    playerSockets.delete(socket.id);

    // ------------------------------------------
    // ⏳ REMOVE ONLY IF THEY NEVER RECONNECT (30s)
    // ------------------------------------------
    setTimeout(() => {
      const now = Date.now();

      // If still disconnected → never returned → remove permanently
      if (player.disconnected && now - player.lastSeen >= DISCONNECT_TIMEOUT) {
        room.players = room.players.filter((p) => p.id !== playerId);
        console.log(
          `Player ${playerId} permanently removed from room ${roomCode}`
        );

        io.to(roomCode).emit("player-removed", { playerId });

        // FIX #8: Only end game if it is actively in progress.
        // Skip endGame during "waiting" (game hasn't started) or "finished" (already over).
        if (room.gameState !== "waiting" && room.gameState !== "finished") {
          endGame(roomCode);
        }
      }
    }, DISCONNECT_TIMEOUT);
  });
});

function checkIsGameOver(room) {
  if (!room) return true;
  if (room.winCondition === "target_score") {
    const target = room.targetScore || 5000;
    return room.players.some((p) => (p.score || 0) >= target);
  }
  return room.currentRound >= room.totalRounds;
}

function startGame(roomCode) {
  const room = rooms.get(roomCode.toUpperCase());
  if (room && room.players.length === 4) {
    startNextRound(roomCode);
  }
}

function startNextRound(roomCode) {
  const upperCode = roomCode.toUpperCase();
  const room = rooms.get(upperCode);
  if (!room) return;

  if (room.cardSelectionTimeout) {
    clearTimeout(room.cardSelectionTimeout);
    room.cardSelectionTimeout = null;
  }
  if (room.guessTimeout) {
    clearTimeout(room.guessTimeout);
    room.guessTimeout = null;
  }

  room.currentRound++;
  room.gameState = "classic-card-selection";
  room.policeId = null;
  room.currentGuess = null;

  // Assign roles behind 4 cards randomly
  const shuffledRoles = shuffleArray(["Raja", "Rani", "Police", "Thief"]);
  room.cardAssignments = shuffledRoles;
  room.cardsState = [
    { id: "card-0", selectedBy: null },
    { id: "card-1", selectedBy: null },
    { id: "card-2", selectedBy: null },
    { id: "card-3", selectedBy: null },
  ];

  // Clear current role state until cards are picked
  room.players.forEach((player) => {
    player.role = null;
  });

  io.to(upperCode).emit("game-started", {
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    gameMode: room.gameMode,
    winCondition: room.winCondition,
    targetScore: room.targetScore,
    cardsState: room.cardsState,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.isHost,
    })),
  });

  io.to(upperCode).emit("classic:startCardSelection", {
    cardsState: room.cardsState,
  });
}

async function endGame(roomCode) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return;

  room.gameState = "finished";

  // Sort players by score for leaderboard
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  io.to(roomCode).emit("game-finished", {
    leaderboard: sortedPlayers.map((p, index) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      rank: index + 1,
    })),
  });

  // Record match results to update player profile stats, XP, level, wins & history
  try {
    const matchData = {
      roomCode: room.id,
      gameMode: room.gameMode || "CLASSIC_POINTS",
      totalRounds: room.currentRound,
      duration: Math.round((Date.now() - (room.startTime || Date.now())) / 1000),
      players: room.players.map((p) => ({
        userId: p.userId || p.id,
        username: p.name,
        score: p.score,
        role: p.role,
        rajaTurns: p.rajaTurns || 0,
        raniTurns: p.raniTurns || 0,
        policeTurns: p.policeTurns || 0,
        thiefTurns: p.thiefTurns || 0,
        rajaPoints: p.rajaPoints || 0,
        raniPoints: p.raniPoints || 0,
        correctCatches: p.correctCatches || 0,
        wrongGuesses: p.wrongGuesses || 0,
        thiefEscaped: p.thiefEscaped || 0,
        thiefCaught: p.thiefCaught || 0,
      })),
      roundSummaries: room.roundSummaries || [],
    };
    await recordMatchResults(matchData);

    // Record guest match completions for all anonymous guests in room
    for (const p of room.players) {
      if (p.guestDeviceId && !p.userId) {
        GuestTrackingService.recordGuestMatchCompleted(
          p.guestDeviceId,
          p.name,
          room.gameMode || "CLASSIC_POINTS"
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Error recording match results in endGame:", err);
  }

  // Clean up room after 5 minutes
  setTimeout(() => {
    rooms.delete(roomCode.toUpperCase());
  }, 60000);
}

// Serve SPA index.html for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import mongoose from "mongoose";
import User from "../models/User.js";
import PlayerStats from "../models/PlayerStats.js";
import MatchHistory from "../models/MatchHistory.js";
import DetectiveChallengeStats from "../models/detectiveChallenge/DetectiveChallengeStats.js";
import DetectiveChallengeMatch from "../models/detectiveChallenge/DetectiveChallengeMatch.js";
import ModernModeStats from "../models/modernMode/ModernModeStats.js";
import ModernModeMatch from "../models/modernMode/ModernModeMatch.js";
import SystemConfig from "../models/SystemConfig.js";
import GuestSession from "../models/GuestSession.js";
import PushInstallation from "../models/PushInstallation.js";
import { hashPassword, issueAccessToken, verifyAccessToken, getBearerToken, verifyPassword } from "../security.js";

// Global dynamic system config stored in memory & backed by MongoDB
export const systemConfig = {
  screenTexts: {
    welcome: {
      heroTitle: "THE CLASSIC PLAYGROUND GAME,\nNOW A THRILLING DIGITAL SHOWDOWN!",
      heroSubtext: "Strategy, bluff and deduction come together in this timeless game of kingdoms and secrets.",
      featureSubtext: "Quick Match • No Download • Play Anywhere",
      whyLoveTitle: "Why You'll Love It?",
      charactersTitle: "Meet the Characters",
      gameModesTitle: "Game Modes",
      ctaTitle: "READY TO RULE THE KINGDOM?",
    },
    gameInfo: {
      title: "Game Rules & Info",
      subtitle: "Master the strategy, understand the scoring, and dominate the kingdom!",
      classicRules: "Each player picks a secret card. The Police must guess who holds the Thief card. Correct guess yields 500 points to Police. Wrong guess yields 800 points to Thief!",
      detectiveRules: "Analyze clues, suspect statements, and crime scene logs to uncover the criminal before time runs out!",
      modernRules: "Play with 6 Kingdom Roles: Raja, Rani, Mantri, Police, Thief, and Villager with shield abilities and witness bonuses!",
    },
    homePage: {
      welcomeTitle: "Raja Rani Police Thief",
      welcomeSubtext: "Select a game mode or create a private room to start playing with friends!",
    },
    maintenance: {
      title: "Under Scheduled Maintenance",
      message: "The server is currently under scheduled maintenance. Please check back shortly!",
    },
  },
  maintenanceMode: false,
  maintenanceMessage: "The server is currently under scheduled maintenance. Please check back shortly!",
  announcement: "",
  allowGuestLogin: true,
  maxPlayersPerRoom: 10,
  defaultGameMode: "CLASSIC_POINTS",
  pointsRules: {
    raja: 1000,
    rani: 800,
    policeCorrect: 500,
    policeWrong: 0,
    thiefEscaped: 800,
    thiefCaught: 0,
    mantriShieldBonus: 100,
    villagerWitnessBonus: 100,
    detectiveCorrectGuess: 500,
  },
};

export async function getOrInitSystemConfig() {
  try {
    let doc = await SystemConfig.findOne({ configKey: "global_config" });
    if (!doc) {
      doc = new SystemConfig({ configKey: "global_config" });
      await doc.save();
    }
    const docObj = doc.toObject();
    delete docObj._id;
    delete docObj.__v;
    delete docObj.configKey;
    Object.assign(systemConfig, docObj);
    return systemConfig;
  } catch (err) {
    console.error("Error fetching SystemConfig from DB:", err);
    return systemConfig;
  }
}

export async function updateSystemConfigInDB(updateData) {
  try {
    let doc = await SystemConfig.findOne({ configKey: "global_config" });
    if (!doc) {
      doc = new SystemConfig({ configKey: "global_config" });
    }

    if (updateData.screenTexts) {
      doc.screenTexts = {
        welcome: { ...doc.screenTexts?.welcome, ...updateData.screenTexts.welcome },
        gameInfo: { ...doc.screenTexts?.gameInfo, ...updateData.screenTexts.gameInfo },
        homePage: { ...doc.screenTexts?.homePage, ...updateData.screenTexts.homePage },
        maintenance: { ...doc.screenTexts?.maintenance, ...updateData.screenTexts.maintenance },
      };
    }

    if (updateData.pointsRules) {
      doc.pointsRules = { ...doc.pointsRules, ...updateData.pointsRules };
    }

    if (updateData.systemSettings) {
      doc.systemSettings = { ...doc.systemSettings, ...updateData.systemSettings };
    }

    if (typeof updateData.maintenanceMode === "boolean") {
      doc.systemSettings.maintenanceMode = updateData.maintenanceMode;
    }
    if (typeof updateData.maintenanceMessage === "string") {
      doc.screenTexts.maintenance.message = updateData.maintenanceMessage;
    }
    if (typeof updateData.announcement === "string") {
      doc.systemSettings.announcement = updateData.announcement;
    }

    doc.markModified("screenTexts");
    doc.markModified("pointsRules");
    doc.markModified("systemSettings");
    await doc.save();

    return await getOrInitSystemConfig();
  } catch (err) {
    console.error("Error updating SystemConfig in DB:", err);
    Object.assign(systemConfig, updateData);
    return systemConfig;
  }
}

// Initial DB sync on module load
getOrInitSystemConfig().catch(() => {});

const getAdminSecret = () => process.env.ADMIN_PASSWORD;

// Simple Token Verification Helper
export function verifyAdminToken(req, res, next) {
  const token = getBearerToken(req);
  const identity = verifyAccessToken(token);
  if (!identity) {
    return res.status(401).json({ error: "Access denied. Admin token required." });
  }
  if (identity.role !== "admin") return res.status(403).json({ error: "Administrator access required." });
  req.auth = identity;
  next();
}

// 1. Admin Login
export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const ADMIN_SECRET = getAdminSecret();

    // An environment-only bootstrap administrator. There is deliberately no fallback password.
    if ((!username || username === "admin") && ADMIN_SECRET) {
      const valid = await verifyPassword(password, ADMIN_SECRET).catch(() => false);
      // ADMIN_PASSWORD may be a scrypt hash; compare a plain bootstrap secret only when explicitly configured.
      const plainMatch = !ADMIN_SECRET.startsWith("scrypt$") && password.length === ADMIN_SECRET.length &&
        (await import("node:crypto")).timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_SECRET));
      if (!valid && !plainMatch) return res.status(401).json({ error: "Invalid administrator credentials." });
      const token = issueAccessToken({ id: "bootstrap-admin", role: "admin" });
      return res.json({
        success: true,
        token,
        admin: {
          username: username || "SuperAdmin",
          role: "admin",
        },
      });
    }

    // Database administrators must have a password hash; role alone is never sufficient.
    if (username) {
      const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const user = await User.findOne({ username: new RegExp(`^${escapedUsername}$`, "i") }).select("+passwordHash");
      if (user && user.role === "admin" && user.passwordHash && await verifyPassword(password, user.passwordHash)) {
        const token = issueAccessToken(user);
        return res.json({
          success: true,
          token,
          admin: {
            id: user._id,
            username: user.username,
            role: "admin",
          },
        });
      }
    }

    return res.status(401).json({ error: "Invalid admin credentials or unauthorized user role." });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error during admin authentication" });
  }
}

// 2. Get Overview Analytics
export async function getOverviewStats(roomsMap, io) {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalBanned = await User.countDocuments({ isBanned: true });
    
    // Guest Tracking Analytics
    const totalGuestPlayers = await GuestSession.countDocuments();
    const totalPlayers = totalUsers + totalGuestPlayers;
    const guestAggregate = await GuestSession.aggregate([
      {
        $group: {
          _id: null,
          totalMatches: { $sum: "$matchesCompleted" },
          totalGames: { $sum: "$gamesPlayed" },
        },
      },
    ]);
    const totalGuestMatches = guestAggregate[0]?.totalMatches || 0;
    const totalGuestGamesStarted = guestAggregate[0]?.totalGames || 0;
    
    const classicMatchesCount = await MatchHistory.countDocuments();
    const dcMatchDocs = await DetectiveChallengeMatch.countDocuments();
    const detectiveMatchesCount = dcMatchDocs;
    const modernMatchesCount = await ModernModeMatch.countDocuments();
    const totalMatches = classicMatchesCount + detectiveMatchesCount + modernMatchesCount;

    const totalStatsRecords = await PlayerStats.countDocuments();
    const totalDcStatsRecords = await DetectiveChallengeStats.countDocuments();
    const totalModernStatsRecords = await ModernModeStats.countDocuments();

    // Offline Games Tracking Analytics (Isolated simple counter)
    const regOfflineAggregate = await PlayerStats.aggregate([
      {
        $group: {
          _id: null,
          totalOffline: { $sum: "$offlineGamesPlayed" },
        },
      },
    ]);
    const totalRegisteredOfflineGames = regOfflineAggregate[0]?.totalOffline || 0;

    const guestOfflineAggregate = await GuestSession.aggregate([
      {
        $group: {
          _id: null,
          totalOffline: { $sum: "$offlineGamesPlayed" },
        },
      },
    ]);
    const totalGuestOfflineGames = guestOfflineAggregate[0]?.totalOffline || 0;
    const totalOfflineGames = totalRegisteredOfflineGames + totalGuestOfflineGames;
    
    let activeRoomsCount = 0;
    let classicRoomsCount = 0;
    let detectiveRoomsCount = 0;
    let modernRoomsCount = 0;
    let totalPlayersInRooms = 0;
    if (roomsMap) {
      activeRoomsCount = roomsMap.size;
      roomsMap.forEach((room) => {
        if (room && room.players) {
          totalPlayersInRooms += room.players.length;
        }
        if (room?.gameMode === "DETECTIVE_CHALLENGE" || String(room?.id || "").startsWith("DC_")) {
          detectiveRoomsCount++;
        } else if (room?.gameMode === "MODERN_MODE" || String(room?.id || "").startsWith("MODERN_")) {
          modernRoomsCount++;
        } else {
          classicRoomsCount++;
        }
      });
    }

    const connectedSockets = io ? io.sockets.sockets.size : 0;
    const uptimeSeconds = Math.floor(process.uptime());

    return {
      totalUsers,
      totalRegisteredUsers: totalUsers,
      totalGuestPlayers,
      totalPlayers,
      totalGuestMatches,
      totalGuestGamesStarted,
      totalAdmins,
      totalBanned,
      totalMatches,
      totalOnlineGames: totalMatches,
      totalOfflineGames,
      totalRegisteredOfflineGames,
      totalGuestOfflineGames,
      classicMatchesCount,
      detectiveMatchesCount,
      policeThiefMatchesCount: detectiveMatchesCount,
      modernMatchesCount,
      totalStatsRecords,
      totalDcStatsRecords,
      totalModernStatsRecords,
      activeRoomsCount,
      classicRoomsCount,
      detectiveRoomsCount,
      policeThiefRoomsCount: detectiveRoomsCount,
      modernRoomsCount,
      totalPlayersInRooms,
      connectedSockets,
      uptimeSeconds,
      systemConfig,
      serverMemory: process.memoryUsage(),
    };
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    throw error;
  }
}

// 2.1 Guest Testers Listing
export async function getAllGuests(req, res) {
  try {
    const search = req.query.search || "";
    const limit = parseInt(req.query.limit) || 100;

    let query = {};
    if (search) {
      query = {
        $or: [
          { guestDeviceId: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { lastPlayedMode: { $regex: search, $options: "i" } },
        ],
      };
    }

    const guests = await GuestSession.find(query).sort({ lastSeenAt: -1 }).limit(limit).lean();
    res.json({ success: true, count: guests.length, guests });
  } catch (error) {
    console.error("Error fetching guest sessions:", error);
    res.status(500).json({ error: "Failed to fetch guest sessions" });
  }
}

// 3. User Management
export async function getAllUsers(req, res) {
  try {
    const search = req.query.search || "";
    const role = req.query.role;
    const limit = parseInt(req.query.limit) || 100;

    let userQuery = {};
    if (search) {
      userQuery.username = { $regex: search, $options: "i" };
    }
    if (role && role !== "all") {
      if (role === "admin") {
        userQuery.role = "admin";
      } else if (role === "user" || role === "registered") {
        userQuery.role = "user";
        userQuery.isGuest = { $ne: true };
      }
    }

    // 1. Fetch Registered Users unless role is strictly "guest"
    let users = [];
    if (role !== "guest") {
      users = await User.find(userQuery).sort({ createdAt: -1 }).limit(limit).lean();
    }

    // Attach player stats to each registered user
    const userIds = users.map((u) => u._id);
    const statsList = await PlayerStats.find({ userId: { $in: userIds } }).lean();
    const statsMap = new Map();
    statsList.forEach((s) => statsMap.set(s.userId.toString(), s));

    // 2. Fetch Guest Sessions unless role is strictly "admin" or "registered" / "user"
    let guests = [];
    if (role === "all" || role === "guest" || !role) {
      let guestQuery = {};
      if (search) {
        guestQuery = {
          $or: [
            { guestDeviceId: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
          ],
        };
      }
      guests = await GuestSession.find(guestQuery).sort({ lastSeenAt: -1 }).limit(limit).lean();
    }

    // 3. Fetch PushInstallations for both registered users and guest sessions
    const guestDeviceIdsFromUsers = users.map((u) => u.guestDeviceId).filter(Boolean);
    const guestDeviceIdsFromGuests = guests.map((g) => g.guestDeviceId).filter(Boolean);
    const allGuestDeviceIds = Array.from(new Set([...guestDeviceIdsFromUsers, ...guestDeviceIdsFromGuests]));

    const installationQuery = [];
    if (userIds.length > 0) {
      installationQuery.push({ userId: { $in: userIds } });
    }
    if (allGuestDeviceIds.length > 0) {
      installationQuery.push({ guestDeviceId: { $in: allGuestDeviceIds } });
    }

    let installationsList = [];
    if (installationQuery.length > 0) {
      installationsList = await PushInstallation.find({ $or: installationQuery }).lean();
    }

    // Group installations by userId and guestDeviceId
    const installationsByUser = new Map();
    const installationsByGuestDevice = new Map();
    installationsList.forEach((inst) => {
      if (inst.userId) {
        const uid = inst.userId.toString();
        if (!installationsByUser.has(uid)) installationsByUser.set(uid, []);
        installationsByUser.get(uid).push(inst);
      }
      if (inst.guestDeviceId) {
        if (!installationsByGuestDevice.has(inst.guestDeviceId)) installationsByGuestDevice.set(inst.guestDeviceId, []);
        installationsByGuestDevice.get(inst.guestDeviceId).push(inst);
      }
    });

    const enrichedUsers = users.map((u) => {
      const s = statsMap.get(u._id.toString()) || {};
      const userInsts = [
        ...(installationsByUser.get(u._id.toString()) || []),
        ...(u.guestDeviceId ? installationsByGuestDevice.get(u.guestDeviceId) || [] : []),
      ];

      // Check if user has granted push permission on any of their devices/installations
      const IsPermissionEnabled = userInsts.some(
        (inst) => inst.permission === "GRANTED" && inst.notificationsEnabled !== false
      );

      // Check if user has installed the app (PWA standalone) on any device
      const isappinstalled = userInsts.some(
        (inst) => inst.appType === "PWA"
      );

      const isGuestuser = Boolean(u.isGuest);
      const isRegistered = !u.isGuest;

      return {
        ...u,
        isRegistered,
        isGuestuser,
        IsPermissionEnabled,
        isappinstalled,
        level: s.level || 1,
        xp: s.xp || 0,
        title: s.title || "Rookie",
        avatar: s.avatar || "1",
        country: s.country || "IN",
        description: s.description || "",
        totalGames: s.totalGames || 0,
        offlineGamesPlayed: s.offlineGamesPlayed || 0,
        totalWins: s.totalWins || 0,
        lastPlayedAt: s.lastPlayedAt || u.createdAt,
      };
    });

    const enrichedGuests = guests.map((g) => {
      const guestInsts = installationsByGuestDevice.get(g.guestDeviceId) || [];
      const IsPermissionEnabled = guestInsts.some(
        (inst) => inst.permission === "GRANTED" && inst.notificationsEnabled !== false
      );
      const isappinstalled = guestInsts.some(
        (inst) => inst.appType === "PWA"
      );

      return {
        _id: g._id,
        guestDeviceId: g.guestDeviceId,
        username: g.username || `Guest (${g.guestDeviceId.slice(0, 8)})`,
        role: "guest",
        isGuest: true,
        isRegistered: false,
        isGuestuser: true,
        IsPermissionEnabled,
        isappinstalled,
        isBanned: false,
        level: 1,
        xp: 0,
        title: "Guest Player",
        avatar: "1",
        country: "IN",
        description: `Guest Device ID: ${g.guestDeviceId}`,
        totalGames: g.gamesPlayed || g.matchesCompleted || 0,
        offlineGamesPlayed: g.offlineGamesPlayed || 0,
        totalWins: 0,
        createdAt: g.firstSeenAt || g.createdAt,
        lastPlayedAt: g.lastPlayedAt || g.lastSeenAt,
      };
    });

    let combined = [...enrichedUsers, ...enrichedGuests];
    combined.sort((a, b) => new Date(b.createdAt || b.lastPlayedAt || 0) - new Date(a.createdAt || a.lastPlayedAt || 0));

    if (combined.length > limit) {
      combined = combined.slice(0, limit);
    }

    res.json({ success: true, count: combined.length, users: combined });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

export async function createAdminUser(req, res) {
  try {
    const { username, password, role = "user", level = 1, xp = 0, title = "Rookie" } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }
    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: "Password must be between 12 and 128 characters" });
    }

    const trimmed = username.trim();
    const existing = await User.findOne({ username: new RegExp(`^${trimmed}$`, "i") });
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const user = new User({ username: trimmed, passwordHash: await hashPassword(password), role, isGuest: false });
    await user.save();

    const stats = new PlayerStats({
      userId: user._id,
      username: user.username,
      level: Number(level) || 1,
      xp: Number(xp) || 0,
      title: title || "Rookie",
    });
    await stats.save();

    res.json({ success: true, user, stats });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, role, isBanned, level, xp, title, avatar, description, country } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username && username.trim() !== user.username) {
      const trimmed = username.trim();
      const existing = await User.findOne({ _id: { $ne: id }, username: new RegExp(`^${trimmed}$`, "i") });
      if (existing) {
        return res.status(400).json({ error: "Username already taken by another account" });
      }
      user.username = trimmed;
    }

    if (role && ["user", "admin"].includes(role)) {
      user.role = role;
    }

    if (typeof isBanned === "boolean") {
      user.isBanned = isBanned;
    }

    await user.save();

    // Update PlayerStats
    let stats = await PlayerStats.findOne({ userId: id });
    if (!stats) {
      stats = new PlayerStats({ userId: id, username: user.username });
    }

    stats.username = user.username;
    if (level !== undefined) stats.level = Number(level);
    if (xp !== undefined) stats.xp = Number(xp);
    if (title !== undefined) stats.title = title;
    if (avatar !== undefined) stats.avatar = avatar;
    if (description !== undefined) stats.description = description;
    if (country !== undefined) stats.country = country;

    await stats.save();

    res.json({ success: true, user, stats });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findByIdAndDelete(id);
    if (user) {
      await PlayerStats.deleteOne({ userId: id });
      return res.json({ success: true, message: `User ${user.username} deleted successfully.` });
    }

    const guest = await GuestSession.findByIdAndDelete(id);
    if (guest) {
      return res.json({ success: true, message: `Guest tester ${guest.username || guest.guestDeviceId} deleted successfully.` });
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

export async function toggleBanUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ success: true, isBanned: user.isBanned, message: `User ${user.username} is now ${user.isBanned ? "banned" : "unbanned"}.` });
  } catch (error) {
    console.error("Error toggling ban:", error);
    res.status(500).json({ error: "Failed to toggle ban status" });
  }
}

// 4. Live Rooms Management
export function getActiveRoomsData(roomsMap) {
  const roomsList = [];
  if (roomsMap) {
    roomsMap.forEach((room, roomCode) => {
      roomsList.push({
        roomCode,
        mode: room.gameMode || "CLASSIC_POINTS",
        gameState: room.gameState || "LOBBY",
        rounds: room.rounds || 5,
        currentRound: room.currentRound || 1,
        playersCount: room.players ? room.players.length : 0,
        players: (room.players || []).map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score || 0,
          isHost: p.isHost || false,
          isReady: p.isReady || false,
          socketId: p.socketId,
        })),
        createdAt: room.createdAt || new Date(),
      });
    });
  }
  return roomsList;
}

export function closeRoom(roomsMap, io, roomCode) {
  if (!roomsMap || !roomsMap.has(roomCode)) {
    return false;
  }

  // Notify all players in room via Socket.io
  if (io) {
    io.to(roomCode).emit("admin_room_closed", {
      reason: "This room was closed by an Administrator.",
    });
  }

  roomsMap.delete(roomCode);
  return true;
}

export function kickPlayer(roomsMap, io, roomCode, playerId) {
  if (!roomsMap || !roomsMap.has(roomCode)) {
    return false;
  }

  const room = roomsMap.get(roomCode);
  const playerIndex = room.players.findIndex((p) => p.id === playerId || p.socketId === playerId);
  
  if (playerIndex === -1) {
    return false;
  }

  const [kickedPlayer] = room.players.splice(playerIndex, 1);

  // If host was kicked, reassign host if players remain
  if (kickedPlayer.isHost && room.players.length > 0) {
    room.players[0].isHost = true;
  }

  // Notify kicked player and remaining players
  if (io) {
    if (kickedPlayer.socketId) {
      io.to(kickedPlayer.socketId).emit("admin_player_kicked", {
        reason: "You were kicked from the room by an Administrator.",
      });
    }
    io.to(roomCode).emit("room_updated", room);
  }

  // If no players left, cleanup room
  if (room.players.length === 0) {
    roomsMap.delete(roomCode);
  }

  return true;
}

// 5. Player Stats CRUD
export async function getPlayerStatsList(req, res) {
  try {
    const search = req.query.search || "";
    const limit = parseInt(req.query.limit) || 100;

    let query = {};
    if (search) {
      query.username = { $regex: search, $options: "i" };
    }

    const stats = await PlayerStats.find(query).sort({ totalWins: -1, xp: -1 }).limit(limit).lean();

    const statsWithAllModes = await Promise.all(
      stats.map(async (st) => {
        const userId = st.userId;
        const detective = userId ? await DetectiveChallengeStats.findOne({ userId }).lean() : null;
        const modern = userId ? await ModernModeStats.findOne({ userId }).lean() : null;
        return {
          ...st,
          detectiveStats: detective || null,
          modernStats: modern || null,
        };
      })
    );

    res.json({ success: true, count: statsWithAllModes.length, stats: statsWithAllModes });
  } catch (error) {
    console.error("Error fetching stats list:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}

export async function updatePlayerStatsRecord(req, res) {
  try {
    const { id } = req.params; // Stats doc _id or userId
    const updateData = req.body;

    let stats = await PlayerStats.findById(id);
    if (!stats) {
      stats = await PlayerStats.findOne({ userId: id });
    }

    if (!stats) {
      return res.status(404).json({ error: "Player stats record not found" });
    }

    // Classic Stats
    if (updateData.xp !== undefined) stats.xp = Number(updateData.xp);
    if (updateData.level !== undefined) stats.level = Number(updateData.level);
    if (updateData.title !== undefined) stats.title = updateData.title;
    if (updateData.totalGames !== undefined) stats.totalGames = Number(updateData.totalGames);
    if (updateData.totalWins !== undefined) stats.totalWins = Number(updateData.totalWins);
    if (updateData.totalLosses !== undefined) stats.totalLosses = Number(updateData.totalLosses);
    if (updateData.totalScore !== undefined) stats.totalScore = Number(updateData.totalScore);
    if (updateData.currentWinStreak !== undefined) stats.currentWinStreak = Number(updateData.currentWinStreak);
    if (updateData.longestWinStreak !== undefined) stats.longestWinStreak = Number(updateData.longestWinStreak);
    
    if (updateData.roleStats) {
      stats.roleStats = { ...stats.roleStats, ...updateData.roleStats };
    }
    await stats.save();

    // Detective Challenge Stats
    if (updateData.detectiveStats && stats.userId) {
      let dcStats = await DetectiveChallengeStats.findOne({ userId: stats.userId });
      if (dcStats) {
        if (updateData.detectiveStats.gamesPlayed !== undefined) dcStats.gamesPlayed = Number(updateData.detectiveStats.gamesPlayed);
        if (updateData.detectiveStats.gamesWon !== undefined) dcStats.gamesWon = Number(updateData.detectiveStats.gamesWon);
        if (updateData.detectiveStats.overallAccuracy !== undefined) dcStats.overallAccuracy = Number(updateData.detectiveStats.overallAccuracy);
        if (updateData.detectiveStats.xp !== undefined) dcStats.xp = Number(updateData.detectiveStats.xp);
        if (updateData.detectiveStats.level !== undefined) dcStats.level = Number(updateData.detectiveStats.level);
        if (updateData.detectiveStats.title !== undefined) dcStats.title = updateData.detectiveStats.title;
        await dcStats.save();
      }
    }

    // Modern Mode Stats
    if (updateData.modernStats && stats.userId) {
      let mStats = await ModernModeStats.findOne({ userId: stats.userId });
      if (mStats) {
        if (updateData.modernStats.gamesPlayed !== undefined) mStats.gamesPlayed = Number(updateData.modernStats.gamesPlayed);
        if (updateData.modernStats.gamesWon !== undefined) mStats.gamesWon = Number(updateData.modernStats.gamesWon);
        if (updateData.modernStats.totalScore !== undefined) mStats.totalScore = Number(updateData.modernStats.totalScore);
        if (updateData.modernStats.highestScore !== undefined) mStats.highestScore = Number(updateData.modernStats.highestScore);
        await mStats.save();
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error updating player stats record:", error);
    res.status(500).json({ error: "Failed to update player stats record" });
  }
}

export async function resetPlayerStatsRecord(req, res) {
  try {
    const { id } = req.params;
    let stats = await PlayerStats.findById(id);
    if (!stats) {
      stats = await PlayerStats.findOne({ userId: id });
    }

    if (!stats) {
      return res.status(404).json({ error: "Player stats record not found" });
    }

    stats.level = 1;
    stats.xp = 0;
    stats.title = "Rookie";
    stats.totalGames = 0;
    stats.totalWins = 0;
    stats.totalLosses = 0;
    stats.totalRoundsPlayed = 0;
    stats.totalScore = 0;
    stats.totalTimePlayed = 0;
    stats.currentWinStreak = 0;
    stats.longestWinStreak = 0;
    stats.roleStats = {
      raja: { timesAssigned: 0, totalPoints: 0 },
      rani: { timesAssigned: 0, totalPoints: 0 },
      police: { timesAssigned: 0, correctCatches: 0, wrongGuesses: 0, accuracy: 0 },
      thief: { timesAssigned: 0, escaped: 0, caught: 0, escapeRate: 0 },
    };
    await stats.save();

    if (stats.userId) {
      await DetectiveChallengeStats.findOneAndUpdate(
        { userId: stats.userId },
        { gamesPlayed: 0, gamesWon: 0, totalCorrectGuesses: 0, totalWrongGuesses: 0, overallAccuracy: 0, averageGuessTime: 0, fastestGuessTime: 0, longestStreak: 0, currentStreak: 0, level: 1, xp: 0 }
      );
      await ModernModeStats.findOneAndUpdate(
        { userId: stats.userId },
        { gamesPlayed: 0, gamesWon: 0, totalScore: 0, highestScore: 0, currentWinStreak: 0, longestWinStreak: 0, timesRaja: 0, timesRani: 0, timesPolice: 0, timesThief: 0, timesMantri: 0, timesVillager: 0 }
      );
    }

    res.json({ success: true, message: "Player statistics reset across all modes.", stats });
  } catch (error) {
    console.error("Error resetting stats:", error);
    res.status(500).json({ error: "Failed to reset stats" });
  }
}

// 6. Match History Management
export async function getMatchesList(req, res) {
  try {
    const search = req.query.search || "";
    const gameMode = req.query.gameMode || "";
    const limit = parseInt(req.query.limit) || 100;

    const searchRegex = search ? new RegExp(search, "i") : null;

    let classicMatches = [];
    let dcMatches = [];
    let modernMatches = [];

    if (!gameMode || gameMode === "all" || gameMode === "CLASSIC_POINTS") {
      let query = {};
      if (searchRegex) {
        query = {
          $or: [{ roomCode: searchRegex }, { winnerUsername: searchRegex }, { "players.username": searchRegex }],
        };
      }
      classicMatches = await MatchHistory.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    }

    if (!gameMode || gameMode === "all" || gameMode === "DETECTIVE_CHALLENGE") {
      let query = {};
      if (searchRegex) {
        query = {
          $or: [{ roomCode: searchRegex }, { championUsername: searchRegex }, { "players.username": searchRegex }],
        };
      }
      dcMatches = await DetectiveChallengeMatch.find(query).sort({ endedAt: -1 }).limit(limit).lean();
      dcMatches = dcMatches.map((m) => ({
        _id: m._id,
        roomCode: m.roomCode,
        gameMode: "DETECTIVE_CHALLENGE",
        createdAt: m.endedAt || m.createdAt,
        winnerUsername: m.championUsername || "None",
        players: (m.players || []).map((p) => ({
          userId: p.userId,
          username: p.username || p.name || "Player",
          score: p.correctCount !== undefined ? `${p.correctCount} correct` : (p.score || 0),
          rank: p.rank || 1,
          isWinner: p.isChampion || false,
        })),
        details: `${m.players?.length || 0} Detectives`,
      }));
    }

    if (!gameMode || gameMode === "all" || gameMode === "MODERN_MODE") {
      let query = {};
      if (searchRegex) {
        query = {
          $or: [{ roomCode: searchRegex }, { winnerName: searchRegex }, { "players.name": searchRegex }],
        };
      }
      modernMatches = await ModernModeMatch.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      modernMatches = modernMatches.map((m) => ({
        _id: m._id,
        roomCode: m.roomCode,
        gameMode: "MODERN_MODE",
        createdAt: m.createdAt,
        winnerUsername: m.winnerName || "None",
        players: (m.players || []).map((p) => ({
          userId: p.userId,
          username: p.name || p.username || "Player",
          score: p.finalScore ?? p.score ?? p.baseScore ?? 0,
          rank: p.rank || 1,
          isWinner: p.isWinner || false,
          role: p.role,
        })),
        details: `6 Kingdom Roles`,
      }));
    }

    const matches = [...classicMatches, ...dcMatches, ...modernMatches]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    console.error("Error fetching match history:", error);
    res.status(500).json({ error: "Failed to fetch match history" });
  }
}

export async function deleteMatchRecord(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }

    const match = await MatchHistory.findByIdAndDelete(id);
    if (!match) {
      return res.status(404).json({ error: "Match record not found" });
    }

    res.json({ success: true, message: "Match history record deleted successfully" });
  } catch (error) {
    console.error("Error deleting match record:", error);
    res.status(500).json({ error: "Failed to delete match record" });
  }
}

export async function clearAllMatches(req, res) {
  try {
    await MatchHistory.deleteMany({});
    res.json({ success: true, message: "All match history logs cleared." });
  } catch (error) {
    console.error("Error clearing match history:", error);
    res.status(500).json({ error: "Failed to clear match history" });
  }
}

// 7. System Broadcast & Controls
export function broadcastSystemMessage(io, message, type = "info") {
  if (!io) return false;
  io.emit("system_announcement", {
    message,
    type,
    timestamp: new Date().toISOString(),
  });
  return true;
}

// 8. Modern Mode Dashboard Analytics & Leaderboard Snapshot
export async function getModernModeAdminData(req, res) {
  try {
    const totalMatches = await ModernModeMatch.countDocuments();
    const totalPlayers = await ModernModeStats.countDocuments();

    const recentMatches = await ModernModeMatch.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const topLeaderboard = await ModernModeStats.find()
      .sort({ gamesWon: -1, totalScore: -1 })
      .limit(10)
      .lean();

    // Calculate aggregated role stats & average score
    const allStats = await ModernModeStats.find().lean();
    let totalScoreSum = 0;
    let rolesCount = {
      raja: 0,
      rani: 0,
      mantri: 0,
      police: 0,
      thief: 0,
      villager: 0,
    };

    allStats.forEach((st) => {
      totalScoreSum += st.totalScore || 0;
      rolesCount.raja += st.timesRaja || 0;
      rolesCount.rani += st.timesRani || 0;
      rolesCount.mantri += st.timesMantri || 0;
      rolesCount.police += st.timesPolice || 0;
      rolesCount.thief += st.timesThief || 0;
      rolesCount.villager += st.timesVillager || 0;
    });

    const avgScorePerPlayer = totalPlayers > 0 ? Math.round(totalScoreSum / totalPlayers) : 0;

    res.json({
      success: true,
      metrics: {
        totalMatches,
        totalPlayers,
        avgScorePerPlayer,
        rolesCount,
      },
      recentMatches,
      topLeaderboard: topLeaderboard.map((item, idx) => ({
        rank: idx + 1,
        userId: item.userId,
        username: item.username,
        level: item.level || 1,
        gamesPlayed: item.gamesPlayed || 0,
        gamesWon: item.gamesWon || 0,
        totalScore: item.totalScore || 0,
        highestScore: item.highestScore || 0,
        currentWinStreak: item.currentWinStreak || 0,
        longestWinStreak: item.longestWinStreak || 0,
        roleStats: {
          raja: item.timesRaja || 0,
          rani: item.timesRani || 0,
          mantri: item.timesMantri || 0,
          police: item.timesPolice || 0,
          thief: item.timesThief || 0,
          villager: item.timesVillager || 0,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching modern mode admin data:", error);
    res.status(500).json({ error: "Failed to fetch Modern Mode dashboard data" });
  }
}

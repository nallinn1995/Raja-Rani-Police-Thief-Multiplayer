import GuestSession from "../models/GuestSession.js";

export const GuestTrackingService = {
  /**
   * Record or update a guest device ping
   */
  async recordGuestPing(guestDeviceId, username) {
    if (!guestDeviceId || typeof guestDeviceId !== "string") return null;

    const trimmedId = guestDeviceId.trim().slice(0, 100);
    const trimmedUsername = username ? String(username).trim().slice(0, 30) : undefined;

    const updateFields = {
      lastSeenAt: new Date(),
    };
    if (trimmedUsername) {
      updateFields.username = trimmedUsername;
    }

    try {
      const guest = await GuestSession.findOneAndUpdate(
        { guestDeviceId: trimmedId },
        {
          $set: updateFields,
          $setOnInsert: {
            guestDeviceId: trimmedId,
            firstSeenAt: new Date(),
            gamesPlayed: 0,
            matchesCompleted: 0,
            lastPlayedMode: "",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return guest;
    } catch (err) {
      console.error("Error recording guest ping:", err.message);
      return null;
    }
  },

  /**
   * Record when a guest creates or joins a game room
   */
  async recordGuestActivity(guestDeviceId, username, gameMode) {
    if (!guestDeviceId || typeof guestDeviceId !== "string") return null;

    const trimmedId = guestDeviceId.trim().slice(0, 100);
    const trimmedUsername = username ? String(username).trim().slice(0, 30) : undefined;
    const now = new Date();

    const updateFields = {
      lastSeenAt: now,
      lastPlayedAt: now,
      lastPlayedMode: gameMode || "CLASSIC_POINTS",
    };
    if (trimmedUsername) {
      updateFields.username = trimmedUsername;
    }

    try {
      const guest = await GuestSession.findOneAndUpdate(
        { guestDeviceId: trimmedId },
        {
          $set: updateFields,
          $inc: { gamesPlayed: 1 },
          $setOnInsert: {
            guestDeviceId: trimmedId,
            firstSeenAt: now,
            matchesCompleted: 0,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return guest;
    } catch (err) {
      console.error("Error recording guest activity:", err.message);
      return null;
    }
  },

  /**
   * Record when a guest finishes a full match
   */
  async recordGuestMatchCompleted(guestDeviceId, username, gameMode) {
    if (!guestDeviceId || typeof guestDeviceId !== "string") return null;

    const trimmedId = guestDeviceId.trim().slice(0, 100);
    const trimmedUsername = username ? String(username).trim().slice(0, 30) : undefined;
    const now = new Date();

    const updateFields = {
      lastSeenAt: now,
      lastPlayedAt: now,
      lastPlayedMode: gameMode || "CLASSIC_POINTS",
    };
    if (trimmedUsername) {
      updateFields.username = trimmedUsername;
    }

    try {
      const guest = await GuestSession.findOneAndUpdate(
        { guestDeviceId: trimmedId },
        {
          $set: updateFields,
          $inc: { matchesCompleted: 1 },
          $setOnInsert: {
            guestDeviceId: trimmedId,
            firstSeenAt: now,
            gamesPlayed: 1,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return guest;
    } catch (err) {
      console.error("Error recording guest match completion:", err.message);
      return null;
    }
  },
};

export default GuestTrackingService;

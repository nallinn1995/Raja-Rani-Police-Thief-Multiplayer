import express from "express";
import path from "path";
import { createServer } from "http"; // createServer is used instead of require('http')
import { Server as SocketIoServer } from "socket.io"; // Rename import for clarity
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(express.static(path.join(__dirname, "../dist")));

// Example API endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

const io = new SocketIoServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

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
app.post("/api/rooms", (req, res) => {
  const { roomName, playerName, totalRounds } = req.body;

  if (!roomName || !playerName || !totalRounds) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (totalRounds < 1 || totalRounds > 10) {
    return res
      .status(400)
      .json({ error: "Total rounds must be between 1 and 10" });
  }

  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  const room = {
    id: roomCode,
    name: roomName,
    totalRounds: parseInt(totalRounds),
    currentRound: 0,
    players: [
      {
        id: uuidv4(),
        name: playerName,
        isHost: true,
        score: 0,
        role: null,
        socketId: null,
      },
    ],
    gameState: "waiting", // waiting, role-assignment, police-reveal, guessing, results, finished
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
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        score: p.score,
      })),
    },
  });
});

// Join room endpoint
app.post("/api/rooms/:roomCode/join", (req, res) => {
  const { roomCode } = req.params;
  const { playerName } = req.body;

  if (!playerName) {
    return res.status(400).json({ error: "Player name is required" });
  }

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
    room.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())
  ) {
    return res.status(400).json({ error: "Player name already taken" });
  }

  const newPlayer = {
    id: uuidv4(),
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

  // Start game if room is full
  if (room.players.length === 4) {
    setTimeout(() => startGame(roomCode), 2000);
  }
});

// Socket connection handling

io.on("connection_error", (err) => {
  console.log("🚨 Engine connection error:", err.code, err.message);
});
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // socket.on("join-room", ({ roomCode, playerId }) => {
  //   const upperCode = roomCode.toUpperCase();
  //   const room = rooms.get(upperCode);

  //   if (!room) {
  //     socket.emit("error", { message: "Room not found" });
  //     return;
  //   }

  //   if (room && room.players.some((p) => p.id === playerId)) {
  //     socket.join(roomCode);

  //     // Update player's socket ID
  //     const player = room.players.find((p) => p.id === playerId);
  //     if (player) {
  //       player.socketId = socket.id;
  //       playerSockets.set(socket.id, { roomCode, playerId });
  //       console.log(`✅ Player ${playerId} reconnected to room ${upperCode}`);
  //       io.to(upperCode).emit("player-reconnected", { playerId });
  //     }

  //     // Send current room state
  //     socket.emit("room-state", {
  //       room: {
  //         id: room.id,
  //         name: room.name,
  //         totalRounds: room.totalRounds,
  //         currentRound: room.currentRound,
  //         gameState: room.gameState,
  //         players: room.players.map((p) => ({
  //           id: p.id,
  //           name: p.name,
  //           isHost: p.isHost,
  //           score: p.score,
  //           role: p.id === playerId ? p.role : null,
  //           disconnected: !!p.disconnected,
  //         })),
  //       },
  //       playerId,
  //       policeId: room.policeId,
  //     });

  //     // Send messages
  //     socket.emit("chat-history", room.messages);
  //   }
  // });
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

    socket.emit("chat-history", room.messages);
  });
  socket.on("chat-message", ({ roomCode, playerId, message }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (room) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        const chatMessage = {
          id: uuidv4(),
          playerId,
          playerName: player.name,
          message,
          timestamp: new Date().toISOString(),
        };

        room.messages.push(chatMessage);
        io.to(roomCode).emit("chat-message", chatMessage);
      }
    }
  });

  socket.on("police-reveal", ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (room && room.gameState === "police-reveal") {
      const player = room.players.find((p) => p.id === playerId);
      if (player && player.role === "Police") {
        room.gameState = "guessing";
        room.policeId = playerId;

        // Send all roles to police player
        socket.emit("all-roles", {
          players: room.players.map((p) => ({
            id: p.id,
            name: p.name,
            role: p.role,
          })),
        });

        io.to(roomCode).emit("police-revealed", {
          policeId: playerId,
          policeName: player.name,
        });
      }
    }
  });

  socket.on("make-guess", ({ roomCode, playerId, guessedThiefId }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (room && room.gameState === "guessing" && room.policeId === playerId) {
      const thief = room.players.find((p) => p.role === "Thief");
      const isCorrect = thief.id === guessedThiefId;

      // Calculate scores
      if (isCorrect) {
        room.players.find((p) => p.role === "Police").score += 100;
        room.players.find((p) => p.role === "Raja").score += 500;
        room.players.find((p) => p.role === "Rani").score += 600;
        room.players.find((p) => p.role === "Thief").score += 0;
      } else {
        room.players.find((p) => p.role === "Thief").score += 100;
        room.players.find((p) => p.role === "Police").score += 0;
        room.players.find((p) => p.role === "Raja").score += 500;
        room.players.find((p) => p.role === "Rani").score += 600;
        // room.players.forEach((p) => {
        //   if (p.role !== "Thief") p.score += 1;
        // });
      }

      room.gameState = "results";
      room.currentGuess = { guessedThiefId, isCorrect };

      io.to(roomCode).emit("round-result", {
        isCorrect,
        thief: { id: thief.id, name: thief.name },
        guessedPlayer: room.players.find((p) => p.id === guessedThiefId),
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          score: p.score,
        })),
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
      });

      // Auto-advance to next round or end game
      setTimeout(() => {
        if (room.currentRound >= room.totalRounds) {
          endGame(roomCode);
        } else {
          startNextRound(roomCode);
        }
      }, 5000);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

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
        endGame(roomCode);
      }
    }, DISCONNECT_TIMEOUT);
  });
});

function startGame(roomCode) {
  const room = rooms.get(roomCode.toUpperCase());
  if (room && room.players.length === 4) {
    startNextRound(roomCode);
  }
}

function startNextRound(roomCode) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return;

  room.currentRound++;
  room.gameState = "role-assignment";
  room.policeId = null;
  room.currentGuess = null;

  // Assign roles randomly
  const roles = shuffleArray(["Raja", "Rani", "Police", "Thief"]);
  room.players.forEach((player, index) => {
    player.role = roles[index];
  });

  io.to(roomCode).emit("game-started", {
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
    })),
  });

  // Send individual roles
  room.players.forEach((player) => {
    if (player.socketId) {
      io.to(player.socketId).emit("role-assigned", {
        role: player.role,
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.id === player.id ? p.role : null,
        })),
      });
    }
  });

  // Move to police reveal phase after animation
  setTimeout(() => {
    room.gameState = "police-reveal";
    io.to(roomCode).emit("police-reveal-phase");
  }, 3000);
}

function endGame(roomCode) {
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

  // Clean up room after 5 minutes
  setTimeout(() => {
    rooms.delete(roomCode.toUpperCase());
  }, 60000);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

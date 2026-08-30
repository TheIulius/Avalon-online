import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { RoomManager } from "./RoomManager.js";
import { setupSignaling } from "./signaling.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const isDev = process.env.NODE_ENV !== "production";

app.use(cors({ origin: isDev ? "*" : undefined }));

const io = new Server(httpServer, {
  cors: { origin: isDev ? "*" : undefined },
});

const roomManager = new RoomManager(io);

io.on("connection", (socket) => {
  console.log(`[Connected] ${socket.id}`);

  // ─── Room Management ───────────────────────────────────────────────

  socket.on("room:create", (data: { playerName: string }, callback: Function) => {
    const playerId = uuidv4();
    
    // We must generate the code first so the socket can join before we add them to the room logic
    const code = roomManager.generateCode();
    socket.join(code);

    const { sessionToken } = roomManager.createRoomWithCode(
      code,
      socket.id,
      playerId,
      data.playerName
    );

    console.log(`[Room created] ${code} by ${data.playerName}`);
    callback({
      success: true,
      roomCode: code,
      playerId,
      sessionToken,
      hostId: playerId,
    });
  });

  socket.on(
    "room:join",
    (data: { roomCode: string; playerName: string }, callback: Function) => {
      const playerId = uuidv4();
      const code = data.roomCode.toUpperCase();
      const result = roomManager.joinRoom(code, socket.id, playerId, data.playerName);
      if (result) {
        socket.join(code);
        console.log(`[Joined] ${data.playerName} → ${code}`);
        callback({
          success: true,
          roomCode: code,
          playerId,
          sessionToken: result.sessionToken,
        });
      } else {
        callback({
          success: false,
          error: "Room not found, full, or game already in progress.",
        });
      }
    }
  );

  socket.on(
    "room:rejoin",
    (data: { roomCode: string; sessionToken: string }, callback: Function) => {
      const code = data.roomCode.toUpperCase();
      const result = roomManager.rejoinRoom(code, socket.id, data.sessionToken);
      if (result) {
        socket.join(code);
        console.log(`[Rejoined] ${result.playerId} → ${code}`);
        callback({
          success: true,
          roomCode: code,
          playerId: result.playerId,
        });
      } else {
        callback({
          success: false,
          error: "Invalid session or room not found.",
        });
      }
    }
  );

  socket.on("room:leave", () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room) {
      socket.leave(room.code);
    }
    roomManager.leaveRoom(socket.id);
  });

  // ─── Game Actions ──────────────────────────────────────────────────

  socket.on("game:action", (action: any) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.getPlayerBySocket(socket.id);
    if (!player) return;
    room.handleAction(player.id, action);
  });

  // ─── Chat ──────────────────────────────────────────────────────────

  socket.on("chat:message", (data: { text: string }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.getPlayerBySocket(socket.id);
    if (!player) return;
    room.broadcastChat(data, player.id);
  });

  // ─── WebRTC Signaling ─────────────────────────────────────────────

  setupSignaling(socket, roomManager);

  // ─── Disconnect ───────────────────────────────────────────────────

  socket.on("disconnect", () => {
    console.log(`[Disconnected] ${socket.id}`);
    roomManager.leaveRoom(socket.id);
  });
});

// ─── Static Files (Production) ─────────────────────────────────────────────

if (!isDev) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ─── Start ─────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3001", 10);
httpServer.listen(PORT, () => {
  console.log(`🏰 Avalon server listening on port ${PORT}`);
});

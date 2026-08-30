import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager.js";

/**
 * Set up WebRTC signaling relay on a socket.
 * Simply forwards SDP offers/answers and ICE candidates between peers.
 * No media processing — purely peer-to-peer after signaling completes.
 */
export function setupSignaling(socket: Socket, roomManager: RoomManager) {
  socket.on(
    "webrtc:signal",
    (data: { targetPlayerId: string; signal: unknown }) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) return;

      const senderPlayer = room.getPlayerBySocket(socket.id);
      if (!senderPlayer) return;

      const targetSocketId = room.getSocketByPlayer(data.targetPlayerId);
      if (targetSocketId) {
        // Forward the signal to the target player with sender's identity
        socket.to(targetSocketId).emit("webrtc:signal", {
          fromPlayerId: senderPlayer.id,
          signal: data.signal,
        });
      }
    }
  );
}

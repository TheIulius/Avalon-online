import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@avalon/shared';
import { GameRoom } from './GameRoom.js';

export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (room.isEmpty && now - room.lastActive > 30 * 60 * 1000) {
          this.rooms.delete(code);
        }
      }
    }, 5 * 60 * 1000);
  }

  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(socketId: string, playerId: string, playerName: string): { code: string, sessionToken: string } {
    const code = this.generateCode();
    const { sessionToken } = this.createRoomWithCode(code, socketId, playerId, playerName);
    return { code, sessionToken };
  }

  createRoomWithCode(code: string, socketId: string, playerId: string, playerName: string): { sessionToken: string } {
    const room = new GameRoom(code, this.io);
    this.rooms.set(code, room);
    const sessionToken = room.addPlayer(playerId, playerName, socketId);
    return { sessionToken };
  }

  joinRoom(code: string, socketId: string, playerId: string, playerName: string): { sessionToken: string } | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;
    
    if (room.state.phase !== 'LOBBY' && !room.players.has(playerId)) {
      return null;
    }
    
    const sessionToken = room.addPlayer(playerId, playerName, socketId);
    return { sessionToken };
  }

  rejoinRoom(code: string, socketId: string, sessionToken: string): { playerId: string } | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;
    
    for (const [playerId, player] of room.players.entries()) {
      if (player.sessionToken === sessionToken) {
        room.reconnectPlayer(playerId, socketId);
        return { playerId };
      }
    }
    
    return null;
  }

  leaveRoom(socketId: string) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.getPlayerBySocket(socketId);
      if (player) {
        room.disconnectPlayerBySocket(socketId);
        if (room.isEmpty && room.state.phase === 'LOBBY') {
          this.rooms.delete(code);
        }
        break;
      }
    }
  }

  getRoomBySocket(socketId: string): GameRoom | null {
    for (const room of this.rooms.values()) {
      if (room.getPlayerBySocket(socketId)) {
        return room;
      }
    }
    return null;
  }
}

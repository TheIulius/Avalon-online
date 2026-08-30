import {
  GameState,
  GameActionPayload,
  GameAction,
  gameReducer,
  makeInitialState,
  ServerToClientEvents,
  ClientToServerEvents,
  PublicGameState,
  PublicPlayer,
  PublicQuestRecord,
  PublicProposal,
  ChatMessage,
} from "@avalon/shared";
import { Server } from "socket.io";
import { buildPublicState, buildPrivateState } from "./stateFilter.js";
import { v4 as uuidv4 } from "uuid";

export interface PlayerConnection {
  socketId: string | null;
  sessionToken: string;
  name: string;
  connected: boolean;
}

export class GameRoom {
  public state: GameState;
  public players = new Map<string, PlayerConnection>();
  public hostId: string = "";
  public lastActive: number = Date.now();
  private io: Server;
  public code: string;

  constructor(code: string, io: Server) {
    this.code = code;
    this.io = io;
    this.state = makeInitialState();
  }

  addPlayer(id: string, name: string, socketId: string): string {
    const sessionToken = uuidv4();
    this.players.set(id, {
      socketId,
      sessionToken,
      name,
      connected: true,
    });

    // If this is the first player, they become the host
    if (this.players.size === 1) {
      this.hostId = id;
    }

    // Add to game state if not already present
    if (!this.state.players.find((p: any) => p.id === id)) {
      this.state = gameReducer(this.state, { type: "ADD_PLAYER", id, name });
    }

    this.lastActive = Date.now();
    this.broadcastState();
    this.broadcastRoomState();
    return sessionToken;
  }

  reconnectPlayer(id: string, socketId: string): boolean {
    const player = this.players.get(id);
    if (!player) return false;

    player.socketId = socketId;
    player.connected = true;
    this.lastActive = Date.now();

    // Update game state
    this.state = gameReducer(this.state, {
      type: "PLAYER_RECONNECTED",
      playerId: id,
    });

    this.broadcastState();
    this.broadcastRoomState();

    // Notify other players
    this.io.to(this.code).emit("player:reconnected", { playerId: id });
    return true;
  }

  disconnectPlayerBySocket(socketId: string) {
    for (const [id, player] of this.players.entries()) {
      if (player.socketId === socketId) {
        player.connected = false;
        player.socketId = null;

        if (this.state.phase === "LOBBY") {
          // In lobby, fully remove the player
          this.state = gameReducer(this.state, { type: "REMOVE_PLAYER", id });
          this.players.delete(id);

          // If host left, assign new host
          if (id === this.hostId && this.players.size > 0) {
            this.hostId = this.players.keys().next().value!;
          }
        } else {
          // Mid-game, mark as disconnected
          this.state = gameReducer(this.state, {
            type: "PLAYER_DISCONNECTED",
            playerId: id,
          });
          this.io
            .to(this.code)
            .emit("player:disconnected", { playerId: id });
        }

        this.broadcastState();
        this.broadcastRoomState();
        break;
      }
    }
  }

  getPlayerBySocket(
    socketId: string
  ): { id: string; connection: PlayerConnection } | null {
    for (const [id, connection] of this.players.entries()) {
      if (connection.socketId === socketId) {
        return { id, connection };
      }
    }
    return null;
  }

  getSocketByPlayer(playerId: string): string | null {
    return this.players.get(playerId)?.socketId ?? null;
  }

  handleAction(senderId: string, actionPayload: GameActionPayload) {
    this.lastActive = Date.now();

    const sender = this.state.players.find((p: any) => p.id === senderId);
    if (!sender) return;

    const leaderId = this.state.players[this.state.leaderIndex]?.id;
    const isLeader = senderId === leaderId;
    const isHost = senderId === this.hostId;
    const isAssassin = senderId === this.state.assassinId;

    // Build the internal GameAction from the client's payload, injecting sender identity
    let action: GameAction | null = null;

    switch (actionPayload.type) {
      case "SET_ROLE_OPTIONS":
        if (!isHost) return;
        action = { type: "SET_ROLE_OPTIONS", options: actionPayload.options };
        break;

      case "START_GAME":
        if (!isHost) return;
        action = { type: "START_GAME" };
        break;

      case "ACK_ROLE_REVEAL":
        action = { type: "ACK_ROLE_REVEAL", playerId: senderId };
        break;

      case "TOGGLE_TEAM_MEMBER":
        if (!isLeader) return;
        action = {
          type: "TOGGLE_TEAM_MEMBER",
          playerId: actionPayload.playerId,
        };
        break;

      case "PROPOSE_TEAM":
        if (!isLeader) return;
        action = { type: "PROPOSE_TEAM" };
        break;

      case "CAST_TEAM_VOTE":
        action = {
          type: "CAST_TEAM_VOTE",
          playerId: senderId,
          vote: actionPayload.vote,
        };
        break;

      case "CAST_QUEST_CARD": {
        // Validate sender is on the quest team
        const quest = this.state.quests[this.state.currentQuestIndex];
        if (!quest?.teamPlayerIds.includes(senderId)) return;
        action = {
          type: "CAST_QUEST_CARD",
          playerId: senderId,
          card: actionPayload.card,
        };
        break;
      }

      case "ACK_TEAM_VOTE_RESULT":
        action = { type: "ACK_TEAM_VOTE_RESULT" };
        break;

      case "ACK_QUEST_RESULT":
        action = { type: "ACK_QUEST_RESULT" };
        break;

      case "ASSASSINATE":
        if (!isAssassin) return;
        action = { type: "ASSASSINATE", targetId: actionPayload.targetId };
        break;

      case "RESTART":
        if (!isHost) return;
        action = { type: "RESTART" };
        break;

      default:
        return;
    }

    if (!action) return;

    const prevPhase = this.state.phase;
    this.state = gameReducer(this.state, action);
    const newPhase = this.state.phase;

    // Notify clients of phase transitions for animation triggers
    if (prevPhase !== newPhase) {
      this.io
        .to(this.code)
        .emit("game:phase_transition", { from: prevPhase, to: newPhase });
    }

    this.broadcastState();
  }

  broadcastState() {
    setImmediate(() => {
      const publicState = buildPublicState(this.state);

      for (const [playerId, connection] of this.players.entries()) {
        if (connection.socketId && connection.connected) {
          const privateState = buildPrivateState(this.state, playerId);
          this.io.to(connection.socketId).emit("game:state", {
            publicState,
            privateState,
          });
        }
      }
    });
  }

  broadcastRoomState() {
    setImmediate(() => {
      const players: PublicPlayer[] = this.state.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        connected: p.connected,
        role: null,
        hasVoted: false,
        hasPlayedQuest: false,
      }));

      this.io.to(this.code).emit("room:state", {
        roomCode: this.code,
        hostId: this.hostId,
        players,
        roleOptions: this.state.roleOptions,
        gameStarted: this.state.phase !== "LOBBY",
      });
    });
  }

  broadcastChat(data: { text: string }, senderId: string) {
    const sender = this.players.get(senderId);
    if (!sender) return;

    const message: ChatMessage = {
      playerId: senderId,
      playerName: sender.name,
      text: data.text,
      timestamp: Date.now(),
    };
    this.io.to(this.code).emit("chat:message", message);
  }

  get isEmpty(): boolean {
    for (const connection of this.players.values()) {
      if (connection.connected) return false;
    }
    return true;
  }
}

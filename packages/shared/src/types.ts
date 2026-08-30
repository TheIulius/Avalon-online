// Core domain types for Avalon Online. This file has no React or Node dependency
// so the rules engine stays pure, deterministic, and testable in isolation.

// ─── Role System ───────────────────────────────────────────────────────────────

export type RoleId =
  | "MERLIN"
  | "PERCIVAL"
  | "LOYAL_SERVANT"
  | "ASSASSIN"
  | "MORGANA"
  | "MORDRED"
  | "OBERON"
  | "MINION";

export type Alignment = "GOOD" | "EVIL";

export interface RoleDefinition {
  id: RoleId;
  name: string;
  alignment: Alignment;
  optional: boolean;
  blurb: string;
  ability: string;
}

export const ROLES: Record<RoleId, RoleDefinition> = {
  MERLIN: {
    id: "MERLIN",
    name: "Merlin",
    alignment: "GOOD",
    optional: true,
    blurb: "The wizard who sees through the fog of deceit.",
    ability:
      "You know which players are Evil (Mordred stays hidden from you). Guide Good without revealing yourself — the Assassin wins by unmasking you.",
  },
  PERCIVAL: {
    id: "PERCIVAL",
    name: "Percival",
    alignment: "GOOD",
    optional: true,
    blurb: "The knight sworn to protect the wizard.",
    ability:
      "You are shown Merlin and Morgana, but not which is which. Work out who is truly Merlin without giving them away.",
  },
  LOYAL_SERVANT: {
    id: "LOYAL_SERVANT",
    name: "Loyal Servant of Arthur",
    alignment: "GOOD",
    optional: false,
    blurb: "A faithful subject with nothing to hide.",
    ability:
      "You have no special knowledge. Use logic and discussion to identify Evil and complete three quests.",
  },
  ASSASSIN: {
    id: "ASSASSIN",
    name: "Assassin",
    alignment: "EVIL",
    optional: false,
    blurb: "The blade that ends Good's victory in a single strike.",
    ability:
      "You know your fellow Evil players. If Good completes three quests, you name who you believe is Merlin — guess right and Evil wins.",
  },
  MORGANA: {
    id: "MORGANA",
    name: "Morgana",
    alignment: "EVIL",
    optional: true,
    blurb: "The sorceress who masquerades as the wizard.",
    ability:
      "You know your fellow Evil players. You appear to Percival as a possible Merlin, sowing doubt about who to trust.",
  },
  MORDRED: {
    id: "MORDRED",
    name: "Mordred",
    alignment: "EVIL",
    optional: true,
    blurb: "The traitor unseen even by magic.",
    ability:
      "You know your fellow Evil players. Merlin does not know you are Evil, letting you move unseen.",
  },
  OBERON: {
    id: "OBERON",
    name: "Oberon",
    alignment: "EVIL",
    optional: true,
    blurb: "The outcast who plots alone.",
    ability:
      "You do not know your fellow Evil players, and they do not know you. Sow chaos and cover for Evil without coordination.",
  },
  MINION: {
    id: "MINION",
    name: "Minion of Mordred",
    alignment: "EVIL",
    optional: false,
    blurb: "A servant of the shadow, loyal to the last.",
    ability:
      "You know your fellow Evil players (except Oberon, if in play). Blend in and sabotage quests from within.",
  },
};

// ─── Player & Game Data ────────────────────────────────────────────────────────

export interface Player {
  id: string;       // Persistent UUID assigned on room join
  name: string;
  role: RoleId | null;
  connected: boolean;
}

export type Vote = "APPROVE" | "REJECT";
export type QuestCard = "SUCCESS" | "FAIL";

export interface QuestSpec {
  questNumber: number; // 1-5
  teamSize: number;
  failsRequired: number;
}

export interface QuestRecord {
  questNumber: number;
  teamSize: number;
  failsRequired: number;
  teamPlayerIds: string[];
  leaderId: string;
  proposals: ProposalRecord[];
  result: "SUCCESS" | "FAIL" | null;
  failCount: number | null;
}

export interface ProposalRecord {
  proposalNumber: number;
  leaderId: string;
  teamPlayerIds: string[];
  votes: Record<string, Vote>;
  approved: boolean | null;
}

// ─── Game Phases ───────────────────────────────────────────────────────────────

export type GamePhase =
  | "LOBBY"
  | "ROLE_REVEAL"
  | "TEAM_SELECTION"
  | "TEAM_VOTE"
  | "TEAM_VOTE_RESULT"
  | "QUEST"
  | "QUEST_RESULT"
  | "ASSASSINATION"
  | "GAME_OVER";

export type WinningSide = "GOOD" | "EVIL" | null;

export type WinReason =
  | "THREE_QUESTS_FAILED"
  | "FIVE_REJECTIONS"
  | "MERLIN_ASSASSINATED"
  | "THREE_QUESTS_SUCCEEDED_MERLIN_SAFE"
  | null;

export interface RoleSetupOptions {
  merlin: boolean;
  percival: boolean;
  morgana: boolean;
  mordred: boolean;
  oberon: boolean;
}

// ─── Core Game State ───────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  players: Player[];
  roleOptions: RoleSetupOptions;
  leaderIndex: number;
  currentQuestIndex: number;
  quests: QuestRecord[];
  rejectionCount: number;
  currentProposal: ProposalRecord | null;
  currentTeamSelection: string[];
  pendingQuestVotes: Record<string, QuestCard>;
  assassinId: string | null;
  assassinTargetId: string | null;
  winner: WinningSide;
  winReason: WinReason;
  revealedPlayerIds: string[];
  log: string[];
}

// ─── Multiplayer / Room Types ──────────────────────────────────────────────────

export interface RoomConfig {
  roomCode: string;
  hostId: string;
  maxPlayers: number;
  roleOptions: RoleSetupOptions;
}

/** What every player in the room can see (public info only). */
export interface PublicGameState {
  phase: GamePhase;
  players: PublicPlayer[];
  leaderIndex: number;
  currentQuestIndex: number;
  quests: PublicQuestRecord[];
  rejectionCount: number;
  currentProposal: PublicProposal | null;
  currentTeamSelection: string[];
  revealedPlayerIds: string[];
  assassinTargetId: string | null;
  winner: WinningSide;
  winReason: WinReason;
  log: string[];
  roleOptions: RoleSetupOptions;
}

export interface PublicPlayer {
  id: string;
  name: string;
  connected: boolean;
  // Role is only revealed at GAME_OVER
  role: RoleId | null;
  hasVoted: boolean;        // during TEAM_VOTE
  hasPlayedQuest: boolean;  // during QUEST
}

export interface PublicQuestRecord {
  questNumber: number;
  teamSize: number;
  failsRequired: number;
  teamPlayerIds: string[];
  leaderId: string;
  proposals: PublicProposal[];
  result: "SUCCESS" | "FAIL" | null;
  failCount: number | null;
}

export interface PublicProposal {
  proposalNumber: number;
  leaderId: string;
  teamPlayerIds: string[];
  // Votes are hidden during TEAM_VOTE, revealed in TEAM_VOTE_RESULT
  votes: Record<string, Vote> | null;
  approved: boolean | null;
}

/** Private info sent only to the individual player. */
export interface PrivatePlayerState {
  playerId: string;
  role: RoleId | null;
  alignment: Alignment | null;
  roleBlurb: string | null;
  roleAbility: string | null;
  knownPlayers: KnownPlayerEntry[];
  // Only populated when it's your turn to act
  isLeader: boolean;
  isOnQuestTeam: boolean;
  isAssassin: boolean;
  myVote: Vote | null;           // Your vote if already cast
  myQuestCard: QuestCard | null; // Your quest card if already played
  hasRevealedRole: boolean;
}

export interface KnownPlayerEntry {
  id: string;
  name: string;
  shownAs: "EVIL" | "MERLIN_OR_MORGANA" | null;
}

// ─── Socket Event Types ────────────────────────────────────────────────────────

/** Client → Server events */
export interface ClientToServerEvents {
  "room:create": (data: { playerName: string }, callback: (response: RoomJoinResponse) => void) => void;
  "room:join": (data: { roomCode: string; playerName: string }, callback: (response: RoomJoinResponse) => void) => void;
  "room:rejoin": (data: { roomCode: string; sessionToken: string }, callback: (response: RoomJoinResponse) => void) => void;
  "room:leave": () => void;
  "game:action": (action: GameActionPayload) => void;
  "webrtc:signal": (data: { targetPlayerId: string; signal: unknown }) => void;
  "chat:message": (data: { text: string }) => void;
}

/** Server → Client events */
export interface ServerToClientEvents {
  "room:state": (data: RoomStateUpdate) => void;
  "game:state": (data: { publicState: PublicGameState; privateState: PrivatePlayerState }) => void;
  "game:phase_transition": (data: { from: GamePhase; to: GamePhase }) => void;
  "player:joined": (data: { player: PublicPlayer }) => void;
  "player:left": (data: { playerId: string }) => void;
  "player:disconnected": (data: { playerId: string }) => void;
  "player:reconnected": (data: { playerId: string }) => void;
  "webrtc:signal": (data: { fromPlayerId: string; signal: unknown }) => void;
  "chat:message": (data: { playerId: string; playerName: string; text: string; timestamp: number }) => void;
  "room:error": (data: { message: string }) => void;
}

export interface RoomJoinResponse {
  success: boolean;
  error?: string;
  roomCode?: string;
  playerId?: string;
  sessionToken?: string;
  players?: PublicPlayer[];
  roleOptions?: RoleSetupOptions;
  hostId?: string;
}

export interface RoomStateUpdate {
  roomCode: string;
  hostId: string;
  players: PublicPlayer[];
  roleOptions: RoleSetupOptions;
  gameStarted: boolean;
}

/** Actions that clients can send to the server. Each carries the type + relevant payload. */
export type GameActionPayload =
  | { type: "SET_ROLE_OPTIONS"; options: RoleSetupOptions }
  | { type: "START_GAME" }
  | { type: "ACK_ROLE_REVEAL" }
  | { type: "TOGGLE_TEAM_MEMBER"; playerId: string }
  | { type: "PROPOSE_TEAM" }
  | { type: "CAST_TEAM_VOTE"; vote: Vote }
  | { type: "CAST_QUEST_CARD"; card: QuestCard }
  | { type: "ACK_TEAM_VOTE_RESULT" }
  | { type: "ACK_QUEST_RESULT" }
  | { type: "ASSASSINATE"; targetId: string }
  | { type: "RESTART" };

// ─── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

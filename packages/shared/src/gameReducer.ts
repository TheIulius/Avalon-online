import {
  GameState,
  Player,
  ProposalRecord,
  QuestCard,
  RoleSetupOptions,
  Vote,
} from "./types.js";
import {
  assignRoles,
  isEvil,
  nextLeaderIndex,
  questSpecsFor,
  questTally,
  shuffle,
} from "./rules.js";

// ─── Actions ───────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: "ADD_PLAYER"; id: string; name: string }
  | { type: "REMOVE_PLAYER"; id: string }
  | { type: "SET_ROLE_OPTIONS"; options: RoleSetupOptions }
  | { type: "START_GAME" }
  | { type: "ACK_ROLE_REVEAL"; playerId: string }
  | { type: "TOGGLE_TEAM_MEMBER"; playerId: string }
  | { type: "PROPOSE_TEAM" }
  | { type: "CAST_TEAM_VOTE"; playerId: string; vote: Vote }
  | { type: "ACK_TEAM_VOTE_RESULT" }
  | { type: "CAST_QUEST_CARD"; playerId: string; card: QuestCard }
  | { type: "ACK_QUEST_RESULT" }
  | { type: "ASSASSINATE"; targetId: string }
  | { type: "PLAYER_DISCONNECTED"; playerId: string }
  | { type: "PLAYER_RECONNECTED"; playerId: string }
  | { type: "RESTART" };

// ─── Initial State ─────────────────────────────────────────────────────────────

export function makeInitialState(): GameState {
  return {
    phase: "LOBBY",
    players: [],
    roleOptions: { merlin: true, percival: false, morgana: false, mordred: false, oberon: false },
    leaderIndex: 0,
    currentQuestIndex: 0,
    quests: [],
    rejectionCount: 0,
    currentProposal: null,
    currentTeamSelection: [],
    pendingQuestVotes: {},
    assassinId: null,
    assassinTargetId: null,
    winner: null,
    winReason: null,
    revealedPlayerIds: [],
    log: ["Room created. Waiting for players to join."],
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function pushLog(state: GameState, message: string): string[] {
  return [...state.log, message];
}

// ─── Reducer ───────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // In online mode, the server adds players with a known id
    case "ADD_PLAYER": {
      if (state.phase !== "LOBBY") return state;
      if (state.players.length >= 10) return state;
      if (state.players.some((p) => p.id === action.id)) return state;
      const player: Player = { id: action.id, name: action.name, role: null, connected: true };
      return {
        ...state,
        players: [...state.players, player],
        log: pushLog(state, `${action.name} joined the table.`),
      };
    }

    case "REMOVE_PLAYER": {
      if (state.phase !== "LOBBY") return state;
      const leaving = state.players.find((p) => p.id === action.id);
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
        log: leaving ? pushLog(state, `${leaving.name} left the table.`) : state.log,
      };
    }

    case "SET_ROLE_OPTIONS": {
      if (state.phase !== "LOBBY") return state;
      return { ...state, roleOptions: action.options };
    }

    case "START_GAME": {
      if (state.phase !== "LOBBY") return state;
      if (state.players.length < 5 || state.players.length > 10) return state;

      const rolePlayers = assignRoles(state.players, state.roleOptions);
      const assassin = rolePlayers.find((p) => p.role === "ASSASSIN") ?? null;
      const specs = questSpecsFor(rolePlayers.length);
      const startingLeader = Math.floor(Math.random() * rolePlayers.length);

      return {
        ...makeInitialState(),
        phase: "ROLE_REVEAL",
        players: rolePlayers,
        roleOptions: state.roleOptions,
        leaderIndex: startingLeader,
        assassinId: assassin?.id ?? null,
        quests: specs.map((s) => ({
          questNumber: s.questNumber,
          teamSize: s.teamSize,
          failsRequired: s.failsRequired,
          teamPlayerIds: [],
          leaderId: "",
          proposals: [],
          result: null,
          failCount: null,
        })),
        revealedPlayerIds: [],
        log: [`Roles dealt to ${rolePlayers.length} players. Check your role card.`],
      };
    }

    case "ACK_ROLE_REVEAL": {
      if (state.phase !== "ROLE_REVEAL") return state;
      const revealed = state.revealedPlayerIds.includes(action.playerId)
        ? state.revealedPlayerIds
        : [...state.revealedPlayerIds, action.playerId];

      const allDone = state.players.every((p) => revealed.includes(p.id));

      return {
        ...state,
        revealedPlayerIds: revealed,
        phase: allDone ? "TEAM_SELECTION" : "ROLE_REVEAL",
        currentTeamSelection: [],
        log: allDone
          ? pushLog(state, `All players have seen their roles. ${state.players[state.leaderIndex].name} proposes the first team.`)
          : state.log,
      };
    }

    case "TOGGLE_TEAM_MEMBER": {
      if (state.phase !== "TEAM_SELECTION") return state;
      const spec = state.quests[state.currentQuestIndex];
      const isSelected = state.currentTeamSelection.includes(action.playerId);
      if (isSelected) {
        return {
          ...state,
          currentTeamSelection: state.currentTeamSelection.filter((id) => id !== action.playerId),
        };
      }
      if (state.currentTeamSelection.length >= spec.teamSize) return state;
      return { ...state, currentTeamSelection: [...state.currentTeamSelection, action.playerId] };
    }

    case "PROPOSE_TEAM": {
      if (state.phase !== "TEAM_SELECTION") return state;
      const spec = state.quests[state.currentQuestIndex];
      if (state.currentTeamSelection.length !== spec.teamSize) return state;

      const leader = state.players[state.leaderIndex];
      const proposal: ProposalRecord = {
        proposalNumber: state.rejectionCount + 1,
        leaderId: leader.id,
        teamPlayerIds: state.currentTeamSelection,
        votes: {},
        approved: null,
      };

      return {
        ...state,
        phase: "TEAM_VOTE",
        currentProposal: proposal,
        log: pushLog(
          state,
          `${leader.name} proposes a team of ${spec.teamSize} for Quest ${spec.questNumber}.`
        ),
      };
    }

    case "CAST_TEAM_VOTE": {
      if (state.phase !== "TEAM_VOTE" || !state.currentProposal) return state;
      if (state.currentProposal.votes[action.playerId]) return state;

      const votes = { ...state.currentProposal.votes, [action.playerId]: action.vote };
      const allVoted = state.players.every((p) => votes[p.id]);

      if (!allVoted) {
        return { ...state, currentProposal: { ...state.currentProposal, votes } };
      }

      const approvals = Object.values(votes).filter((v) => v === "APPROVE").length;
      const approved = approvals > state.players.length / 2;
      const finishedProposal: ProposalRecord = { ...state.currentProposal, votes, approved };

      const quests = [...state.quests];
      const currentQuest = { ...quests[state.currentQuestIndex] };
      currentQuest.proposals = [...currentQuest.proposals, finishedProposal];
      quests[state.currentQuestIndex] = currentQuest;

      return {
        ...state,
        phase: "TEAM_VOTE_RESULT",
        currentProposal: finishedProposal,
        quests,
        log: pushLog(
          state,
          `Vote result: ${approvals}/${state.players.length} approve — team ${approved ? "APPROVED" : "REJECTED"}.`
        ),
      };
    }

    case "ACK_TEAM_VOTE_RESULT": {
      if (state.phase !== "TEAM_VOTE_RESULT" || !state.currentProposal) return state;
      const approved = state.currentProposal.approved;

      if (approved) {
        const quests = [...state.quests];
        const currentQuest = { ...quests[state.currentQuestIndex] };
        currentQuest.teamPlayerIds = state.currentProposal.teamPlayerIds;
        currentQuest.leaderId = state.currentProposal.leaderId;
        quests[state.currentQuestIndex] = currentQuest;

        return {
          ...state,
          phase: "QUEST",
          quests,
          rejectionCount: 0,
          pendingQuestVotes: {},
          log: pushLog(state, `The team departs on Quest ${currentQuest.questNumber}.`),
        };
      }

      const newRejectionCount = state.rejectionCount + 1;
      if (newRejectionCount >= 5) {
        return {
          ...state,
          phase: "GAME_OVER",
          rejectionCount: newRejectionCount,
          winner: "EVIL",
          winReason: "FIVE_REJECTIONS",
          log: pushLog(state, "Five teams rejected in a row — Evil wins by chaos."),
        };
      }

      const newLeaderIndex = nextLeaderIndex(state.leaderIndex, state.players.length);
      return {
        ...state,
        phase: "TEAM_SELECTION",
        leaderIndex: newLeaderIndex,
        rejectionCount: newRejectionCount,
        currentTeamSelection: [],
        currentProposal: null,
        log: pushLog(state, `Leadership passes to ${state.players[newLeaderIndex].name}.`),
      };
    }

    case "CAST_QUEST_CARD": {
      if (state.phase !== "QUEST") return state;
      const quest = state.quests[state.currentQuestIndex];
      if (!quest.teamPlayerIds.includes(action.playerId)) return state;
      if (state.pendingQuestVotes[action.playerId]) return state;

      const player = state.players.find((p) => p.id === action.playerId);
      // Good-aligned players may only ever play SUCCESS; enforced here, not just in the UI.
      const card: QuestCard = isEvil(player?.role ?? null) ? action.card : "SUCCESS";

      const pendingQuestVotes = { ...state.pendingQuestVotes, [action.playerId]: card };
      const allSubmitted = quest.teamPlayerIds.every((id) => pendingQuestVotes[id]);

      if (!allSubmitted) {
        return { ...state, pendingQuestVotes };
      }

      const failCount = Object.values(pendingQuestVotes).filter((c) => c === "FAIL").length;
      const result = failCount >= quest.failsRequired ? "FAIL" : "SUCCESS";

      const quests = [...state.quests];
      quests[state.currentQuestIndex] = { ...quest, result, failCount };

      return {
        ...state,
        phase: "QUEST_RESULT",
        pendingQuestVotes,
        quests,
        log: pushLog(
          state,
          `Quest ${quest.questNumber} result: ${result}${
            failCount > 0 ? ` (${failCount} fail card${failCount > 1 ? "s" : ""})` : ""
          }.`
        ),
      };
    }

    case "ACK_QUEST_RESULT": {
      if (state.phase !== "QUEST_RESULT") return state;
      const { successes, fails } = questTally(state);

      if (fails >= 3) {
        return {
          ...state,
          phase: "GAME_OVER",
          winner: "EVIL",
          winReason: "THREE_QUESTS_FAILED",
          log: pushLog(state, "Evil has failed three quests — Evil wins."),
        };
      }

      if (successes >= 3) {
        const merlinInPlay = state.players.some((p) => p.role === "MERLIN");
        if (state.assassinId && merlinInPlay) {
          return {
            ...state,
            phase: "ASSASSINATION",
            log: pushLog(
              state,
              "Good has completed three quests! The Assassin now names who they believe is Merlin."
            ),
          };
        }
        return {
          ...state,
          phase: "GAME_OVER",
          winner: "GOOD",
          winReason: "THREE_QUESTS_SUCCEEDED_MERLIN_SAFE",
          log: pushLog(state, "Good has completed three quests — Good wins."),
        };
      }

      const newLeaderIndex = nextLeaderIndex(state.leaderIndex, state.players.length);
      return {
        ...state,
        phase: "TEAM_SELECTION",
        leaderIndex: newLeaderIndex,
        currentQuestIndex: state.currentQuestIndex + 1,
        currentTeamSelection: [],
        currentProposal: null,
        rejectionCount: 0,
        log: pushLog(state, `${state.players[newLeaderIndex].name} leads the next quest.`),
      };
    }

    case "ASSASSINATE": {
      if (state.phase !== "ASSASSINATION") return state;
      const target = state.players.find((p) => p.id === action.targetId);
      const correct = target?.role === "MERLIN";

      return {
        ...state,
        phase: "GAME_OVER",
        assassinTargetId: action.targetId,
        winner: correct ? "EVIL" : "GOOD",
        winReason: correct ? "MERLIN_ASSASSINATED" : "THREE_QUESTS_SUCCEEDED_MERLIN_SAFE",
        log: pushLog(
          state,
          correct
            ? `The Assassin correctly names ${target?.name} as Merlin — Evil wins.`
            : `The Assassin names ${target?.name}, who is not Merlin — Good wins.`
        ),
      };
    }

    case "PLAYER_DISCONNECTED": {
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player) return state;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, connected: false } : p
        ),
        log: pushLog(state, `${player.name} disconnected.`),
      };
    }

    case "PLAYER_RECONNECTED": {
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player) return state;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, connected: true } : p
        ),
        log: pushLog(state, `${player.name} reconnected.`),
      };
    }

    case "RESTART": {
      return makeInitialState();
    }

    default:
      return state;
  }
}

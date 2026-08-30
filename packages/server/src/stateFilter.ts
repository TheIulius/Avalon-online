import {
  GameState,
  PublicGameState,
  PrivatePlayerState,
  PublicPlayer,
  PublicProposal,
  PublicQuestRecord,
  KnownPlayerEntry,
  ROLES,
  knownPlayersFor,
  isEvil,
} from "@avalon/shared";

/**
 * Build the public view of the game state that all players can see.
 * Strips hidden information (roles, individual votes during voting, quest cards).
 */
export function buildPublicState(state: GameState): PublicGameState {
  const isGameOver = state.phase === "GAME_OVER";

  const players: PublicPlayer[] = state.players.map((p: any) => ({
    id: p.id,
    name: p.name,
    connected: p.connected,
    // Roles only revealed at game over
    role: isGameOver ? p.role : null,
    // Show who has voted (but not how) during TEAM_VOTE
    hasVoted: state.currentProposal
      ? p.id in state.currentProposal.votes
      : false,
    // Show who has played their quest card (but not what)
    hasPlayedQuest: p.id in state.pendingQuestVotes,
  }));

  // Build public proposals — hide individual votes during TEAM_VOTE phase
  let currentProposal: PublicProposal | null = null;
  if (state.currentProposal) {
    const showVotes =
      state.phase === "TEAM_VOTE_RESULT" || state.phase === "GAME_OVER";
    currentProposal = {
      proposalNumber: state.currentProposal.proposalNumber,
      leaderId: state.currentProposal.leaderId,
      teamPlayerIds: state.currentProposal.teamPlayerIds,
      votes: showVotes ? state.currentProposal.votes : null,
      approved: state.currentProposal.approved,
    };
  }

  // Build public quest records
  const quests: PublicQuestRecord[] = state.quests.map((q: any) => ({
    questNumber: q.questNumber,
    teamSize: q.teamSize,
    failsRequired: q.failsRequired,
    teamPlayerIds: q.teamPlayerIds,
    leaderId: q.leaderId,
    proposals: q.proposals.map((p: any) => ({
      proposalNumber: p.proposalNumber,
      leaderId: p.leaderId,
      teamPlayerIds: p.teamPlayerIds,
      votes: p.approved !== null ? p.votes : null, // Only show votes for completed proposals
      approved: p.approved,
    })),
    result: q.result,
    failCount: q.failCount,
  }));

  return {
    phase: state.phase,
    players,
    leaderIndex: state.leaderIndex,
    currentQuestIndex: state.currentQuestIndex,
    quests,
    rejectionCount: state.rejectionCount,
    currentProposal,
    currentTeamSelection: state.currentTeamSelection,
    revealedPlayerIds: state.revealedPlayerIds,
    assassinTargetId: state.assassinTargetId,
    winner: state.winner,
    winReason: state.winReason,
    log: state.log,
    roleOptions: state.roleOptions,
  };
}

/**
 * Build the private view for a specific player.
 * Includes their role, known players, and personal action state.
 */
export function buildPrivateState(
  state: GameState,
  playerId: string
): PrivatePlayerState {
  const player = state.players.find((p: any) => p.id === playerId);
  if (!player) {
    return {
      playerId,
      role: null,
      alignment: null,
      roleBlurb: null,
      roleAbility: null,
      knownPlayers: [],
      isLeader: false,
      isOnQuestTeam: false,
      isAssassin: false,
      myVote: null,
      myQuestCard: null,
      hasRevealedRole: false,
    };
  }

  const roleInfo = player.role ? ROLES[player.role] : null;

  // Only provide known players after the game has started (not in lobby)
  let knownPlayers: KnownPlayerEntry[] = [];
  if (state.phase !== "LOBBY" && player.role) {
    knownPlayers = knownPlayersFor(player, state.players);
  }

  const leaderId = state.players[state.leaderIndex]?.id;
  const quest = state.quests[state.currentQuestIndex];

  return {
    playerId,
    role: state.phase !== "LOBBY" ? player.role : null,
    alignment:
      state.phase !== "LOBBY" && player.role ? roleInfo?.alignment ?? null : null,
    roleBlurb: roleInfo?.blurb ?? null,
    roleAbility: roleInfo?.ability ?? null,
    knownPlayers,
    isLeader: playerId === leaderId,
    isOnQuestTeam: quest?.teamPlayerIds.includes(playerId) ?? false,
    isAssassin: playerId === state.assassinId,
    myVote: state.currentProposal?.votes[playerId] ?? null,
    myQuestCard: state.pendingQuestVotes[playerId] ?? null,
    hasRevealedRole: state.revealedPlayerIds.includes(playerId),
  };
}

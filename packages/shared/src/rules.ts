import { GameState, Player, QuestSpec, RoleId, RoleSetupOptions } from "./types";

/** Total Good vs Evil split by player count, per the standard Avalon rulebook. */
export function alignmentCounts(playerCount: number): { good: number; evil: number } {
  const table: Record<number, { good: number; evil: number }> = {
    5: { good: 3, evil: 2 },
    6: { good: 4, evil: 2 },
    7: { good: 4, evil: 3 },
    8: { good: 5, evil: 3 },
    9: { good: 6, evil: 3 },
    10: { good: 6, evil: 4 },
  };
  const counts = table[playerCount];
  if (!counts) throw new Error(`Unsupported player count: ${playerCount}`);
  return counts;
}

/** Quest team size and fail requirement for each of the 5 quests, by player count. */
export function questSpecsFor(playerCount: number): QuestSpec[] {
  const sizeTable: Record<number, number[]> = {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
  };
  const sizes = sizeTable[playerCount];
  if (!sizes) throw new Error(`Unsupported player count: ${playerCount}`);
  return sizes.map((teamSize, i) => ({
    questNumber: i + 1,
    teamSize,
    // The special two-fail requirement applies to quest 4 in games of 7+ players.
    failsRequired: playerCount >= 7 && i === 3 ? 2 : 1,
  }));
}

/** Default optional-role selection, sensible for a first game at this player count. */
export function defaultRoleOptions(playerCount: number): RoleSetupOptions {
  return {
    merlin: true,
    percival: playerCount >= 6,
    morgana: playerCount >= 6,
    mordred: playerCount >= 7,
    oberon: playerCount >= 9,
  };
}

/** Validate that the chosen optional roles fit within the evil-slot budget for this count. */
export function validateRoleOptions(
  playerCount: number,
  options: RoleSetupOptions
): string | null {
  const { evil } = alignmentCounts(playerCount);
  const evilOptionalCount = [options.morgana, options.mordred, options.oberon].filter(
    Boolean
  ).length;
  if (evilOptionalCount + 1 > evil) {
    return `Too many Evil roles selected for ${playerCount} players (max ${evil - 1} optional Evil roles).`;
  }
  if (options.percival && !options.merlin) {
    return "Percival requires Merlin to be in play.";
  }
  if (options.morgana && !options.percival) {
    return "Morgana only matters when Percival is in play (otherwise no one sees her decoy).";
  }
  return null;
}

/** Build the concrete role list for this game, then shuffle-assign to players. */
export function assignRoles(
  players: Player[],
  options: RoleSetupOptions
): Player[] {
  const { good, evil } = alignmentCounts(players.length);
  const roleList: RoleId[] = [];

  // Evil roles
  roleList.push("ASSASSIN");
  if (options.morgana) roleList.push("MORGANA");
  if (options.mordred) roleList.push("MORDRED");
  if (options.oberon) roleList.push("OBERON");
  while (roleList.length < evil) roleList.push("MINION");

  // Good roles
  const goodRoles: RoleId[] = [];
  if (options.merlin) goodRoles.push("MERLIN");
  if (options.percival) goodRoles.push("PERCIVAL");
  while (goodRoles.length < good) goodRoles.push("LOYAL_SERVANT");
  roleList.push(...goodRoles);

  const shuffled = shuffle(roleList);
  return players.map((p, i) => ({ ...p, role: shuffled[i] }));
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * What a given viewer is allowed to know about the other players, computed
 * fresh from role rules every time. This is the single source of truth for
 * hidden information; the UI never stores or infers this itself.
 */
export interface KnownPlayerInfo {
  id: string;
  name: string;
  shownAs: "EVIL" | "MERLIN_OR_MORGANA" | null;
}

export function knownPlayersFor(viewer: Player, allPlayers: Player[]): KnownPlayerInfo[] {
  const others = allPlayers.filter((p) => p.id !== viewer.id);

  if (viewer.role === "MERLIN") {
    return others.map((p) => ({
      id: p.id,
      name: p.name,
      shownAs: isEvil(p.role) && p.role !== "MORDRED" ? "EVIL" : null,
    }));
  }

  if (viewer.role === "PERCIVAL") {
    return others
      .filter((p) => p.role === "MERLIN" || p.role === "MORGANA")
      .map((p) => ({ id: p.id, name: p.name, shownAs: "MERLIN_OR_MORGANA" as const }));
  }

  if (isEvil(viewer.role) && viewer.role !== "OBERON") {
    return others
      .filter((p) => isEvil(p.role) && p.role !== "OBERON")
      .map((p) => ({ id: p.id, name: p.name, shownAs: "EVIL" as const }));
  }

  // Loyal Servant, Oberon: no special knowledge.
  return [];
}

export function isEvil(role: RoleId | null): boolean {
  if (!role) return false;
  return role === "ASSASSIN" || role === "MORGANA" || role === "MORDRED" || role === "OBERON" || role === "MINION";
}

export function nextLeaderIndex(currentIndex: number, playerCount: number): number {
  return (currentIndex + 1) % playerCount;
}

/** How many successful / failed quests currently stand. */
export function questTally(state: GameState): { successes: number; fails: number } {
  let successes = 0;
  let fails = 0;
  for (const q of state.quests) {
    if (q.result === "SUCCESS") successes++;
    if (q.result === "FAIL") fails++;
  }
  return { successes, fails };
}

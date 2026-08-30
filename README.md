# Avalon &mdash; Pass & Play

A fully playable, local pass-and-play implementation of *The Resistance: Avalon* for 5&ndash;10
players sharing one device. Built with React + TypeScript + Vite.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Everyone plays on the same
device, passing it around when the app asks.

Production build: `npm run build` then `npm run preview`.

## How a game plays out

1. **Landing** &rarr; **Lobby**: add 5&ndash;10 player names, toggle which optional roles are in
   play (Merlin, Percival, Morgana, Mordred, Oberon). The evil/good split and validation (e.g.
   "Percival needs Merlin") update live.
2. **Role reveal**: the device is passed to each player in turn behind a "pass the device" gate.
   Each player privately sees their role, ability text, and (if applicable) who they know to be
   evil, or who might be Merlin (Percival).
3. **Team selection**: the current leader picks that quest's team on a shared screen (team
   composition is public knowledge in Avalon).
4. **Team vote**: the device is passed to each player again for a private Approve/Reject vote.
   Votes are revealed together, by name, once everyone has voted &mdash; matching the real rules,
   where the ballot is secret but the result is public.
5. **Quest**: only the players on the approved team vote, one at a time in private. Good-aligned
   players can only submit Success (enforced in the reducer, not just hidden in the UI). Only the
   aggregate result and fail count are revealed, never who played what.
6. Repeat until Good reaches 3 successes, Evil reaches 3 fails, or 5 team proposals are rejected
   in a row (instant Evil win).
7. **Assassination**: if Good hits 3 successes, the Assassin gets one private guess at Merlin's
   identity. Correct &rarr; Evil wins. Wrong &rarr; Good wins.
8. **End game**: every role is revealed, plus a recap of each quest's outcome. "Play Again"
   returns to the lobby (with a confirmation, since it clears the board).

Progress is cached in `sessionStorage` so an accidental refresh mid-game doesn't lose the round.

## Rules implemented

- Role distributions and quest team sizes for 5&ndash;10 players, per the standard rulebook.
- The two-fail requirement on the fourth quest in 7+ player games.
- Leader rotation, a 5-in-a-row rejection counter, and full quest/vote history.
- Hidden information computed per-role, every time, in `src/game/rules.ts::knownPlayersFor`:
  - Merlin sees all Evil except Mordred.
  - Percival sees Merlin and Morgana, indistinguishable from each other.
  - Evil players see each other, except Oberon (who is hidden from, and blind to, the rest of
    Evil).
  - Loyal Servants and Oberon get no special knowledge.

## Architecture

Game logic is fully separated from the UI and has no React dependency:

- `src/game/types.ts` &mdash; domain types and the role catalogue (name, alignment, ability text).
- `src/game/rules.ts` &mdash; pure functions: role distribution, quest specs, vote/quest math,
  and the hidden-information visibility rules.
- `src/game/gameReducer.ts` &mdash; a single deterministic reducer implementing the phase state
  machine:

  ```
  LOBBY -> ROLE_REVEAL -> TEAM_SELECTION -> TEAM_VOTE -> TEAM_VOTE_RESULT
        -> QUEST -> QUEST_RESULT -> (loop back to TEAM_SELECTION, or)
        -> ASSASSINATION -> GAME_OVER
  ```

  Every transition is a pure `(state, action) => state` function, so the whole game is
  unit-testable without touching the DOM.

- `src/components/*` &mdash; presentational React components, one concern each (lobby, role
  reveal, team selection, voting, quest resolution, assassination, end game, plus shared bits
  like the round-table seat picker and the pass-device privacy gate).

### Hidden information & the "pass and play" model

This build has no server, so there's nothing to stop someone from opening React DevTools and
reading the full state object &mdash; that's an inherent limit of a single shared device with no
backend, not a gap in the game logic. Within that constraint, the app never *displays* hidden
information to the wrong player: every screen that shows role-specific info is gated behind an
explicit "pass the device, tap to reveal" step, and secret ballots (quest cards) only ever surface
the aggregate result, never who submitted what.

### Upgrading to real online multiplayer

The reducer and rules engine are written with a server in mind:

- `gameReducer(state, action)` is pure and deterministic, so it can run unmodified inside a
  Node.js/Socket.IO (or any WebSocket) server as the authoritative source of truth.
- The natural next step is to split `GameState` into a **public** slice (phase, players' names,
  leader, quest history, vote tallies) and a **private** slice derived per-viewer via
  `knownPlayersFor` and each player's own `role`. The server would broadcast the public slice to
  every client and push each player's private slice only to their own socket, so secret
  information never reaches a browser that isn't entitled to it &mdash; the same rule this local
  build already encodes, just enforced server-side instead of by passing a single device around.
- `activeViewerId` and the "pass the device" gates would simply disappear in that mode: each
  player has their own screen, so private prompts (role reveal, quest cards, team votes) go
  straight to the right socket instead of being staged behind a hand-off screen.

## Project structure

```
src/
  game/
    types.ts        domain types + role catalogue
    rules.ts         pure rules engine (distribution, quest specs, visibility)
    gameReducer.ts    state machine reducer + session persistence
  components/         one component per screen/concern
  styles/              tokens.css (design system) + app.css (component styles)
  App.tsx              phase router
  main.tsx             entry point
```

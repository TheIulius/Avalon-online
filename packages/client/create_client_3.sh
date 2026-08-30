#!/bin/bash
set -e

# Phases
cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/phases/RoleRevealPhase.tsx
import React from 'react';
import { useGame } from '../../context/GameContext';

export const RoleRevealPhase = () => {
  const { privateState, dispatch } = useGame();
  return (
    <div className="role-card align-good" style={{ background: 'var(--bg-panel)', padding: 20, borderRadius: 10 }}>
      <h2>Your Role</h2>
      <h1>{privateState?.role}</h1>
      <button className="btn btn-gold" onClick={() => dispatch({ type: 'ACK_ROLE_REVEAL' })}>I've Memorized My Role</button>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/phases/TeamSelectionPhase.tsx
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

export const TeamSelectionPhase = () => {
  const { publicState, amILeader, dispatch } = useGame();
  const [selected, setSelected] = useState<string[]>([]);
  
  if (!amILeader) return <div>The Leader is selecting a team...</div>;
  
  const propose = () => dispatch({ type: 'PROPOSE_TEAM', payload: { players: selected } });

  return (
    <div>
      <h2>Select Team</h2>
      <button className="btn btn-gold" onClick={propose}>Propose This Team</button>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/phases/TeamVotePhase.tsx
import React from 'react';
import { useGame } from '../../context/GameContext';

export const TeamVotePhase = () => {
  const { privateState, dispatch } = useGame();
  
  if (privateState?.hasVoted) return <div>Waiting for others to vote...</div>;
  
  return (
    <div className="vote-buttons">
      <button className="vote-btn approve" onClick={() => dispatch({ type: 'SUBMIT_VOTE', payload: { approve: true } })}>Approve</button>
      <button className="vote-btn reject" onClick={() => dispatch({ type: 'SUBMIT_VOTE', payload: { approve: false } })}>Reject</button>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/phases/TeamVoteResultPhase.tsx
import React from 'react';
import { useGame } from '../../context/GameContext';

export const TeamVoteResultPhase = () => {
  const { dispatch } = useGame();
  return (
    <div className="result-banner">
      <h2>Vote Results In!</h2>
      <button className="btn btn-ghost" onClick={() => dispatch({ type: 'ACK_VOTE_RESULT' })}>Continue</button>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/phases/QuestPhase.tsx
import React from 'react';
import { useGame } from '../../context/GameContext';

export const QuestPhase = () => {
  const { amIOnTeam, privateState, dispatch } = useGame();
  if (!amIOnTeam) return <div>Quest in progress...</div>;
  if (privateState?.hasPlayedQuestCard) return <div>Waiting for team members...</div>;
  
  return (
    <div className="quest-card-buttons">
      <button className="quest-card-btn success-card" onClick={() => dispatch({ type: 'PLAY_QUEST_CARD', payload: { success: true } })}>Success</button>
      <button className="quest-card-btn fail-card" onClick={() => dispatch({ type: 'PLAY_QUEST_CARD', payload: { success: false } })}>Fail</button>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/phases/QuestResultPhase.tsx
import React from 'react';
import { useGame } from '../../context/GameContext';

export const QuestResultPhase = () => {
  const { dispatch } = useGame();
  return (
    <div className="quest-result-banner">
      <h2>Quest Complete</h2>
      <button className="btn btn-ghost" onClick={() => dispatch({ type: 'ACK_QUEST_RESULT' })}>Continue</button>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/phases/EndGamePhase.tsx
import React from 'react';
export const EndGamePhase = () => <div className="end-banner"><h2>Game Over</h2></div>;
EOF

chmod +x /Users/theiulius/Downloads/avalon-game/packages/client/create_client_3.sh || true

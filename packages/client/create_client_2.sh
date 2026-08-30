#!/bin/bash
set -e

# Table Components
cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/table/GameTable.tsx
import React from 'react';
import { useGame } from '../../context/GameContext';
import { TableSurface } from './TableSurface';
import { QuestTrack } from './QuestTrack';
import { PlayerHand } from './PlayerHand';
import { RoleRevealPhase } from '../phases/RoleRevealPhase';
import { TeamSelectionPhase } from '../phases/TeamSelectionPhase';
import { TeamVotePhase } from '../phases/TeamVotePhase';
import { TeamVoteResultPhase } from '../phases/TeamVoteResultPhase';
import { QuestPhase } from '../phases/QuestPhase';
import { QuestResultPhase } from '../phases/QuestResultPhase';
import { EndGamePhase } from '../phases/EndGamePhase';

export const GameTable = () => {
  const { publicState } = useGame();
  
  const renderPhase = () => {
    switch (publicState?.phase) {
      case 'ROLE_REVEAL': return <RoleRevealPhase />;
      case 'TEAM_SELECTION': return <TeamSelectionPhase />;
      case 'TEAM_VOTE': return <TeamVotePhase />;
      case 'TEAM_VOTE_RESULT': return <TeamVoteResultPhase />;
      case 'QUEST': return <QuestPhase />;
      case 'QUEST_RESULT': return <QuestResultPhase />;
      case 'END_GAME': return <EndGamePhase />;
      default: return null;
    }
  };

  return (
    <div className="stage stage-wide">
      <QuestTrack />
      <TableSurface>
        {renderPhase()}
      </TableSurface>
      <PlayerHand />
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/table/TableSurface.tsx
import React from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerSeat } from './PlayerSeat';

export const TableSurface = ({ children }: { children: React.ReactNode }) => {
  const { publicState } = useGame();
  
  if (!publicState) return null;

  return (
    <div className="table-surface" style={{ 
      background: 'radial-gradient(var(--felt-light), var(--felt))', 
      border: '16px solid var(--wood)',
      borderRadius: '200px',
      padding: '40px',
      position: 'relative',
      minHeight: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="round-table" style={{ position: 'absolute', top: -30, left: 0, right: 0 }}>
        {publicState.players.map(p => (
          <PlayerSeat key={p.id} player={p} />
        ))}
      </div>
      <div className="table-center">
        {children}
      </div>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/table/PlayerSeat.tsx
import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import { PublicPlayer } from '@avalon/shared';

export const PlayerSeat = ({ player }: { player: PublicPlayer }) => {
  const { playerId } = useSocket();
  const { publicState } = useGame();
  
  const isMe = player.id === playerId;
  const isLeader = publicState?.leaderId === player.id;
  
  return (
    <div className={`table-seat ${isLeader ? 'is-leader' : ''}`}>
      <div className="avatar">{player.name[0]}</div>
      <div className="seat-name">{player.name}</div>
      {isMe && <div className="seat-tag">YOU</div>}
      {isLeader && <div className="seat-tag">LEADER</div>}
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/table/QuestTrack.tsx
import React from 'react';
import { useGame } from '../../context/GameContext';

export const QuestTrack = () => {
  const { publicState } = useGame();
  if (!publicState) return null;

  return (
    <div>
      <div className="quest-track">
        {publicState.questTrack.map((q, i) => (
          <div key={i} className={`quest-pip ${q.status.toLowerCase()}`}>
            <span className="size">{q.requiredPlayers}</span>
            {q.requiresTwoFails && <span className="two-fail-mark">2F</span>}
          </div>
        ))}
      </div>
      <div className="rejection-track">
        Rejections: {publicState.voteRejectionCount} / 5
      </div>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/table/PlayerHand.tsx
import React from 'react';

export const PlayerHand = () => {
  return (
    <div className="player-hand" style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
      {/* Cards are rendered by the specific phases in Hand area */}
    </div>
  );
};
EOF

chmod +x /Users/theiulius/Downloads/avalon-game/packages/client/create_client_2.sh || true

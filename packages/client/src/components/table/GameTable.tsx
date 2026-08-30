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
import { AssassinationPhase } from '../phases/AssassinationPhase';
import { EndGamePhase } from '../phases/EndGamePhase';

export const GameTable = () => {
  const { publicState } = useGame();

  if (!publicState) return null;

  const renderPhaseContent = () => {
    switch (publicState.phase) {
      case 'ROLE_REVEAL': return <RoleRevealPhase />;
      case 'TEAM_SELECTION': return <TeamSelectionPhase />;
      case 'TEAM_VOTE': return <TeamVotePhase />;
      case 'TEAM_VOTE_RESULT': return <TeamVoteResultPhase />;
      case 'QUEST': return <QuestPhase />;
      case 'QUEST_RESULT': return <QuestResultPhase />;
      case 'ASSASSINATION': return <AssassinationPhase />;
      case 'GAME_OVER': return <EndGamePhase />;
      default: return null;
    }
  };

  return (
    <div className="game-table-container">
      <div className="top-hud">
        <QuestTrack />
      </div>
      
      <div className="table-wrapper">
        <TableSurface>
          {renderPhaseContent()}
        </TableSurface>
      </div>

      <div className="bottom-hud">
        <PlayerHand />
      </div>
    </div>
  );
};

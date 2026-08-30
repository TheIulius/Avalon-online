import React from 'react';
import { useGame } from '../../context/GameContext';
import { RoleCard } from '../cards/RoleCard';
import { VoteToken } from '../cards/VoteToken';
import { QuestCardComponent } from '../cards/QuestCard';
import { isEvil } from '@avalon/shared';

export const PlayerHand = () => {
  const { publicState, privateState, dispatch, amIOnTeam } = useGame();

  if (!publicState || !privateState) return null;

  const handleVote = (vote: 'APPROVE' | 'REJECT') => {
    if (publicState.phase === 'TEAM_VOTE' && privateState.myVote === null) {
      dispatch({ type: 'CAST_TEAM_VOTE', vote });
    }
  };

  const handleQuestCard = (card: 'SUCCESS' | 'FAIL') => {
    if (publicState.phase === 'QUEST' && amIOnTeam && privateState.myQuestCard === null) {
      dispatch({ type: 'CAST_QUEST_CARD', card });
    }
  };

  return (
    <div className="player-hand-container">
      
      {/* Show role card in hand during Role Reveal or optionally always */}
      {publicState.phase === 'ROLE_REVEAL' && privateState.role && (
        <div className="hand-role-card">
          <RoleCard 
            role={privateState.role} 
            isFlipped={privateState.hasRevealedRole}
          />
        </div>
      )}

      {/* Show Vote Tokens during Team Vote */}
      {publicState.phase === 'TEAM_VOTE' && (
        <div className="hand-vote-tokens">
          <div onClick={() => handleVote('APPROVE')}>
            <VoteToken 
              type="APPROVE" 
              state={privateState.myVote === 'APPROVE' ? 'face-down' : 'in-hand'} 
              disabled={privateState.myVote !== null}
            />
          </div>
          <div onClick={() => handleVote('REJECT')}>
            <VoteToken 
              type="REJECT" 
              state={privateState.myVote === 'REJECT' ? 'face-down' : 'in-hand'} 
              disabled={privateState.myVote !== null}
            />
          </div>
        </div>
      )}

      {/* Show Quest Cards during Quest Phase if on team */}
      {publicState.phase === 'QUEST' && amIOnTeam && (
        <div className="hand-quest-cards">
          <div onClick={() => handleQuestCard('SUCCESS')}>
            <QuestCardComponent 
              type="SUCCESS" 
              state={privateState.myQuestCard === 'SUCCESS' ? 'face-down' : 'in-hand'}
              disabled={privateState.myQuestCard !== null}
            />
          </div>
          <div onClick={() => handleQuestCard('FAIL')}>
            <QuestCardComponent 
              type="FAIL" 
              state={privateState.myQuestCard === 'FAIL' ? 'face-down' : 'in-hand'}
              disabled={privateState.myQuestCard !== null || !isEvil(privateState.role)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

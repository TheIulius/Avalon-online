import React from 'react';
import { useGame } from '../../context/GameContext';
import { VoteToken } from '../cards/VoteToken';

export const TeamVotePhase = () => {
  const { publicState, privateState } = useGame();

  if (!publicState || !publicState.currentProposal) return null;

  const { teamPlayerIds } = publicState.currentProposal;
  
  // Calculate who has voted by looking at players with hasVoted
  const votedCount = publicState.players.filter(p => p.hasVoted).length;
  const totalCount = publicState.players.length;
  
  const hasVoted = privateState?.myVote !== null;

  return (
    <div className="phase-center team-vote-phase">
      <h2 className="phase-title">Vote on Team</h2>
      
      <div className="proposed-team-display">
        {teamPlayerIds.map(id => {
          const p = publicState.players.find(player => player.id === id);
          return (
            <div key={id} className="proposed-team-member">
              {p?.name}
            </div>
          );
        })}
      </div>

      {!hasVoted ? (
        <p className="phase-instruction">Cast your vote using the tokens in your hand.</p>
      ) : (
        <p className="phase-waiting">Waiting for others to vote...</p>
      )}

      <div className="phase-progress">
        {votedCount} of {totalCount} voted
      </div>
      
      {/* Show face-down tokens on table for players who have voted */}
      <div className="table-votes-area">
        {publicState.players.map(p => {
          if (!p.hasVoted) return null;
          return (
            <div key={p.id} className="table-vote-token">
              <VoteToken type="APPROVE" state="face-down" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

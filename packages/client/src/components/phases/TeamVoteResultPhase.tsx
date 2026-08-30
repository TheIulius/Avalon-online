import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { VoteToken } from '../cards/VoteToken';

export const TeamVoteResultPhase = () => {
  const { publicState, dispatch, amIHost } = useGame();

  // Auto-advance after 5 seconds if host
  useEffect(() => {
    if (amIHost) {
      const timer = setTimeout(() => {
        dispatch({ type: 'ACK_TEAM_VOTE_RESULT' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [amIHost, dispatch]);

  if (!publicState || !publicState.currentProposal) return null;

  const { votes, approved } = publicState.currentProposal;
  if (!votes) return null;

  const approvals = Object.values(votes).filter(v => v === 'APPROVE').length;
  const rejections = Object.keys(votes).length - approvals;

  return (
    <div className="phase-center team-vote-result-phase">
      <div className={`result-banner ${approved ? 'approved' : 'rejected'}`}>
        {approved ? 'Team Approved ✓' : 'Team Rejected ✗'}
      </div>
      
      <div className="tally-display">
        <span className="approve-tally">{approvals} Approve</span>
        <span className="separator">·</span>
        <span className="reject-tally">{rejections} Reject</span>
      </div>

      <div className="revealed-votes-grid">
        {publicState.players.map(p => {
          const vote = votes[p.id];
          if (!vote) return null;
          return (
            <div key={p.id} className="revealed-vote-item">
              <VoteToken 
                type={vote} 
                state="revealed" 
                playerName={p.name} 
              />
            </div>
          );
        })}
      </div>

      {amIHost && (
        <button 
          className="btn-secondary btn-small auto-advance-btn" 
          onClick={() => dispatch({ type: 'ACK_TEAM_VOTE_RESULT' })}
        >
          Continue
        </button>
      )}
    </div>
  );
};

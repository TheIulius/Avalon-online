import React from 'react';

interface VoteTokenProps {
  type: 'APPROVE' | 'REJECT';
  state: 'in-hand' | 'face-down' | 'revealed';
  disabled?: boolean;
  playerName?: string;
}

export const VoteToken = ({ type, state, disabled, playerName }: VoteTokenProps) => {
  const isRevealed = state === 'revealed';
  const isFaceDown = state === 'face-down';
  const isApprove = type === 'APPROVE';

  return (
    <div className={`vote-token-container state-${state} ${disabled ? 'disabled' : ''}`}>
      <div className={`vote-token-inner ${(isRevealed || state === 'in-hand') ? 'is-flipped' : ''}`}>
        
        {/* Token Back */}
        <div className="vote-token-face token-back">
          <div className="token-back-design" />
        </div>
        
        {/* Token Front */}
        <div className={`vote-token-face token-front ${isApprove ? 'approve' : 'reject'}`}>
          <div className="token-icon">
            {isApprove ? '✓' : '✗'}
          </div>
          {playerName && isRevealed && (
            <div className="token-player-name">{playerName}</div>
          )}
        </div>
        
      </div>
    </div>
  );
};

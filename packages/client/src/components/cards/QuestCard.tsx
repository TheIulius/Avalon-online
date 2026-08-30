import React from 'react';

interface QuestCardProps {
  type: 'SUCCESS' | 'FAIL';
  state: 'in-hand' | 'face-down' | 'revealed';
  disabled?: boolean;
}

export const QuestCardComponent = ({ type, state, disabled }: QuestCardProps) => {
  const isRevealed = state === 'revealed';
  const isSuccess = type === 'SUCCESS';

  return (
    <div className={`quest-card-container state-${state} ${disabled ? 'disabled' : ''}`}>
      <div className={`card-inner ${(isRevealed || state === 'in-hand') ? 'is-flipped' : ''}`}>
        
        {/* Card Back */}
        <div className="card-face card-back">
          <div className="card-back-pattern">
            <div className="avalon-crest-small" />
          </div>
        </div>
        
        {/* Card Front */}
        <div className={`card-face card-front ${isSuccess ? 'success' : 'fail'}`}>
          <div className="card-border-ornament">
            <div className="quest-card-icon">
              {isSuccess ? '🏆' : '⚔️'}
            </div>
            <h3 className="card-title">{isSuccess ? 'SUCCESS' : 'FAIL'}</h3>
            {disabled && type === 'FAIL' && (
              <div className="locked-overlay">🔒 Good cannot fail</div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

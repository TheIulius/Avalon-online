import React from 'react';
import { useGame } from '../../context/GameContext';

export const TeamSelectionPhase = () => {
  const { publicState, amILeader, dispatch, currentQuest } = useGame();

  if (!publicState || !currentQuest) return null;

  const selectedCount = publicState.currentTeamSelection?.length || 0;
  const targetCount = currentQuest.teamSize;
  const isFull = selectedCount === targetCount;
  
  const leaderPlayer = publicState.players[publicState.leaderIndex];

  const handlePropose = () => {
    if (isFull && amILeader) {
      dispatch({ type: 'PROPOSE_TEAM' });
    }
  };

  return (
    <div className="phase-center team-selection-phase">
      <div className="quest-banner">
        Quest {currentQuest.questNumber}
      </div>
      
      {amILeader ? (
        <div className="leader-view">
          <h2 className="phase-title">You are the Leader</h2>
          <p className="phase-instruction">
            Select {targetCount} players for the quest.
          </p>
          <div className="selection-counter">
            {selectedCount} / {targetCount} Selected
          </div>
          <button 
            className="btn-primary" 
            disabled={!isFull}
            onClick={handlePropose}
          >
            Propose Team
          </button>
        </div>
      ) : (
        <div className="follower-view">
          <h2 className="phase-title">Team Selection</h2>
          <p className="phase-instruction">
            {leaderPlayer?.name} is selecting {targetCount} players for the quest...
          </p>
          <div className="selection-counter">
            {selectedCount} / {targetCount} Selected
          </div>
        </div>
      )}
    </div>
  );
};

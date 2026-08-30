import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

export const AssassinationPhase = () => {
  const { publicState, privateState, dispatch } = useGame();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  
  if (!publicState || !privateState) return null;

  const isAssassin = privateState.isAssassin;

  const handleAssassinate = () => {
    if (selectedTargetId) {
      if (window.confirm("Are you sure? This cannot be undone.")) {
        dispatch({ type: 'ASSASSINATE', targetId: selectedTargetId });
      }
    }
  };

  return (
    <div className="phase-center assassination-phase">
      <div className="assassination-banner">
        The Forces of Good have succeeded...
      </div>
      
      {isAssassin ? (
        <div className="assassin-view">
          <h2 className="phase-title red-glow">Name Merlin</h2>
          <p className="phase-instruction">
            Select a player to assassinate. If you find Merlin, Evil wins.
          </p>

          <div className="target-selection-grid">
            {publicState.players
              .filter(p => p.id !== privateState.playerId) // Can't kill self
              .map(p => {
                // Technically Assassin knows evil players and shouldn't kill them, 
                // but we let them select anyone just in case, or we can disable known evil
                const isKnownEvil = privateState.knownPlayers.some(kp => kp.id === p.id && kp.shownAs === "EVIL");
                return (
                  <button 
                    key={p.id}
                    className={`target-btn ${selectedTargetId === p.id ? 'selected' : ''}`}
                    disabled={isKnownEvil}
                    onClick={() => setSelectedTargetId(p.id)}
                  >
                    {p.name}
                  </button>
                );
            })}
          </div>

          <button 
            className="btn-primary assassin-btn"
            disabled={!selectedTargetId}
            onClick={handleAssassinate}
          >
            🗡️ Assassinate
          </button>
        </div>
      ) : (
        <div className="victim-view">
          <h2 className="phase-title">The Assassin is deliberating...</h2>
          <p className="phase-instruction">
            Evil has one last chance to snatch victory.
          </p>
        </div>
      )}
    </div>
  );
};

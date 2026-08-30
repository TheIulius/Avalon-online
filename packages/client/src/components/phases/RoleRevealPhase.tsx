import React from 'react';
import { useGame } from '../../context/GameContext';

export const RoleRevealPhase = () => {
  const { publicState, privateState, dispatch } = useGame();

  if (!publicState || !privateState) return null;

  const revealedCount = publicState.revealedPlayerIds?.length || 0;
  const totalCount = publicState.players.length;
  const allRevealed = revealedCount === totalCount;
  
  const hasRevealed = privateState.hasRevealedRole;

  const handleReveal = () => {
    dispatch({ type: 'ACK_ROLE_REVEAL' });
  };

  return (
    <div className="phase-center role-reveal-phase">
      <h2 className="phase-title">Your Role Awaits</h2>
      
      {!hasRevealed ? (
        <div className="reveal-actions">
          <p className="phase-instruction">Check your role card in your hand.</p>
          <button className="btn-primary" onClick={handleReveal}>
            I've Memorized My Role
          </button>
        </div>
      ) : (
        <div className="reveal-waiting">
          <p>Waiting for others...</p>
        </div>
      )}

      <div className="phase-progress">
        {revealedCount} of {totalCount} players ready
      </div>

      {privateState.knownPlayers.length > 0 && (
        <div className="known-players-info">
          <h3>You Know:</h3>
          <ul>
            {privateState.knownPlayers.map(kp => (
              <li key={kp.id}>
                {kp.name} — {kp.shownAs === "EVIL" ? "Known Evil" : (kp.shownAs === "MERLIN_OR_MORGANA" ? "Merlin or Morgana" : "")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

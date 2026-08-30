import React from 'react';
import { useGame } from '../../context/GameContext';
import { RoleCard } from '../cards/RoleCard';

export const EndGamePhase = () => {
  const { publicState, amIHost, dispatch } = useGame();

  if (!publicState) return null;

  const isGoodWin = publicState.winner === 'GOOD';

  return (
    <div className="phase-center end-game-phase">
      <div className={`victory-banner ${isGoodWin ? 'good-win' : 'evil-win'}`}>
        {isGoodWin ? 'The Forces of Good Triumph!' : 'Evil Prevails!'}
      </div>
      
      <div className="win-reason">
        {publicState.winReason === 'THREE_QUESTS_FAILED' && 'Three quests failed.'}
        {publicState.winReason === 'FIVE_REJECTIONS' && 'Five consecutive teams rejected.'}
        {publicState.winReason === 'MERLIN_ASSASSINATED' && 'The Assassin found Merlin.'}
        {publicState.winReason === 'THREE_QUESTS_SUCCEEDED_MERLIN_SAFE' && 'Three quests succeeded and Merlin survived.'}
      </div>

      <div className="final-roles-grid">
        {publicState.players.map(p => (
          <div key={p.id} className="final-role-item">
            <span className="player-name">{p.name}</span>
            {p.role && <RoleCard role={p.role} isFlipped={true} size="small" />}
          </div>
        ))}
      </div>

      <div className="game-log">
        <h3>Game Log</h3>
        <ul>
          {publicState.log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </div>

      {amIHost && (
        <button 
          className="btn-primary play-again-btn"
          onClick={() => dispatch({ type: 'RESTART' })}
        >
          Return to Lobby
        </button>
      )}
    </div>
  );
};

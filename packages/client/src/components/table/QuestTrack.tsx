import React from 'react';
import { useGame } from '../../context/GameContext';

export const QuestTrack = () => {
  const { publicState } = useGame();

  if (!publicState) return null;

  return (
    <div className="quest-track-container">
      <div className="quest-shields">
        {publicState.quests.map((quest, i) => {
          const isCurrent = i === publicState.currentQuestIndex;
          let statusClass = 'pending';
          if (quest.result === 'SUCCESS') statusClass = 'success';
          if (quest.result === 'FAIL') statusClass = 'fail';

          // 4th quest requires 2 fails with 7+ players
          const needsTwoFails = publicState.players.length >= 7 && i === 3;

          return (
            <div key={i} className={`quest-shield ${statusClass} ${isCurrent ? 'current' : ''}`}>
              <div className="quest-number">{i + 1}</div>
              <div className="quest-team-size">{quest.teamSize}</div>
              {needsTwoFails && <div className="two-fails-badge">2F</div>}
            </div>
          );
        })}
      </div>

      <div className="rejection-track">
        {[1, 2, 3, 4, 5].map(num => (
          <div 
            key={num} 
            className={`rejection-pip ${num <= publicState.rejectionCount ? 'filled' : ''}`}
          />
        ))}
        {publicState.rejectionCount >= 4 && (
          <div className="rejection-warning">One more rejection results in Evil victory!</div>
        )}
      </div>
    </div>
  );
};

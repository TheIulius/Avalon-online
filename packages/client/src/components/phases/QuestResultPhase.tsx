import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { QuestCardComponent } from '../cards/QuestCard';

export const QuestResultPhase = () => {
  const { publicState, dispatch, amIHost } = useGame();
  
  // Create a randomized order for the cards once
  const [shuffledCards, setShuffledCards] = useState<('SUCCESS'|'FAIL')[]>([]);

  useEffect(() => {
    if (!publicState) return;
    const currentQuest = publicState.quests[publicState.currentQuestIndex];
    if (currentQuest && currentQuest.failCount !== null && shuffledCards.length === 0) {
      const cards: ('SUCCESS'|'FAIL')[] = [];
      for (let i = 0; i < currentQuest.failCount; i++) cards.push('FAIL');
      for (let i = 0; i < currentQuest.teamSize - currentQuest.failCount; i++) cards.push('SUCCESS');
      
      // Simple shuffle
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      setShuffledCards(cards);
    }
  }, [publicState, shuffledCards.length]);

  if (!publicState || !publicState.currentQuestIndex) return null;
  const currentQuest = publicState.quests[publicState.currentQuestIndex];
  if (!currentQuest || currentQuest.result === null) return null;

  const isSuccess = currentQuest.result === 'SUCCESS';

  return (
    <div className="phase-center quest-result-phase">
      <div className={`result-banner ${isSuccess ? 'success' : 'fail'}`}>
        {isSuccess ? 'Quest Succeeded' : 'Quest Failed'}
      </div>
      
      <div className="fail-count-display">
        {currentQuest.failCount} fail card(s) played
      </div>

      <div className="revealed-quest-cards-grid">
        {shuffledCards.map((card, i) => (
          <div key={i} className="revealed-quest-card-item">
            <QuestCardComponent type={card} state="revealed" />
          </div>
        ))}
      </div>

      {amIHost && (
        <button 
          className="btn-primary" 
          onClick={() => dispatch({ type: 'ACK_QUEST_RESULT' })}
        >
          Continue
        </button>
      )}
    </div>
  );
};

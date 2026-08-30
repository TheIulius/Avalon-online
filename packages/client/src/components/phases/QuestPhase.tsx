import React from 'react';
import { useGame } from '../../context/GameContext';
import { QuestCardComponent } from '../cards/QuestCard';

export const QuestPhase = () => {
  const { publicState, privateState, amIOnTeam } = useGame();

  if (!publicState || !publicState.currentQuestIndex) return null;
  const currentQuest = publicState.quests[publicState.currentQuestIndex];
  if (!currentQuest) return null;

  const playedCount = publicState.players.filter(p => p.hasPlayedQuest).length;
  const totalTeam = currentQuest.teamSize;

  const hasPlayed = privateState?.myQuestCard !== null;

  return (
    <div className="phase-center quest-phase">
      <div className="quest-banner">
        Quest {currentQuest.questNumber}
      </div>

      <div className="proposed-team-display">
        {currentQuest.teamPlayerIds.map(id => {
          const p = publicState.players.find(player => player.id === id);
          return (
            <div key={id} className={`proposed-team-member ${p?.hasPlayedQuest ? 'has-played' : ''}`}>
              {p?.name}
            </div>
          );
        })}
      </div>

      <h2 className="phase-title">
        {amIOnTeam 
          ? (hasPlayed ? "Waiting for other team members..." : "Choose your Quest Card") 
          : "Quest in progress..."}
      </h2>

      <div className="phase-progress">
        {playedCount} of {totalTeam} played
      </div>

      {/* Show face-down cards accumulating in the center */}
      <div className="table-quest-cards-area">
        {Array.from({ length: playedCount }).map((_, i) => (
          <div key={i} className="table-quest-card">
            <QuestCardComponent type="SUCCESS" state="face-down" />
          </div>
        ))}
      </div>
    </div>
  );
};

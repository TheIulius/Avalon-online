import React, { ReactNode } from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { PlayerSeat } from './PlayerSeat';

export const TableSurface = ({ children }: { children: ReactNode }) => {
  const { publicState } = useGame();
  const { playerId: localPlayerId } = useSocket();

  if (!publicState) return null;

  // Rearrange players so local player is always at the bottom (index 0) if possible
  let displayPlayers = [...publicState.players];
  const myIndex = displayPlayers.findIndex(p => p.id === localPlayerId);
  if (myIndex > 0) {
    displayPlayers = [
      ...displayPlayers.slice(myIndex),
      ...displayPlayers.slice(0, myIndex)
    ];
  }

  const playerCount = displayPlayers.length;

  return (
    <div className="table-surface">
      <div className="table-felt">
        <div className="table-center-area">
          {children}
        </div>
      </div>
      
      {/* Distribute seats around the oval */}
      {displayPlayers.map((player, index) => {
        // Calculate angle for positioning. Bottom is 90deg (in CSS transforms, 0 is top usually, but let's map it)
        // Let's use a simpler approach: just pass the index and total count, CSS will handle it via vars or we do it inline.
        // For a true oval, we need to map to an ellipse. 
        // 0 = bottom, going clockwise.
        // Let's calculate percentage positions.
        const angle = (Math.PI * 2 * index) / playerCount;
        // Shift by pi/2 so index 0 is at bottom
        const shiftedAngle = angle + (Math.PI / 2);
        
        // Ellipse dimensions
        const radiusX = 45; // % of container width
        const radiusY = 40; // % of container height
        
        const left = 50 - (Math.cos(shiftedAngle) * radiusX);
        const top = 50 + (Math.sin(shiftedAngle) * radiusY);

        return (
          <div 
            key={player.id} 
            className="seat-wrapper"
            style={{ 
              left: `${left}%`, 
              top: `${top}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <PlayerSeat player={player} />
          </div>
        );
      })}
    </div>
  );
};

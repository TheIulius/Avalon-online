import React from 'react';
import { RoleId, ROLES } from '@avalon/shared';

interface RoleCardProps {
  role: RoleId;
  isFlipped: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export const RoleCard = ({ role, isFlipped, size = 'medium', onClick }: RoleCardProps) => {
  const roleInfo = ROLES[role];
  const isEvil = roleInfo.alignment === 'EVIL';

  return (
    <div className={`card-container ${size}`} onClick={onClick}>
      <div className={`card-inner ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* Card Back */}
        <div className="card-face card-back">
          <div className="card-back-pattern">
            <div className="avalon-crest-small" />
          </div>
        </div>
        
        {/* Card Front */}
        <div className={`card-face card-front ${isEvil ? 'evil' : 'good'}`}>
          <div className="card-border-ornament">
            <h3 className="card-title">{roleInfo.name}</h3>
            <div className="card-alignment-banner">
              {isEvil ? 'MINION OF MORDRED' : 'LOYAL TO ARTHUR'}
            </div>
            <div className="card-art-placeholder">
              {/* Image would go here */}
            </div>
            {roleInfo.ability && (
              <p className="card-ability">{roleInfo.ability}</p>
            )}
            <p className="card-blurb">{roleInfo.blurb}</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

import React, { ReactNode } from 'react';

interface AudioMeterProps {
  level: number;
  active: boolean;
  children: ReactNode;
}

export const AudioMeter = ({ level, active, children }: AudioMeterProps) => {
  // Use a logarithmic or scaled approach to make the visual effect more pronounced
  const scale = 1 + (level * 0.15); // max 15% increase in size
  const opacity = Math.min(level * 2, 0.8); // max 80% opacity for glow

  return (
    <div className="audio-meter-container">
      <div 
        className={`audio-meter-glow ${active ? 'active' : ''}`}
        style={{
          transform: `scale(${scale})`,
          opacity: active ? opacity : 0
        }}
      />
      {children}
    </div>
  );
};

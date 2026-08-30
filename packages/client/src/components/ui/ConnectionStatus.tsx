import React from 'react';

export const ConnectionStatus = ({ state }: { state: string }) => {
  if (state === 'connected') return null;

  let color = 'var(--gold)';
  let text = 'Connecting...';
  
  if (state === 'disconnected') {
    color = 'var(--crimson)';
    text = 'Disconnected';
  } else if (state === 'reconnecting') {
    color = 'var(--gold)';
    text = 'Reconnecting...';
  }

  return (
    <div className="connection-status" style={{ backgroundColor: color }}>
      {text}
    </div>
  );
};

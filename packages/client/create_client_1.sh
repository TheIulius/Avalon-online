#!/bin/bash
set -e

# Components UI
cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/ui/ConnectionStatus.tsx
import React from 'react';

export const ConnectionStatus = ({ state }: { state: string }) => {
  const colors: Record<string, string> = {
    connected: 'var(--emerald)',
    connecting: 'var(--gold)',
    reconnecting: 'var(--gold)',
    disconnected: 'var(--crimson)'
  };
  return (
    <div style={{ position: 'fixed', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, zIndex: 100 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: colors[state] || 'gray' }} />
      <span style={{ fontSize: '0.8rem', color: 'var(--ink-dim)' }}>{state}</span>
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/ui/CopyButton.tsx
import React, { useState } from 'react';

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="btn btn-ghost btn-sm" onClick={copy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/Landing.tsx
import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

export const Landing = () => {
  const { createRoom, joinRoom } = useSocket();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');

  return (
    <div className="landing stage">
      <h1>AVALON</h1>
      <p className="subtitle">The Resistance</p>
      <p className="lore">Deception. Deduction. Destiny.</p>
      
      {mode === 'home' && (
        <div style={{ display: 'flex', gap: 16 }}>
          <button className="btn btn-gold" onClick={() => setMode('create')}>Create Game</button>
          <button className="btn btn-ghost" onClick={() => setMode('join')}>Join Game</button>
        </div>
      )}

      {mode === 'create' && (
        <div className="panel">
          <h2>Create Game</h2>
          <div className="player-input-row">
            <input className="text-input" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
            <button className="btn btn-gold" onClick={() => createRoom(name)}>Create</button>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setMode('home')}>Back</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="panel">
          <h2>Join Game</h2>
          <div className="player-input-row" style={{ flexDirection: 'column' }}>
            <input className="text-input" placeholder="Room Code" value={code} onChange={e => setCode(e.target.value)} />
            <input className="text-input" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
            <button className="btn btn-gold" onClick={() => joinRoom(code, name)}>Join</button>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setMode('home')}>Back</button>
        </div>
      )}
    </div>
  );
};
EOF

cat << 'EOF' > /Users/theiulius/Downloads/avalon-game/packages/client/src/components/Lobby.tsx
import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { CopyButton } from './ui/CopyButton';

export const Lobby = () => {
  const { roomState, roomCode, isHost, emit } = useSocket();
  const { publicState } = useGame();

  if (!roomState) return <div>Loading...</div>;

  return (
    <div className="stage">
      <div className="panel">
        <div className="panel-header">
          <h2>Room Code: {roomCode} <CopyButton text={roomCode || ''} /></h2>
          <span className="eyebrow">{roomState.players.length} / 10 seated</span>
        </div>
        <ul className="player-list">
          {roomState.players.map((p, i) => (
            <li key={p.id} className="player-row">
              <div>
                <span className="index">{i + 1}</span>
                {p.name} {p.id === roomState.hostId && '👑'}
              </div>
            </li>
          ))}
        </ul>
        {isHost && (
          <div style={{ marginTop: 20 }}>
            <button 
              className="btn btn-gold btn-block" 
              disabled={roomState.players.length < 5}
              onClick={() => emit('game:start', {})}
            >
              Begin Quest
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
EOF

# Make executable
chmod +x /Users/theiulius/Downloads/avalon-game/packages/client/create_client.sh || true

import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import '../styles/app.css';

export const Landing = () => {
  const { createRoom, joinRoom } = useSocket();
  const [view, setView] = useState<'home' | 'create' | 'join'>('home');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    createRoom(name, (res) => {
      if (!res.success) setError(res.error || 'Failed to create room');
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    if (!code.trim()) return setError('Room code is required');
    joinRoom(code.toUpperCase(), name, (res) => {
      if (!res.success) setError(res.error || 'Failed to join room');
    });
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        
        {/* Crest SVG */}
        <svg width="120" height="160" viewBox="0 0 120 160" className="landing-crest">
          <path d="M60 0 L120 30 L120 90 L60 160 L0 90 L0 30 Z" fill="none" stroke="var(--gold)" strokeWidth="4"/>
          <path d="M60 20 L100 40 L100 85 L60 140 L20 85 L20 40 Z" fill="rgba(200, 162, 77, 0.1)" stroke="var(--gold-bright)" strokeWidth="2"/>
          <path d="M60 40 L60 120 M40 70 L80 70" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
        </svg>

        <h1 className="landing-title">AVALON</h1>
        <h2 className="landing-subtitle">The Resistance</h2>
        <p className="landing-tagline">Deception. Deduction. Destiny.</p>

        {error && <div className="landing-error">{error}</div>}

        {view === 'home' && (
          <div className="landing-buttons">
            <button className="btn-primary" onClick={() => setView('create')}>Create Game</button>
            <button className="btn-secondary" onClick={() => setView('join')}>Join Game</button>
          </div>
        )}

        {view === 'create' && (
          <form className="landing-form" onSubmit={handleCreate}>
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="medieval-input"
              autoFocus
              maxLength={15}
            />
            <div className="landing-buttons">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => { setView('home'); setError(''); }}>Back</button>
            </div>
          </form>
        )}

        {view === 'join' && (
          <form className="landing-form" onSubmit={handleJoin}>
            <input 
              type="text" 
              placeholder="Room Code" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="medieval-input code-input"
              autoFocus
              maxLength={6}
            />
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="medieval-input"
              maxLength={15}
            />
            <div className="landing-buttons">
              <button type="submit" className="btn-primary">Join</button>
              <button type="button" className="btn-secondary" onClick={() => { setView('home'); setError(''); }}>Back</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { useMedia } from '../context/MediaContext';
import { VideoTile } from './video/VideoTile';
import { CopyButton } from './ui/CopyButton';
import { validateRoleOptions, alignmentCounts } from '@avalon/shared';

export const Lobby = () => {
  const { roomCode, leaveRoom, playerId, hostId } = useSocket();
  const { roomState, dispatch } = useGame();
  const { localStream, remoteStreams, toggleMic, toggleCamera, isMicOn, isCameraOn } = useMedia();
  
  const [chatMessage, setChatMessage] = useState('');

  if (!roomState) return <div>Loading room...</div>;

  const isHost = playerId === hostId;
  const playerCount = roomState.players.length;
  
  let validationError = null;
  let goodCount = 0;
  let evilCount = 0;
  
  if (playerCount >= 5 && playerCount <= 10) {
    validationError = validateRoleOptions(playerCount, roomState.roleOptions);
    const counts = alignmentCounts(playerCount);
    goodCount = counts.good;
    evilCount = counts.evil;
  }

  const handleRoleToggle = (role: keyof typeof roomState.roleOptions) => {
    if (!isHost) return;
    dispatch({ 
      type: 'SET_ROLE_OPTIONS', 
      options: { ...roomState.roleOptions, [role]: !roomState.roleOptions[role] } 
    });
  };

  const handleStartGame = () => {
    if (!isHost || validationError || playerCount < 5 || playerCount > 10) return;
    dispatch({ type: 'START_GAME' });
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <div className="lobby-room-code-box">
          <span className="lobby-room-code-label">Room Code</span>
          <div className="lobby-room-code-display">
            {roomCode}
            <CopyButton text={roomCode || ''} />
          </div>
        </div>
        <button className="btn-secondary btn-small" onClick={leaveRoom}>Leave Room</button>
      </div>

      <div className="lobby-main">
        <div className="lobby-players">
          <h3 className="section-title">The Table ({playerCount}/10 seated)</h3>
          <div className="lobby-video-grid">
            {/* Local Player */}
            {roomState.players.find(p => p.id === playerId) && (
              <div className="lobby-player-card">
                <VideoTile stream={localStream} name="You" isMuted={!isMicOn} isLocal={true} />
                <div className="lobby-player-controls">
                  <button onClick={toggleMic} className="media-btn">{isMicOn ? '🎤' : '🔇'}</button>
                  <button onClick={toggleCamera} className="media-btn">{isCameraOn ? '📷' : '🚫'}</button>
                </div>
                {isHost && <span className="host-badge">👑 Host</span>}
              </div>
            )}
            
            {/* Remote Players */}
            {roomState.players.filter(p => p.id !== playerId).map(p => (
              <div key={p.id} className={`lobby-player-card ${!p.connected ? 'disconnected' : ''}`}>
                <VideoTile stream={remoteStreams.get(p.id) || null} name={p.name} />
                {!p.connected && <div className="disconnected-overlay">Reconnecting...</div>}
                {p.id === hostId && <span className="host-badge">👑 Host</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-sidebar">
          <div className="lobby-config">
            <h3 className="section-title">Roles & Rules</h3>
            <div className="role-options">
              <label className="role-toggle good-role">
                <input type="checkbox" checked={roomState.roleOptions.merlin} onChange={() => handleRoleToggle('merlin')} disabled={!isHost} />
                <span className="toggle-label">Merlin</span>
              </label>
              <label className="role-toggle good-role">
                <input type="checkbox" checked={roomState.roleOptions.percival} onChange={() => handleRoleToggle('percival')} disabled={!isHost} />
                <span className="toggle-label">Percival</span>
              </label>
              <label className="role-toggle evil-role">
                <input type="checkbox" checked={roomState.roleOptions.morgana} onChange={() => handleRoleToggle('morgana')} disabled={!isHost} />
                <span className="toggle-label">Morgana</span>
              </label>
              <label className="role-toggle evil-role">
                <input type="checkbox" checked={roomState.roleOptions.mordred} onChange={() => handleRoleToggle('mordred')} disabled={!isHost} />
                <span className="toggle-label">Mordred</span>
              </label>
              <label className="role-toggle evil-role">
                <input type="checkbox" checked={roomState.roleOptions.oberon} onChange={() => handleRoleToggle('oberon')} disabled={!isHost} />
                <span className="toggle-label">Oberon</span>
              </label>
            </div>

            {playerCount >= 5 && playerCount <= 10 && (
              <div className="alignment-split">
                <span className="good-text">{goodCount} Good</span> · <span className="evil-text">{evilCount} Evil</span>
              </div>
            )}

            {validationError && <div className="validation-error">{validationError}</div>}
            {playerCount < 5 && <div className="validation-error">Need at least 5 players to start.</div>}
            
            {isHost ? (
              <button 
                className="btn-primary start-game-btn" 
                onClick={handleStartGame}
                disabled={!!validationError || playerCount < 5 || playerCount > 10}
              >
                Begin Quest
              </button>
            ) : (
              <div className="waiting-host">Waiting for host to begin...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

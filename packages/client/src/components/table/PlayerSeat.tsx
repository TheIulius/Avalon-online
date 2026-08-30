import React from 'react';
import { PublicPlayer } from '@avalon/shared';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import { useMedia } from '../../context/MediaContext';
import { VideoTile } from '../video/VideoTile';
import { AudioMeter } from '../video/AudioMeter';

export const PlayerSeat = ({ player }: { player: PublicPlayer }) => {
  const { playerId: localPlayerId } = useSocket();
  const { publicState, amILeader, dispatch } = useGame();
  const { localStream, remoteStreams, audioLevels } = useMedia();

  const isMe = player.id === localPlayerId;
  const isLeader = publicState?.players[publicState.leaderIndex]?.id === player.id;
  const isSelectedForTeam = publicState?.currentTeamSelection?.includes(player.id);
  const stream = isMe ? localStream : remoteStreams.get(player.id) || null;
  const audioLevel = audioLevels.get(player.id) || 0;

  const isSelectionPhase = publicState?.phase === 'TEAM_SELECTION';
  const canSelect = isSelectionPhase && amILeader;

  const handleSeatClick = () => {
    if (canSelect) {
      dispatch({ type: 'TOGGLE_TEAM_MEMBER', playerId: player.id });
    }
  };

  const seatClass = [
    'player-seat',
    isSelectedForTeam ? 'selected-for-team' : '',
    canSelect ? 'selectable' : '',
    !player.connected ? 'disconnected' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={seatClass} onClick={handleSeatClick}>
      <AudioMeter level={audioLevel} active={audioLevel > 0.1}>
        <div className="seat-video-container">
          <VideoTile stream={stream} name={player.name} size="small" isLocal={isMe} />
          {!player.connected && <div className="disconnected-overlay">...</div>}
        </div>
      </AudioMeter>

      <div className="seat-info">
        <span className="seat-name">{player.name} {isMe && '(You)'}</span>
        <div className="seat-badges">
          {isLeader && <span className="badge leader-badge">👑</span>}
          {isSelectedForTeam && <span className="badge team-badge">🛡️</span>}
          {player.hasVoted && <span className="badge voted-badge">✓</span>}
        </div>
      </div>

      {player.role && (
        <div className="revealed-role-badge">
          {player.role}
        </div>
      )}
    </div>
  );
};

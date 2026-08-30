import React, { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  isMuted?: boolean;
  size?: 'small' | 'large';
  isLocal?: boolean;
}

export const VideoTile = ({ stream, name, isMuted, size = 'large', isLocal = false }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`video-tile-container ${size}`}>
      {stream ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isLocal} 
        />
      ) : (
        <div className="video-fallback">
          <div className="avatar-circle">
            {name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      )}
      
      <div className="video-overlay">
        {isMuted && <span className="muted-icon">🔇</span>}
      </div>
      <div className="video-medieval-frame" />
    </div>
  );
};

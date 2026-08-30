import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useGame } from './GameContext';

interface MediaContextValue {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  audioLevels: Map<string, number>;
  toggleMic: () => void;
  toggleCamera: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
}

const MediaContext = createContext<MediaContextValue | null>(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  const { socket, roomCode, playerId } = useSocket();
  const { roomState } = useGame();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [audioLevels, setAudioLevels] = useState<Map<string, number>>(new Map());
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const animationFrameRef = useRef<number>();

  // 1. Get Local Media
  useEffect(() => {
    let stream: MediaStream;
    const initMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        
        // Setup local audio analyzer
        setupAudioAnalyzer(playerId || 'local', stream);
      } catch (err) {
        console.error("Could not get media", err);
      }
    };
    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [playerId]);

  // 2. WebRTC Mesh Signaling
  useEffect(() => {
    if (!socket || !localStream || !playerId) return;

    const createPeer = (targetPlayerId: string, initiator: boolean) => {
      if (peersRef.current.has(targetPlayerId)) return peersRef.current.get(targetPlayerId)!;

      const peer = new RTCPeerConnection(ICE_SERVERS);
      
      localStream.getTracks().forEach((track: MediaStreamTrack) => {
        peer.addTrack(track, localStream);
      });

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc:signal', {
            targetPlayerId,
            signal: { type: 'ice', candidate: event.candidate }
          });
        }
      };

      peer.ontrack = (event) => {
        setRemoteStreams((prev: Map<string, MediaStream>) => {
          const next = new Map(prev);
          next.set(targetPlayerId, event.streams[0]);
          return next;
        });
        setupAudioAnalyzer(targetPlayerId, event.streams[0]);
      };

      if (initiator) {
        peer.createOffer()
          .then(offer => {
            peer.setLocalDescription(offer);
            socket.emit('webrtc:signal', {
              targetPlayerId,
              signal: { type: 'offer', offer }
            });
          })
          .catch(err => console.error("Error creating offer", err));
      }

      peersRef.current.set(targetPlayerId, peer);
      return peer;
    };

    const handleSignal = async (data: { fromPlayerId: string; signal: any }) => {
      const { fromPlayerId, signal } = data;
      
      if (signal.type === 'offer') {
        const peer = createPeer(fromPlayerId, false);
        await peer.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('webrtc:signal', {
          targetPlayerId: fromPlayerId,
          signal: { type: 'answer', answer }
        });
      } 
      else if (signal.type === 'answer') {
        const peer = peersRef.current.get(fromPlayerId);
        if (peer) {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.answer));
        }
      } 
      else if (signal.type === 'ice') {
        const peer = peersRef.current.get(fromPlayerId);
        if (peer && signal.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    };

    socket.on('webrtc:signal', handleSignal);

    return () => {
      socket.off('webrtc:signal', handleSignal);
    };
  }, [socket, localStream, playerId]);

  // 3. Peer Connection Lifecycle (join/leave)
  useEffect(() => {
    if (!roomState || !localStream || !playerId) return;

    // When new players join, if we were already in the room (we have a peer connection to them? No, we need a deterministic initiator).
    // Let's say the player with the "smaller" ID string initiates to avoid collisions.
    roomState.players.forEach((p: any) => {
      if (p.id !== playerId && !peersRef.current.has(p.id) && p.connected) {
        const amIInitiator = playerId < p.id;
        if (amIInitiator) {
          // I initiate
          const peer = new RTCPeerConnection(ICE_SERVERS);
          localStream.getTracks().forEach((track: MediaStreamTrack) => peer.addTrack(track, localStream));
          
          peer.onicecandidate = (event) => {
            if (event.candidate) {
              socket?.emit('webrtc:signal', { targetPlayerId: p.id, signal: { type: 'ice', candidate: event.candidate } });
            }
          };

          peer.ontrack = (event) => {
            setRemoteStreams((prev: Map<string, MediaStream>) => {
              const next = new Map(prev);
              next.set(p.id, event.streams[0]);
              return next;
            });
            setupAudioAnalyzer(p.id, event.streams[0]);
          };

          peer.createOffer().then(offer => {
            peer.setLocalDescription(offer);
            socket?.emit('webrtc:signal', { targetPlayerId: p.id, signal: { type: 'offer', offer } });
          });

          peersRef.current.set(p.id, peer);
        }
      }
    });

    // Cleanup disconnected players
    const currentIds = new Set(roomState.players.filter((p: any) => p.connected).map((p: any) => p.id));
    peersRef.current.forEach((peer: RTCPeerConnection, id: string) => {
      if (!currentIds.has(id)) {
        peer.close();
        peersRef.current.delete(id);
        setRemoteStreams((prev: Map<string, MediaStream>) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        analysersRef.current.delete(id);
      }
    });

  }, [roomState, localStream, playerId, socket]);

  // Audio Analyzer
  const setupAudioAnalyzer = (id: string, stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Only analyze if there's an audio track
    if (stream.getAudioTracks().length === 0) return;

    try {
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysersRef.current.set(id, analyser);
      
      if (!animationFrameRef.current) {
        updateAudioLevels();
      }
    } catch (e) {
      console.warn("Could not setup audio analyzer", e);
    }
  };

  const updateAudioLevels = () => {
    const newLevels = new Map<string, number>();
    const dataArray = new Uint8Array(128); // half of fftSize

    analysersRef.current.forEach((analyser: AnalyserNode, id: string) => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalize somewhat: average is 0-255, level is 0-1
      newLevels.set(id, Math.min(average / 100, 1.0)); 
    });

    setAudioLevels(newLevels);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  };


  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t: MediaStreamTrack) => t.enabled = !t.enabled);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t: MediaStreamTrack) => t.enabled = !t.enabled);
      setIsCameraOn(!isCameraOn);
    }
  };

  return (
    <MediaContext.Provider value={{ localStream, remoteStreams, audioLevels, toggleMic, toggleCamera, isMicOn, isCameraOn }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMedia must be used within a MediaProvider');
  return ctx;
};

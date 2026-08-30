import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents, RoomJoinResponse } from '@avalon/shared';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface SocketContextValue {
  socket: SocketType | null;
  connectionState: ConnectionState;
  roomCode: string | null;
  playerId: string | null;
  sessionToken: string | null;
  hostId: string | null;
  createRoom: (name: string, callback?: (res: RoomJoinResponse) => void) => void;
  joinRoom: (code: string, name: string, callback?: (res: RoomJoinResponse) => void) => void;
  leaveRoom: () => void;
  emit: <Ev extends keyof ClientToServerEvents>(
    ev: Ev,
    ...args: Parameters<ClientToServerEvents[Ev]>
  ) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);

  useEffect(() => {
    const s: SocketType = io(import.meta.env.DEV ? 'http://localhost:3001' : undefined, {
      autoConnect: false,
    });

    s.on('connect', () => setConnectionState('connected'));
    s.on('disconnect', () => setConnectionState('disconnected'));
    s.on('connect_error', () => setConnectionState('reconnecting'));

    setSocket(s);
    s.connect();

    const savedToken = localStorage.getItem('avalonSession');
    const savedRoom = localStorage.getItem('avalonRoom');
    if (savedToken && savedRoom) {
      s.emit('room:rejoin', { sessionToken: savedToken, roomCode: savedRoom }, (res) => {
        if (res.success && res.roomCode && res.playerId) {
          setRoomCode(res.roomCode);
          setPlayerId(res.playerId);
          setSessionToken(savedToken);
        } else {
          localStorage.removeItem('avalonSession');
          localStorage.removeItem('avalonRoom');
        }
      });
    }

    return () => { s.disconnect(); };
  }, []);

  const createRoom = (name: string, callback?: (res: RoomJoinResponse) => void) => {
    socket?.emit('room:create', { playerName: name }, (res) => {
      if (res.success && res.roomCode && res.playerId && res.sessionToken) {
        setRoomCode(res.roomCode);
        setPlayerId(res.playerId);
        setSessionToken(res.sessionToken);
        setHostId(res.hostId || null);
        localStorage.setItem('avalonSession', res.sessionToken);
        localStorage.setItem('avalonRoom', res.roomCode);
      }
      if (callback) callback(res);
    });
  };

  const joinRoom = (code: string, name: string, callback?: (res: RoomJoinResponse) => void) => {
    socket?.emit('room:join', { roomCode: code, playerName: name }, (res) => {
      if (res.success && res.roomCode && res.playerId && res.sessionToken) {
        setRoomCode(res.roomCode);
        setPlayerId(res.playerId);
        setSessionToken(res.sessionToken);
        localStorage.setItem('avalonSession', res.sessionToken);
        localStorage.setItem('avalonRoom', res.roomCode);
      }
      if (callback) callback(res);
    });
  };

  const leaveRoom = () => {
    localStorage.removeItem('avalonSession');
    localStorage.removeItem('avalonRoom');
    socket?.emit('room:leave');
    setRoomCode(null);
    setPlayerId(null);
    setSessionToken(null);
    setHostId(null);
  };

  const emit = <Ev extends keyof ClientToServerEvents>(ev: Ev, ...args: Parameters<ClientToServerEvents[Ev]>) => {
    // @ts-ignore
    socket?.emit(ev, ...args);
  };

  return (
    <SocketContext.Provider value={{ socket, connectionState, roomCode, playerId, sessionToken, hostId, createRoom, joinRoom, leaveRoom, emit }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
};

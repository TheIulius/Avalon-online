import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import type { PublicGameState, PrivatePlayerState, RoomStateUpdate, GameActionPayload, GameAction, GamePhase, QuestCard, PublicQuestRecord } from '@avalon/shared';

interface GameContextValue {
  publicState: PublicGameState | null;
  privateState: PrivatePlayerState | null;
  roomState: RoomStateUpdate | null;
  dispatch: (action: GameActionPayload) => void;
  isMyTurn: boolean;
  amILeader: boolean;
  amIOnTeam: boolean;
  currentQuest: PublicQuestRecord | null;
  amIHost: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { socket, emit, playerId, roomCode } = useSocket();
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateState, setPrivateState] = useState<PrivatePlayerState | null>(null);
  const [roomState, setRoomState] = useState<RoomStateUpdate | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleRoomState = (state: RoomStateUpdate) => setRoomState(state);
    const handleGameState = (data: { publicState: PublicGameState, privateState: PrivatePlayerState }) => {
      setPublicState(data.publicState);
      setPrivateState(data.privateState);
    };

    socket.on('room:state', handleRoomState);
    socket.on('game:state', handleGameState);

    return () => {
      socket.off('room:state', handleRoomState);
      socket.off('game:state', handleGameState);
    };
  }, [socket]);

  // Reset state if we leave the room
  useEffect(() => {
    if (!roomCode) {
      setPublicState(null);
      setPrivateState(null);
      setRoomState(null);
    }
  }, [roomCode]);

  const dispatch = (action: GameActionPayload) => {
    emit('game:action', action);
  };

  const currentQuestIndex = publicState?.currentQuestIndex ?? -1;
  const currentQuest = currentQuestIndex >= 0 && publicState ? publicState.quests[currentQuestIndex] : null;

  const leaderId = publicState?.players[publicState.leaderIndex]?.id;
  const amILeader = !!publicState && leaderId === playerId;
  const amIOnTeam = !!currentQuest && currentQuest.teamPlayerIds.includes(playerId || '');
  const amIHost = !!roomState && roomState.hostId === playerId;

  const isMyTurn = !!publicState && (() => {
    if (publicState.phase === 'ROLE_REVEAL' && !privateState?.hasRevealedRole) return true;
    if (publicState.phase === 'TEAM_SELECTION' && amILeader) return true;
    if (publicState.phase === 'TEAM_VOTE' && privateState?.myVote === null) return true;
    if (publicState.phase === 'QUEST' && amIOnTeam && privateState?.myQuestCard === null) return true;
    if (publicState.phase === 'ASSASSINATION' && privateState?.isAssassin) return true;
    return false;
  })();

  return (
    <GameContext.Provider value={{ publicState, privateState, roomState, dispatch, isMyTurn, amILeader, amIOnTeam, currentQuest, amIHost }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
};

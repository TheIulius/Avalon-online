import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { GameProvider, useGame } from './context/GameContext';
import { MediaProvider } from './context/MediaContext';
import { Landing } from './components/Landing';
import { Lobby } from './components/Lobby';
import { GameTable } from './components/table/GameTable';
import { ConnectionStatus } from './components/ui/ConnectionStatus';

const AppContent = () => {
  const { connectionState, roomCode } = useSocket();
  const { publicState } = useGame();

  let content;
  if (connectionState === 'disconnected' || !roomCode) {
    content = <Landing />;
  } else if (!publicState || publicState.phase === 'LOBBY') {
    content = <Lobby />;
  } else {
    content = <GameTable />;
  }

  return (
    <>
      <ConnectionStatus state={connectionState} />
      {content}
    </>
  );
};

export const App = () => {
  return (
    <SocketProvider>
      <GameProvider>
        <MediaProvider>
          <div className="app-shell">
            <AppContent />
          </div>
        </MediaProvider>
      </GameProvider>
    </SocketProvider>
  );
};

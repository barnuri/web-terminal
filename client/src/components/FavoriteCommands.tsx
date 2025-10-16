import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import './FavoriteCommands.css';

interface FavoriteCommandsProps {
  onCommand: (command: string) => void;
}

const FavoriteCommands: React.FC<FavoriteCommandsProps> = ({ onCommand }) => {
  const [commands, setCommands] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const socketRef = React.useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('FavoriteCommands socket connected');
      // Request favorite commands
      socket.emit('get-favorite-commands');
    });

    socket.on('favorite-commands', ({ commands: receivedCommands }: { commands: string[] }) => {
      console.log('Received favorite commands:', receivedCommands);
      setCommands(receivedCommands);
      setIsVisible(receivedCommands.length > 0);
    });

    socket.on('error', ({ message }: { message: string }) => {
      console.error('FavoriteCommands error:', message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getCommandLabel = (command: string): string => {
    // Truncate long commands for display
    if (command.length > 20) {
      return command.substring(0, 17) + '...';
    }
    return command;
  };

  const handleCommandClick = (command: string) => {
    // Send command to the current terminal
    onCommand(`${command}\n`);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (commands.length === 0) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        className="favorite-commands-toggle"
        onClick={toggleVisibility}
        aria-label="Show favorite commands"
        title="Show favorite commands"
      >
        ⚡
      </button>
    );
  }

  return (
    <div className="favorite-commands">
      <div className="commands-header">
        <span className="commands-title">Favorite Commands</span>
        <button
          className="commands-close"
          onClick={toggleVisibility}
          aria-label="Hide favorite commands"
        >
          ×
        </button>
      </div>
      <div className="commands-grid">
        {commands.map((command, index) => (
          <button
            key={index}
            className="command-button"
            onClick={() => handleCommandClick(command)}
            title={command}
            aria-label={`Run command: ${command}`}
          >
            <span className="command-icon">⚡</span>
            <span className="command-label">{getCommandLabel(command)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const getSocketUrl = (): string => {
  if (import.meta.env.DEV) {
    return '/';
  }
  return window.location.origin;
};

export default FavoriteCommands;

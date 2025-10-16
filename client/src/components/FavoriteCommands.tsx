import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './FavoriteCommands.css';

interface FavoriteCommandsProps {
  onCommand: (command: string) => void;
}

const FavoriteCommands: React.FC<FavoriteCommandsProps> = ({ onCommand }) => {
  const [commands, setCommands] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fetch favorite commands via HTTP
    const fetchCommands = async () => {
      try {
        const response = await api.get<{ commands: string[] }>('/api/terminal/favorite-commands');
        const receivedCommands = response.data.commands;
        console.log('Received favorite commands:', receivedCommands);
        setCommands(receivedCommands);
        setIsVisible(receivedCommands.length > 0);
      } catch (error) {
        console.error('Failed to fetch favorite commands:', error);
      }
    };

    fetchCommands();
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

export default FavoriteCommands;

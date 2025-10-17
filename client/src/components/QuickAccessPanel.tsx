import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './QuickAccessPanel.css';

interface QuickAccessPanelProps {
  onCommand: (command: string) => void;
}

type PanelView = 'collapsed' | 'favorites' | 'shortcuts';

const QuickAccessPanel: React.FC<QuickAccessPanelProps> = ({ onCommand }) => {
  const [commands, setCommands] = useState<string[]>([]);
  const [shortcuts, setShortcuts] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<PanelView>('collapsed');

  useEffect(() => {
    // Fetch favorite commands via HTTP
    const fetchCommands = async () => {
      try {
        const response = await api.get<{ commands: string[] }>('/api/terminal/favorite-commands');
        const receivedCommands = response.data.commands;
        console.log('Received favorite commands:', receivedCommands);
        setCommands(receivedCommands || []);
      } catch (error) {
        console.error('Failed to fetch favorite commands:', error);
      }
    };

    // Fetch folder shortcuts via HTTP
    const fetchShortcuts = async () => {
      try {
        const response = await api.get<{ shortcuts: string[] }>('/api/terminal/folder-shortcuts');
        const receivedShortcuts = response.data.shortcuts;
        console.log('Received folder shortcuts:', receivedShortcuts);
        setShortcuts(receivedShortcuts || []);
      } catch (error) {
        console.error('Failed to fetch folder shortcuts:', error);
      }
    };

    fetchCommands();
    fetchShortcuts();
  }, []);

  const getCommandLabel = (command: string): string => {
    // Truncate long commands for display
    if (command.length > 20) {
      return command.substring(0, 17) + '...';
    }
    return command;
  };

  const getFolderName = (path: string): string => {
    // Extract the last part of the path
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || path;
  };

  const handleCommandClick = (command: string) => {
    // Send command to the current terminal
    onCommand(`${command}\n`);
  };

  const handleFolderClick = (path: string) => {
    // Send cd command to the current terminal
    onCommand(`cd ${path}\n`);
  };

  const handleClose = () => {
    setCurrentView('collapsed');
  };

  // Don't render anything if both are empty
  if (commands.length === 0 && shortcuts.length === 0) {
    return null;
  }

  // Collapsed view - show icon
  if (currentView === 'collapsed') {
    return (
      <div className="quick-access-collapsed">
        {commands.length > 0 && (
          <button
            className="quick-access-icon-button favorites-icon"
            onClick={() => setCurrentView('favorites')}
            aria-label="Show favorite commands"
            title="Favorite Commands"
          >
            ⚡
          </button>
        )}
        {shortcuts.length > 0 && (
          <button
            className="quick-access-icon-button shortcuts-icon"
            onClick={() => setCurrentView('shortcuts')}
            aria-label="Show folder shortcuts"
            title="Quick Access"
          >
            📁
          </button>
        )}
      </div>
    );
  }

  // Expanded view - show panel
  return (
    <div className="quick-access-panel">
      <div className="panel-tabs">
        {commands.length > 0 && (
          <button
            className={`panel-tab ${currentView === 'favorites' ? 'active' : ''}`}
            onClick={() => setCurrentView('favorites')}
          >
            <span className="tab-icon">⚡</span>
            <span className="tab-label">Favorites</span>
          </button>
        )}
        {shortcuts.length > 0 && (
          <button
            className={`panel-tab ${currentView === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setCurrentView('shortcuts')}
          >
            <span className="tab-icon">📁</span>
            <span className="tab-label">Quick Access</span>
          </button>
        )}
        <button className="panel-close" onClick={handleClose} aria-label="Close panel">
          ×
        </button>
      </div>

      <div className="panel-content">
        {currentView === 'favorites' && commands.length > 0 && (
          <div className="content-grid">
            {commands.map((command, index) => (
              <button
                key={index}
                className="content-button"
                onClick={() => handleCommandClick(command)}
                title={command}
                aria-label={`Run command: ${command}`}
              >
                <span className="content-icon">⚡</span>
                <span className="content-label command-label">{getCommandLabel(command)}</span>
              </button>
            ))}
          </div>
        )}

        {currentView === 'shortcuts' && shortcuts.length > 0 && (
          <div className="content-grid">
            {shortcuts.map((path, index) => (
              <button
                key={index}
                className="content-button"
                onClick={() => handleFolderClick(path)}
                title={path}
                aria-label={`Open terminal in ${path}`}
              >
                <span className="content-icon">📁</span>
                <span className="content-label">{getFolderName(path)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickAccessPanel;

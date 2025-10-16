import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import './FolderShortcuts.css';

interface FolderShortcutsProps {
  onCommand: (command: string) => void;
}

const FolderShortcuts: React.FC<FolderShortcutsProps> = ({ onCommand }) => {
  const [shortcuts, setShortcuts] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const socketRef = React.useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('FolderShortcuts socket connected');
      // Request folder shortcuts
      socket.emit('get-folder-shortcuts');
    });

    socket.on('folder-shortcuts', ({ shortcuts: receivedShortcuts }: { shortcuts: string[] }) => {
      console.log('Received folder shortcuts:', receivedShortcuts);
      setShortcuts(receivedShortcuts);
      setIsVisible(receivedShortcuts.length > 0);
    });

    socket.on('error', ({ message }: { message: string }) => {
      console.error('FolderShortcuts error:', message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getFolderName = (path: string): string => {
    // Extract the last part of the path
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || path;
  };

  const handleFolderClick = (path: string) => {
    // Send cd command to the current terminal
    onCommand(`cd ${path}\n`);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (shortcuts.length === 0) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        className="folder-shortcuts-toggle"
        onClick={toggleVisibility}
        aria-label="Show folder shortcuts"
        title="Show folder shortcuts"
      >
        📁
      </button>
    );
  }

  return (
    <div className="folder-shortcuts">
      <div className="shortcuts-header">
        <span className="shortcuts-title">Quick Access</span>
        <button
          className="shortcuts-close"
          onClick={toggleVisibility}
          aria-label="Hide folder shortcuts"
        >
          ×
        </button>
      </div>
      <div className="shortcuts-grid">
        {shortcuts.map((path, index) => (
          <button
            key={index}
            className="shortcut-button"
            onClick={() => handleFolderClick(path)}
            title={path}
            aria-label={`Open terminal in ${path}`}
          >
            <span className="shortcut-icon">📁</span>
            <span className="shortcut-name">{getFolderName(path)}</span>
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

export default FolderShortcuts;

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  sessionId: string;
  cwd?: string;
  onSessionClosed?: () => void;
}

export interface TerminalHandle {
  write: (data: string) => void;
}

const Terminal = forwardRef<TerminalHandle, TerminalProps>(({ sessionId, cwd, onSessionClosed }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { theme } = useTheme();
  const { token } = useAuth();
  const [fontSize, setFontSize] = React.useState<number>(14);
  const initialPinchDistance = useRef<number>(0);

  // Expose write method to parent
  useImperativeHandle(ref, () => ({
    write: (data: string) => {
      if (xtermRef.current) {
        xtermRef.current.write(data);
      }
    },
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const isMobile = window.innerWidth <= 768;
    const initialFontSize = isMobile ? 12 : 14;
    setFontSize(initialFontSize);
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: initialFontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: getTerminalTheme(theme),
      scrollback: 10000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Connect to WebSocket with auth token
    const socket = io(getSocketUrl(), {
      auth: {
        token: token || undefined,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');

      // Try to reconnect to existing session from localStorage
      const savedSessionId = localStorage.getItem(`terminal-session-${sessionId}`);
      if (savedSessionId === sessionId) {
        console.log('Attempting to reconnect to session:', sessionId);
        socket.emit('reconnect-session', { sessionId });
      } else {
        // Create new terminal session with optional cwd
        socket.emit('create-session', { sessionId, cwd });
      }
    });

    socket.on('reconnect-success', ({ sessionId: reconnectedSessionId }) => {
      console.log('Session reconnected:', reconnectedSessionId);
      // Send resize in case terminal size changed
      socket.emit('resize', {
        sessionId,
        cols: xterm.cols,
        rows: xterm.rows,
      });
    });

    socket.on('reconnect-failed', ({ message }) => {
      console.log('Session reconnect failed:', message);
      // Clear saved session and create new one
      localStorage.removeItem(`terminal-session-${sessionId}`);
      socket.emit('create-session', { sessionId, cwd });
    });

    socket.on('session-created', ({ sessionId: createdSessionId }) => {
      console.log('Session created:', createdSessionId);
      // Save session ID to localStorage for recovery
      localStorage.setItem(`terminal-session-${sessionId}`, sessionId);
      // Send initial resize
      socket.emit('resize', {
        sessionId,
        cols: xterm.cols,
        rows: xterm.rows,
      });
    });

    socket.on('output', ({ sessionId: outputSessionId, data }) => {
      if (outputSessionId === sessionId) {
        xterm.write(data);
      }
    });

    socket.on('error', ({ sessionId: errorSessionId, message }) => {
      if (errorSessionId === sessionId || !errorSessionId) {
        xterm.write(`\r\n\x1b[31mError: ${message}\x1b[0m\r\n`);
      }
    });

    socket.on('session-closed', ({ sessionId: closedSessionId }) => {
      if (closedSessionId === sessionId) {
        xterm.write('\r\n\x1b[33mSession closed\x1b[0m\r\n');
        if (onSessionClosed) {
          onSessionClosed();
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      xterm.write('\r\n\x1b[31mDisconnected from server\x1b[0m\r\n');
    });

    // Handle terminal input
    xterm.onData((data) => {
      socket.emit('input', { sessionId, data });
    });

    // Handle terminal resize
    const handleResize = () => {
      fitAddon.fit();
      socket.emit('resize', {
        sessionId,
        cols: xterm.cols,
        rows: xterm.rows,
      });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup - don't destroy session to allow reconnection
    return () => {
      window.removeEventListener('resize', handleResize);
      // Don't emit destroy-session - let session persist for reconnection
      // Session will be cleaned up by server timeout mechanism
      socket.disconnect();
      xterm.dispose();
    };
  }, [sessionId, onSessionClosed, token, cwd]);

  // Attach custom key handler for Tab key
  useEffect(() => {
    const xterm = xtermRef.current;
    if (!xterm) return;

    const disposable = xterm.attachCustomKeyEventHandler((event) => {
      if (event.type === 'keydown' && event.key === 'Tab') {
        // Prevent default browser Tab behavior
        event.preventDefault();
        return false; // Let xterm.js handle it
      }
      return true; // Allow other keys
    });

    return () => {
      if (typeof disposable === 'object' && disposable && 'dispose' in disposable) {
        (disposable as { dispose: () => void }).dispose();
      }
    };
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = getTerminalTheme(theme);
    }
  }, [theme]);

  // Update font size when it changes
  useEffect(() => {
    if (xtermRef.current && fitAddonRef.current) {
      xtermRef.current.options.fontSize = fontSize;
      fitAddonRef.current.fit();
    }
  }, [fontSize]);

  // Pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistance.current = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current > 0) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / initialPinchDistance.current;
      const newFontSize = Math.max(8, Math.min(24, fontSize * scale));
      setFontSize(Math.round(newFontSize));
      initialPinchDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistance.current = 0;
  };

  return (
    <div
      ref={terminalRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        padding: '8px',
        touchAction: 'none',
      }}
    />
  );
});

const getSocketUrl = (): string => {
  // In production, use the same host
  // In development, the Vite proxy will handle the connection
  if (import.meta.env.DEV) {
    return '/';
  }
  return window.location.origin;
};

const getTerminalTheme = (theme: 'dark' | 'light') => {
  if (theme === 'dark') {
    return {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#ffffff',
      cursorAccent: '#1e1e1e',
      selectionBackground: '#264f78',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#ffffff',
    };
  } else {
    return {
      background: '#ffffff',
      foreground: '#383a42',
      cursor: '#383a42',
      cursorAccent: '#ffffff',
      selectionBackground: '#e5e5e6',
      black: '#383a42',
      red: '#e45649',
      green: '#50a14f',
      yellow: '#c18401',
      blue: '#0184bc',
      magenta: '#a626a4',
      cyan: '#0997b3',
      white: '#fafafa',
      brightBlack: '#4f525e',
      brightRed: '#e06c75',
      brightGreen: '#98c379',
      brightYellow: '#e5c07b',
      brightBlue: '#61afef',
      brightMagenta: '#c678dd',
      brightCyan: '#56b6c2',
      brightWhite: '#ffffff',
    };
  }
};

Terminal.displayName = 'Terminal';

export default Terminal;

import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import { useTheme } from '../contexts/ThemeContext';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  sessionId: string;
  onSessionClosed?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ sessionId, onSessionClosed }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: getTerminalTheme(theme),
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Connect to WebSocket
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      // Create terminal session
      socket.emit('create-session', { sessionId });
    });

    socket.on('session-created', ({ sessionId: createdSessionId }) => {
      console.log('Session created:', createdSessionId);
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      socket.emit('destroy-session', { sessionId });
      socket.disconnect();
      xterm.dispose();
    };
  }, [sessionId, onSessionClosed]);

  // Update theme when it changes
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = getTerminalTheme(theme);
    }
  }, [theme]);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        padding: '8px',
      }}
    />
  );
};

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

export default Terminal;

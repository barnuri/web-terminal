import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { TerminalProvider } from './contexts/TerminalContext';
import TerminalTabs from './components/TerminalTabs';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <TerminalProvider>
        <div className="app">
          <header className="app-header">
            <div className="header-content">
              <div className="header-left">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="header-icon"
                >
                  <polyline points="4 17 10 11 4 5"></polyline>
                  <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
                <h1 className="header-title">Web Terminal</h1>
              </div>
              <div className="header-right">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="app-main">
            <TerminalTabs />
          </main>
        </div>
      </TerminalProvider>
    </ThemeProvider>
  );
};

export default App;

import React from 'react';
import { useTerminal } from '../contexts/TerminalContext';
import Terminal from './Terminal';
import './TerminalTabs.css';

const TerminalTabs: React.FC = () => {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTerminal();

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  return (
    <div className="terminal-tabs-container">
      <div className="tabs-header">
        <div className="tabs-list">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-title">{tab.title}</span>
              <button
                className="tab-close"
                onClick={(e) => handleCloseTab(e, tab.id)}
                aria-label="Close tab"
                disabled={tabs.length === 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className="new-tab-button" onClick={addTab} aria-label="New tab">
          +
        </button>
      </div>
      <div className="tabs-content">
        {tabs.map((tab) => (
          <div key={tab.id} className={`tab-pane ${activeTabId === tab.id ? 'active' : ''}`}>
            {activeTabId === tab.id && (
              <Terminal
                sessionId={tab.sessionId}
                onSessionClosed={() => {
                  // Handle session closed if needed
                  console.log(`Session ${tab.sessionId} closed`);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalTabs;

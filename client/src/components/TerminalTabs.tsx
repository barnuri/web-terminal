import React, { useRef } from 'react';
import { useTerminal } from '../contexts/TerminalContext';
import Terminal, { TerminalHandle } from './Terminal';
import VirtualKeyboard from './VirtualKeyboard';
import FolderShortcuts from './FolderShortcuts';
import FavoriteCommands from './FavoriteCommands';
import './TerminalTabs.css';

const TerminalTabs: React.FC = () => {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTerminal();
  const terminalRefs = useRef<Map<string, TerminalHandle>>(new Map());
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const tabsContentRef = useRef<HTMLDivElement>(null);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  const handleVirtualKeyPress = (key: string) => {
    // Send key to active terminal via socket
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab) {
      const terminalRef = terminalRefs.current.get(activeTab.id);
      if (terminalRef) {
        terminalRef.write(key);
      }
    }
  };

  const setTerminalRef = (tabId: string, ref: TerminalHandle | null) => {
    if (ref) {
      terminalRefs.current.set(tabId, ref);
    } else {
      terminalRefs.current.delete(tabId);
    }
  };

  const handleCommand = (command: string) => {
    // Send command to active terminal
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab) {
      const terminalRef = terminalRefs.current.get(activeTab.id);
      if (terminalRef) {
        terminalRef.write(command);
      }
    }
  };

  // Touch gesture handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);

      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        setActiveTab(tabs[currentIndex - 1].id);
      } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        setActiveTab(tabs[currentIndex + 1].id);
      }
    }
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
        <button className="new-tab-button" onClick={() => addTab()} aria-label="New tab">
          +
        </button>
      </div>
      <div
        className="tabs-content"
        ref={tabsContentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {tabs.map((tab) => (
          <div key={tab.id} className={`tab-pane ${activeTabId === tab.id ? 'active' : ''}`}>
            {activeTabId === tab.id && (
              <Terminal
                sessionId={tab.sessionId}
                cwd={tab.cwd}
                onSessionClosed={() => {
                  // Handle session closed if needed
                  console.log(`Session ${tab.sessionId} closed`);
                }}
                ref={(ref) => setTerminalRef(tab.id, ref)}
              />
            )}
          </div>
        ))}
      </div>
      <VirtualKeyboard onKeyPress={handleVirtualKeyPress} />
      <FolderShortcuts onCommand={handleCommand} />
      <FavoriteCommands onCommand={handleCommand} />
    </div>
  );
};

export default TerminalTabs;

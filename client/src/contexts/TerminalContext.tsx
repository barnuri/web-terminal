import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface TerminalTab {
  id: string;
  title: string;
  sessionId: string;
  cwd?: string;
}

interface TerminalContextType {
  tabs: TerminalTab[];
  activeTabId: string | null;
  addTab: (cwd?: string, title?: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabTitle: (id: string, title: string) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};

interface TerminalProviderProps {
  children: ReactNode;
}

let tabCounter = 0;

const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const TerminalProvider: React.FC<TerminalProviderProps> = ({ children }) => {
  const [tabs, setTabs] = useState<TerminalTab[]>(() => {
    // Create initial tab
    tabCounter++;
    return [
      {
        id: `tab-${tabCounter}`,
        title: `Terminal ${tabCounter}`,
        sessionId: generateSessionId(),
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string | null>(() => tabs[0]?.id || null);

  const addTab = (cwd?: string, title?: string) => {
    tabCounter++;
    const folderName = cwd ? cwd.split('/').filter(Boolean).pop() : null;
    const newTab: TerminalTab = {
      id: `tab-${tabCounter}`,
      title: title || (folderName ? `${folderName}` : `Terminal ${tabCounter}`),
      sessionId: generateSessionId(),
      cwd,
    };

    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const removeTab = (id: string) => {
    setTabs((prevTabs) => {
      const newTabs = prevTabs.filter((tab) => tab.id !== id);

      // Ensure at least one tab remains
      if (newTabs.length === 0) {
        tabCounter++;
        const defaultTab: TerminalTab = {
          id: `tab-${tabCounter}`,
          title: `Terminal ${tabCounter}`,
          sessionId: generateSessionId(),
        };
        return [defaultTab];
      }

      // If the active tab was removed, switch to another tab
      if (activeTabId === id) {
        const removedIndex = prevTabs.findIndex((tab) => tab.id === id);
        const newActiveTab = newTabs[removedIndex] || newTabs[removedIndex - 1] || newTabs[0];
        setActiveTabId(newActiveTab.id);
      }

      return newTabs;
    });
  };

  const setActiveTab = (id: string) => {
    setActiveTabId(id);
  };

  const updateTabTitle = (id: string, title: string) => {
    setTabs((prevTabs) => prevTabs.map((tab) => (tab.id === id ? { ...tab, title } : tab)));
  };

  return (
    <TerminalContext.Provider
      value={{
        tabs,
        activeTabId,
        addTab,
        removeTab,
        setActiveTab,
        updateTabTitle,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
};

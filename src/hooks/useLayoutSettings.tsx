import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LayoutSettings {
  startCollapsed: boolean;
  stickyHeader: boolean;
  topNavMode: boolean;
  setStartCollapsed: (value: boolean) => void;
  setStickyHeader: (value: boolean) => void;
  setTopNavMode: (value: boolean) => void;
}

const LayoutSettingsContext = createContext<LayoutSettings | undefined>(undefined);

const STORAGE_KEY = "layout-settings";

interface StoredSettings {
  startCollapsed: boolean;
  stickyHeader: boolean;
  topNavMode: boolean;
}

export function LayoutSettingsProvider({ children }: { children: ReactNode }) {
  const [startCollapsed, setStartCollapsedState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StoredSettings = JSON.parse(stored);
      return parsed.startCollapsed ?? false;
    }
    return false;
  });

  const [stickyHeader, setStickyHeaderState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StoredSettings = JSON.parse(stored);
      return parsed.stickyHeader ?? true;
    }
    return true;
  });

  const [topNavMode, setTopNavModeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StoredSettings = JSON.parse(stored);
      return parsed.topNavMode ?? false;
    }
    return false;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    const settings: StoredSettings = { startCollapsed, stickyHeader, topNavMode };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [startCollapsed, stickyHeader, topNavMode]);

  const setStartCollapsed = (value: boolean) => setStartCollapsedState(value);
  const setStickyHeader = (value: boolean) => setStickyHeaderState(value);
  const setTopNavMode = (value: boolean) => setTopNavModeState(value);

  return (
    <LayoutSettingsContext.Provider
      value={{
        startCollapsed,
        stickyHeader,
        topNavMode,
        setStartCollapsed,
        setStickyHeader,
        setTopNavMode,
      }}
    >
      {children}
    </LayoutSettingsContext.Provider>
  );
}

export function useLayoutSettings() {
  const context = useContext(LayoutSettingsContext);
  if (!context) {
    throw new Error("useLayoutSettings must be used within a LayoutSettingsProvider");
  }
  return context;
}

"use client";

import * as React from "react";

const STORAGE_KEY = "dtcc.sidebar.collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function readStored(): boolean | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value == null ? null : value === "true";
  } catch {
    return null;
  }
}

function writeStored(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Storage unavailable (private mode / disabled) — persistence is best-effort.
  }
}

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsedState] = React.useState(false);

  React.useEffect(() => {
    const stored = readStored();
    if (stored != null) {
      setCollapsedState(stored);
    }
  }, []);

  const setCollapsed = React.useCallback((value: boolean) => {
    setCollapsedState(value);
    writeStored(value);
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsedState((previous) => {
      const next = !previous;
      writeStored(next);
      return next;
    });
  }, []);

  const value = React.useMemo<SidebarContextValue>(
    () => ({ collapsed, toggleCollapsed, setCollapsed }),
    [collapsed, toggleCollapsed, setCollapsed],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a <SidebarProvider>");
  }
  return context;
}

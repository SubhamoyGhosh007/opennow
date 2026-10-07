"use client";

import * as React from "react";

export interface WorkspaceHeaderState {
  title: string;
  context?: React.ReactNode;
}

interface WorkspaceContextValue {
  isNested: boolean;
  header: WorkspaceHeaderState;
  setHeader: (header: WorkspaceHeaderState) => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function useWorkspaceLayoutContext() {
  return React.useContext(WorkspaceContext);
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeaderState] = React.useState<WorkspaceHeaderState>({
    title: "ITSM Command Center",
  });

  // Only publish when the title actually changes. The context node gets a
  // fresh identity every render, so comparing it would re-fire subscribers
  // forever (maximum update depth). Title is unique per page, and page
  // remounts re-publish on mount, so no updates are lost.
  const setHeader = React.useCallback((h: WorkspaceHeaderState) => {
    setHeaderState((prev) => (prev.title === h.title ? prev : h));
  }, []);

  const value = React.useMemo(
    () => ({ isNested: true, header, setHeader }),
    [header, setHeader]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

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
  const [header, setHeader] = React.useState<WorkspaceHeaderState>({
    title: "ITSM Command Center",
  });

  return (
    <WorkspaceContext.Provider value={{ isNested: true, header, setHeader }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

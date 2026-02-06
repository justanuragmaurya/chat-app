"use client";
import { createContext, useContext, useState } from "react";

type WorkspaceContextType = {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspaceId: null,
  setActiveWorkspaceId: () => {},
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  return (
    <WorkspaceContext.Provider value={{ activeWorkspaceId, setActiveWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

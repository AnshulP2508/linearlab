"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type HeaderActionsContextType = {
  headerActions: ReactNode | null;
  setHeaderActions: (actions: ReactNode | null) => void;
};

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);

  return (
    <HeaderActionsContext.Provider value={{ headerActions, setHeaderActions }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function useHeaderActions() {
  const context = useContext(HeaderActionsContext);
  if (context === undefined) {
    throw new Error("useHeaderActions must be used within a HeaderActionsProvider");
  }
  return context;
}

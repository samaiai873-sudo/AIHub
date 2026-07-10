import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import useAgents from "../hooks/useAgents";

type AgentContextType = ReturnType<typeof useAgents>;

const AgentContext =
  createContext<AgentContextType | null>(null);

export function AgentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const agents = useAgents();

  return (
    <AgentContext.Provider value={agents}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgentContext() {
  const context = useContext(AgentContext);

  if (!context) {
    throw new Error(
      "useAgentContext 必須在 AgentProvider 內使用"
    );
  }

  return context;
}
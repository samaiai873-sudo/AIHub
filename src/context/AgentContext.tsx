import { createContext, type ReactNode } from "react";
import useAgents from "../hooks/useAgents";

type AgentContextType = ReturnType<typeof useAgents>;

const AgentContext = createContext<AgentContextType | null>(null);

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

export { AgentContext };
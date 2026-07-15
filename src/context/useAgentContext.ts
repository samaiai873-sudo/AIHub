import { useContext } from "react";
import { AgentContext } from "./AgentContext";

export function useAgentContext() {
  const context = useContext(AgentContext);

  if (!context) {
    throw new Error("useAgentContext 必須在 AgentProvider 內使用");
  }

  return context;
}
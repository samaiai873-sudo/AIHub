import { useContext } from "react";
import { ConversationContext } from "./ConversationContext";

export function useConversationContext() {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error("useConversationContext 必須在 ConversationProvider 內使用");
  }

  return context;
}
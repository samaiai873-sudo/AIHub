import { createContext, type ReactNode } from "react";
import useConversations from "../hooks/useConversations";

type ConversationContextType = ReturnType<typeof useConversations>;

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const conversations = useConversations();

  return (
    <ConversationContext.Provider value={conversations}>
      {children}
    </ConversationContext.Provider>
  );
}

export { ConversationContext };
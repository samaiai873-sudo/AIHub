import useLocalStorage from "./useLocalStorage";
import type {
  Conversation,
  Message,
} from "../types/conversation";

export default function useConversations() {
  const [conversations, setConversations] =
    useLocalStorage<Conversation[]>(
      "aihub-conversations",
      []
    );

  const createConversation = (
    title = "New Conversation"
  ) => {
    const now = new Date().toISOString();

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    setConversations((prev) => [
      conversation,
      ...prev,
    ]);

    return conversation.id;
  };

  const addMessage = (
    conversationId: string,
    message: Omit<Message, "id" | "createdAt">
  ) => {
    const now = new Date().toISOString();

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          updatedAt: now,
          messages: [
            ...conversation.messages,
            {
              ...message,
              id: crypto.randomUUID(),
              createdAt: now,
            },
          ],
        };
      })
    );
  };

  const deleteConversation = (
    conversationId: string
  ) => {
    setConversations((prev) =>
      prev.filter(
        (conversation) =>
          conversation.id !== conversationId
      )
    );
  };

  return {
    conversations,
    createConversation,
    addMessage,
    deleteConversation,
  };
}
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

  const [currentConversationId, setCurrentConversationId] =
    useLocalStorage<string | null>(
      "aihub-current-conversation",
      null
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

    setCurrentConversationId(conversation.id);

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

  const selectConversation = (
    conversationId: string
  ) => {
    setCurrentConversationId(conversationId);
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

    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  };

  const currentConversation =
    conversations.find(
      (conversation) =>
        conversation.id === currentConversationId
    ) ?? null;

  return {
    conversations,
    currentConversation,
    currentConversationId,
    createConversation,
    addMessage,
    deleteConversation,
    selectConversation,
  };
}
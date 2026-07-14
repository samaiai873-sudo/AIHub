import { useMemo } from "react";

import useLocalStorage from "./useLocalStorage";
import {
  DEFAULT_PLATFORM,
  isPlatform,
  type Platform,
} from "../constants/platforms";
import { getDefaultModel } from "../constants/models";
import type {
  Conversation,
  Message,
} from "../types/conversation";

// Options 型別定義（支援 Template、Prompt Library 等未來功能）
export type CreateConversationOptions = {
  title?: string;
  platform?: Platform | string;
  model?: string;
  projectId?: string | null;
};

function buildConversationTitle(content: string) {
  const normalizedContent = content
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedContent) {
    return "New Conversation";
  }

  const firstSentence = normalizedContent.match(
    /^[^.!?。！？]+[.!?。！？]?/
  )?.[0]?.trim();

  const title = firstSentence ?? normalizedContent;

  return title.length > 24
    ? `${title.slice(0, 24).trimEnd()}…`
    : title;
}

function normalizeConversation(
  conversation: Partial<Conversation> & {
    id: string;
    title: string;
  }
): Conversation {
  const now = new Date().toISOString();

  // 驗證並修正 platform
  const rawPlatform = conversation.platform;
  const platform = isPlatform(rawPlatform)
    ? rawPlatform
    : DEFAULT_PLATFORM;

  // 取得該平台的預設模型
  const model =
    conversation.model ??
    getDefaultModel(platform);

  return {
    id: conversation.id,
    title: conversation.title ?? "New Conversation",
    messages: conversation.messages ?? [],
    favorite: Boolean(conversation.favorite),
    projectId: conversation.projectId ?? null,
    platform,
    model,
    createdAt: conversation.createdAt ?? now,
    updatedAt: conversation.updatedAt ?? now,
  };
}

export default function useConversations() {
  const [conversations, setConversations] =
    useLocalStorage<Conversation[]>(
      "aihub-conversations",
      []
    );

  const normalizedConversations = useMemo(
    () => conversations.map(normalizeConversation),
    [conversations]
  );

  const [currentConversationId, setCurrentConversationId] =
    useLocalStorage<string | null>(
      "aihub-current-conversation",
      null
    );

  const createConversation = (
    title = "New Conversation",
    platform: string = DEFAULT_PLATFORM,
    model?: string
  ) => {
    const now = new Date().toISOString();

    // 驗證 platform
    const validatedPlatform = isPlatform(platform)
      ? platform
      : DEFAULT_PLATFORM;

    // 取得該平台的預設模型（如果未指定）
    const finalModel =
      model ?? getDefaultModel(validatedPlatform);

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      favorite: false,
      projectId: null,
      platform: validatedPlatform,
      model: finalModel,
      createdAt: now,
      updatedAt: now,
    };

    setConversations((prev) => [
      normalizeConversation(conversation),
      ...prev.map(normalizeConversation),
    ]);

    setCurrentConversationId(conversation.id);

    return conversation.id;
  };

  const renameConversation = (
    conversationId: string,
    title: string
  ) => {
    if (!title.trim()) return;

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? normalizeConversation({
              ...conversation,
              title: title.trim(),
              updatedAt: new Date().toISOString(),
            })
          : normalizeConversation(conversation)
      )
    );
  };

  const toggleFavorite = (conversationId: string) => {
    const now = new Date().toISOString();

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? normalizeConversation({
              ...conversation,
              favorite: !conversation.favorite,
              updatedAt: now,
            })
          : normalizeConversation(conversation)
      )
    );
  };

  const moveConversationToProject = (
    conversationId: string,
    projectId: string | null
  ) => {
    const now = new Date().toISOString();

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? normalizeConversation({
              ...conversation,
              projectId,
              updatedAt: now,
            })
          : normalizeConversation(conversation)
      )
    );
  };

  // Sprint 8: Browser Workflow — 讓使用者可以切換現有 Conversation 使用的 AI Platform / Model
  const changeConversationPlatform = (
    conversationId: string,
    platform: string,
    model?: string
  ) => {
    const now = new Date().toISOString();
    const validatedPlatform = isPlatform(platform)
      ? platform
      : DEFAULT_PLATFORM;
    const finalModel = model ?? getDefaultModel(validatedPlatform);

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? normalizeConversation({
              ...conversation,
              platform: validatedPlatform,
              model: finalModel,
              updatedAt: now,
            })
          : normalizeConversation(conversation)
      )
    );
  };

  // Duplicate a conversation
  const duplicateConversation = (
    conversation: Conversation
  ) => {
    setConversations((prev) => [
      normalizeConversation(conversation),
      ...prev.map(normalizeConversation),
    ]);
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

  const addMessage = (
    conversationId: string,
    message: Omit<Message, "id" | "createdAt">
  ) => {
    const now = new Date().toISOString();
    const messageId = crypto.randomUUID();

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) {
          return normalizeConversation(conversation);
        }

        const shouldAutoTitle =
          message.role === "user" &&
          (conversation.messages?.length ?? 0) === 0 &&
          (!conversation.title ||
            conversation.title.trim() === "" ||
            conversation.title === "New Conversation");

        return normalizeConversation({
          ...conversation,
          title: shouldAutoTitle
            ? buildConversationTitle(message.content)
            : conversation.title,
          updatedAt: now,
          messages: [
            ...(conversation.messages ?? []),
            {
              ...message,
              id: messageId,
              createdAt: now,
            },
          ],
        });
      })
    );

    return messageId;
  };

  const updateMessage = (
    conversationId: string,
    messageId: string,
    updatedContent: string,
    role?: Message["role"]
  ) => {
    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) {
          return normalizeConversation(conversation);
        }

        return normalizeConversation({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  content: updatedContent,
                  role: role ?? message.role,
                }
              : message
          ),
        });
      })
    );
  };

  const selectConversation = (
    conversationId: string
  ) => {
    setCurrentConversationId(conversationId);
  };

  // Rename a project (update all conversations with that projectId)
  const renameProject = (
    oldProjectId: string,
    newProjectId: string
  ) => {
    const now = new Date().toISOString();

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.projectId === oldProjectId
          ? normalizeConversation({
              ...conversation,
              projectId: newProjectId,
              updatedAt: now,
            })
          : normalizeConversation(conversation)
      )
    );
  };

  // Delete a project (move all conversations to "Uncategorized")
  const deleteProject = (projectId: string) => {
    if (projectId === "Uncategorized") return;

    const now = new Date().toISOString();

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.projectId === projectId
          ? normalizeConversation({
              ...conversation,
              projectId: null,
              updatedAt: now,
            })
          : normalizeConversation(conversation)
      )
    );
  };

  const currentConversation =
    normalizedConversations.find(
      (conversation) =>
        conversation.id === currentConversationId
    ) ?? null;

  return {
    conversations: normalizedConversations,
    currentConversation,
    currentConversationId,
    createConversation,
    renameConversation,
    addMessage,
    updateMessage,
    toggleFavorite,
    moveConversationToProject,
    changeConversationPlatform,
    duplicateConversation,
    deleteConversation,
    selectConversation,
    renameProject,
    deleteProject,
  };
}
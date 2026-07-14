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
import { generateAssistantReply } from "../providers";

// Options 型別定義（支援 Template、Prompt Library 等未來功能）
export type CreateConversationOptions = {
  title?: string;
  platform?: Platform | string;
  model?: string;
  projectId?: string | null;
};

function buildConversationTitle(content: string) {
  const normalizedContent = content
    .replace(/\\s+/g, " ")
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

  // Sprint 9: Reply with... — 以新模型重新生成指定訊息的回覆
  // messageIndex: 要重新生成的 assistant message 在 messages 陣列中的索引
  const regenerateWith = async (
    conversationId: string,
    messageIndex: number,
    newPlatform: string,
    newModel: string
  ) => {
    const conversation = normalizedConversations.find(
      (c) => c.id === conversationId
    );
    if (!conversation) return;

    const messages = conversation.messages;
    if (messageIndex < 0 || messageIndex >= messages.length) return;

    const targetMessage = messages[messageIndex];
    if (targetMessage.role !== "assistant") return;

    // 找到這輪對話的 user prompt（通常是前一則訊息）
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0) return;
    const userMessage = messages[userMessageIndex];
    if (userMessage.role !== "user") return;

    const prompt = userMessage.content;
    const validatedPlatform = isPlatform(newPlatform)
      ? newPlatform
      : DEFAULT_PLATFORM;
    const finalModel = newModel ?? getDefaultModel(validatedPlatform);

    // 標記正在重新生成
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== conversationId) {
          return normalizeConversation(conv);
        }
        return normalizeConversation({
          ...conv,
          updatedAt: new Date().toISOString(),
          messages: conv.messages.map((msg, idx) =>
            idx === messageIndex
              ? {
                  ...msg,
                  regenerating: true,
                  originalModel: msg.model,
                  model: finalModel,
                  platform: validatedPlatform,
                }
              : msg
          ),
        });
      })
    );

    // 取得 API Key
    const apiKeys = JSON.parse(
      localStorage.getItem("aihub-api-keys") ?? "{}"
    );
    const apiKey = apiKeys[validatedPlatform];

    if (!apiKey) {
      // 沒有 API Key，標記錯誤
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) {
            return normalizeConversation(conv);
          }
          return normalizeConversation({
            ...conv,
            messages: conv.messages.map((msg, idx) =>
              idx === messageIndex
                ? {
                    ...msg,
                    regenerating: false,
                    role: "error",
                    content:
                      `⚠️ ${validatedPlatform} 尚未設定 API Key，無法重新生成。請至 Settings 設定後重試。`,
                  }
                : msg
            ),
          });
        })
      );
      return;
    }

    try {
      // 呼叫新 Provider 產生回覆
      const reply = await generateAssistantReply({
        platform: validatedPlatform,
        model: finalModel,
        prompt,
        apiKey,
      });

      // 更新訊息內容
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) {
            return normalizeConversation(conv);
          }
          return normalizeConversation({
            ...conv,
            updatedAt: new Date().toISOString(),
            messages: conv.messages.map((msg, idx) =>
              idx === messageIndex
                ? {
                    ...msg,
                    regenerating: false,
                    content: reply.content,
                    model: reply.model,
                    platform: reply.provider,
                    role: reply.usedFallback ? "error" : "assistant",
                  }
                : msg
            ),
          });
        })
      );
    } catch (error) {
      // 發生錯誤，恢復原狀並顯示錯誤
      const message = error instanceof Error ? error.message : "未知錯誤";
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) {
            return normalizeConversation(conv);
          }
          return normalizeConversation({
            ...conv,
            messages: conv.messages.map((msg, idx) =>
              idx === messageIndex
                ? {
                    ...msg,
                    regenerating: false,
                    role: "error",
                    content: `⚠️ 重新生成失敗：${message}`,
                    model: msg.originalModel ?? msg.model,
                    platform: msg.originalModel
                      ? validatedPlatform
                      : msg.platform,
                  }
                : msg
            ),
          });
        })
      );
    }
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
    regenerateWith,
  };
}
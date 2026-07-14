import { useMemo } from "react";

import type { Conversation } from "../types/conversation";

export type MatchedField =
  | "title"
  | "message"
  | "platform"
  | "project"
  | "favorite";

export type ConversationSearchResult = {
  conversation: Conversation;
  preview: string | null;
  matchedFields: MatchedField[];
  relevanceScore: number;
};

type UseConversationSearchProps = {
  conversations: Conversation[];
  keyword: string;
};

const PREVIEW_LIMIT = 70;

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

function buildPreview(text: string, keyword: string) {
  const trimmedText = text.replace(/\s+/g, " ").trim();

  if (!trimmedText || !keyword) {
    return null;
  }

  const normalizedText = trimmedText.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedKeyword);

  if (matchIndex === -1) {
    return trimmedText.length > PREVIEW_LIMIT
      ? `${trimmedText.slice(0, PREVIEW_LIMIT)}…`
      : trimmedText;
  }

  const startIndex = Math.max(0, matchIndex - 20);
  const endIndex = Math.min(
    trimmedText.length,
    matchIndex + keyword.length + 20
  );

  let preview = trimmedText.slice(startIndex, endIndex).trim();

  if (startIndex > 0) {
    preview = `…${preview}`;
  }

  if (endIndex < trimmedText.length) {
    preview = `${preview}…`;
  }

  return preview;
}

export default function useConversationSearch({
  conversations,
  keyword,
}: UseConversationSearchProps) {
  return useMemo(() => {
    const normalizedKeyword = normalizeKeyword(keyword);

    if (!normalizedKeyword) {
      return conversations.map((conversation) => ({
        conversation,
        preview: null,
        matchedFields: [],
        relevanceScore: 0,
      }));
    }

    return conversations
      .map((conversation) => {
        const matchedFields: MatchedField[] = [];
        let preview: string | null = null;
        let relevanceScore = 0;

        // 1. Title match (highest priority)
        if (conversation.title
          .toLowerCase()
          .includes(normalizedKeyword)
        ) {
          matchedFields.push("title");
          preview = buildPreview(conversation.title, normalizedKeyword);
          relevanceScore += 1000;
        }

        // 2. Message content match
        if (!matchedFields.includes("title")) {
          const matchedMessage = conversation.messages.find((message) =>
            message.content.toLowerCase().includes(normalizedKeyword)
          );

          if (matchedMessage) {
            matchedFields.push("message");
            preview = buildPreview(matchedMessage.content, normalizedKeyword);
            relevanceScore += 100;
          }
        }

        // 3. Platform match (keyword matches platform name or ID)
        const platformMatch = conversation.platform
          .toLowerCase()
          .includes(normalizedKeyword);

        if (platformMatch) {
          matchedFields.push("platform");
          preview = preview || `Platform: ${conversation.platform}`;
          relevanceScore += 50;
        }

        // 4. Project match
        if (
          conversation.projectId &&
          conversation.projectId.toLowerCase().includes(normalizedKeyword)
        ) {
          matchedFields.push("project");
          preview = preview || `Project: ${conversation.projectId}`;
          relevanceScore += 30;
        }

        // 5. Favorite flag match
        if (normalizedKeyword === "favorite" || normalizedKeyword === "starred") {
          if (conversation.favorite) {
            matchedFields.push("favorite");
            relevanceScore += 20;
          }
        }

        // Return result only if at least one field matched
        return matchedFields.length > 0
          ? {
              conversation,
              preview,
              matchedFields,
              relevanceScore,
            }
          : null;
      })
      .filter(
        (result): result is ConversationSearchResult =>
          result !== null
      )
      // Sort by relevance score (highest first)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [conversations, keyword]);
}

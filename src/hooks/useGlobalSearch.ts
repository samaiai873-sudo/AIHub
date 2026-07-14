import { useMemo } from "react";

import type { Conversation } from "../types/conversation";
import type { Prompt } from "../types/prompt";

export type GlobalSearchResultType = "conversation" | "prompt" | "project";

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle: string;
  preview: string | null;
  relevanceScore: number;
  data: Conversation | Prompt | { id: string; name: string };
};

type UseGlobalSearchProps = {
  conversations: Conversation[];
  prompts: Prompt[];
  projects: string[];
  keyword: string;
};

const PREVIEW_LIMIT = 80;

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

  const startIndex = Math.max(0, matchIndex - 25);
  const endIndex = Math.min(
    trimmedText.length,
    matchIndex + keyword.length + 25
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

function calculateRelevance(
  text: string,
  keyword: string,
  baseScore: number
): number {
  if (!keyword || !text) return baseScore;
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  const matchCount = (normalizedText.match(new RegExp(normalizedKeyword, "g")) || []).length;
  return baseScore + matchCount * 10;
}

export default function useGlobalSearch({
  conversations,
  prompts,
  projects,
  keyword,
}: UseGlobalSearchProps) {
  return useMemo(() => {
    const normalizedKeyword = normalizeKeyword(keyword);

    if (!normalizedKeyword) {
      return [];
    }

    const results: GlobalSearchResult[] = [];

    // Search Conversations
    conversations.forEach((conversation) => {
      const matchedFields: string[] = [];
      let preview: string | null = null;
      let relevanceScore = 0;

      // Title match (highest priority)
      if (conversation.title.toLowerCase().includes(normalizedKeyword)) {
        matchedFields.push("title");
        preview = buildPreview(conversation.title, normalizedKeyword);
        relevanceScore += 1000;
      }

      // Message content match
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

      // Platform match
      if (conversation.platform.toLowerCase().includes(normalizedKeyword)) {
        matchedFields.push("platform");
        preview = preview || `Platform: ${conversation.platform}`;
        relevanceScore += 50;
      }

      // Project match
      if (
        conversation.projectId &&
        conversation.projectId.toLowerCase().includes(normalizedKeyword)
      ) {
        matchedFields.push("project");
        preview = preview || `Project: ${conversation.projectId}`;
        relevanceScore += 30;
      }

      // Favorite match
      if (
        (normalizedKeyword === "favorite" ||
          normalizedKeyword === "starred") &&
        conversation.favorite
      ) {
        matchedFields.push("favorite");
        relevanceScore += 20;
      }

      if (matchedFields.length > 0) {
        relevanceScore = calculateRelevance(
          conversation.title + " " + conversation.messages.map(m => m.content).join(" "),
          normalizedKeyword,
          relevanceScore
        );

        results.push({
          id: conversation.id,
          type: "conversation",
          title: conversation.title,
          subtitle: `💬 ${conversation.platform} · ${conversation.model}${
            conversation.projectId ? ` · 📁 ${conversation.projectId}` : ""
          }${conversation.favorite ? " ⭐" : ""}`,
          preview,
          relevanceScore,
          data: conversation,
        });
      }
    });

    // Search Prompts
    prompts.forEach((prompt) => {
      const matchedFields: string[] = [];
      let preview: string | null = null;
      let relevanceScore = 0;

      // Title match
      if (prompt.title.toLowerCase().includes(normalizedKeyword)) {
        matchedFields.push("title");
        preview = buildPreview(prompt.title, normalizedKeyword);
        relevanceScore += 1000;
      }

      // Content match
      if (!matchedFields.includes("title")) {
        if (prompt.content.toLowerCase().includes(normalizedKeyword)) {
          matchedFields.push("content");
          preview = buildPreview(prompt.content, normalizedKeyword);
          relevanceScore += 100;
        }
      }

      // Platform match
      if (prompt.platform.toLowerCase().includes(normalizedKeyword)) {
        matchedFields.push("platform");
        preview = preview || `Platform: ${prompt.platform}`;
        relevanceScore += 50;
      }

      // Tags match
      const matchedTag = prompt.tags.find((tag) =>
        tag.toLowerCase().includes(normalizedKeyword)
      );
      if (matchedTag) {
        matchedFields.push("tag");
        preview = preview || `Tag: ${matchedTag}`;
        relevanceScore += 30;
      }

      // Favorite match
      if (
        (normalizedKeyword === "favorite" ||
          normalizedKeyword === "starred") &&
        prompt.favorite
      ) {
        matchedFields.push("favorite");
        relevanceScore += 20;
      }

      if (matchedFields.length > 0) {
        relevanceScore = calculateRelevance(
          prompt.title + " " + prompt.content + " " + prompt.tags.join(" "),
          normalizedKeyword,
          relevanceScore
        );

        results.push({
          id: prompt.id,
          type: "prompt",
          title: prompt.title,
          subtitle: `📝 ${prompt.platform} · ${prompt.model}${prompt.favorite ? " ⭐" : ""}`,
          preview,
          relevanceScore,
          data: prompt,
        });
      }
    });

    // Search Projects
    projects.forEach((projectId) => {
      if (projectId.toLowerCase().includes(normalizedKeyword)) {
        results.push({
          id: projectId,
          type: "project",
          title: projectId,
          subtitle: "📁 Project",
          preview: null,
          relevanceScore: 500,
          data: { id: projectId, name: projectId },
        });
      }
    });

    // Sort by relevance score (highest first)
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [conversations, prompts, projects, keyword]);
}
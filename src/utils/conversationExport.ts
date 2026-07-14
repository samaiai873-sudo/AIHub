import type { Conversation } from "../types/conversation";

export function exportToMarkdown(conversation: Conversation): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${conversation.title}`);
  lines.push("");

  // Metadata
  lines.push("## Conversation Info");
  lines.push(`- **ID:** ${conversation.id}`);
  lines.push(`- **Platform:** ${conversation.platform}`);
  lines.push(`- **Model:** ${conversation.model}`);
  lines.push(
    `- **Project:** ${conversation.projectId || "Uncategorized"}`
  );
  lines.push(
    `- **Created:** ${new Date(
      conversation.createdAt
    ).toLocaleString()}`
  );
  lines.push(
    `- **Updated:** ${new Date(
      conversation.updatedAt
    ).toLocaleString()}`
  );
  lines.push("");

  // Messages
  if (conversation.messages.length === 0) {
    lines.push("*No messages yet*");
  } else {
    lines.push("## Messages");
    lines.push("");

    conversation.messages.forEach((message, index) => {
      if (message.role === "user") {
        lines.push("### You");
      } else if (message.role === "system") {
        lines.push("### ℹ️ System");
      } else if (message.role === "error") {
        lines.push("### ❌ Error");
      } else {
        lines.push(`### ${message.platform} / ${message.model}`);
      }

      lines.push("");
      lines.push(message.content);
      lines.push("");

      if (index < conversation.messages.length - 1) {
        lines.push("---");
        lines.push("");
      }
    });
  }

  return lines.join("\n");
}

export function exportToJSON(conversation: Conversation): string {
  return JSON.stringify(conversation, null, 2);
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateConversationFilename(
  conversation: Conversation,
  format: "md" | "json"
): string {
  const timestamp = new Date(conversation.updatedAt)
    .toISOString()
    .slice(0, 10);

  const safeName = conversation.title
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 50);

  const ext = format === "md" ? "md" : "json";
  return `conversation-${safeName}-${timestamp}.${ext}`;
}

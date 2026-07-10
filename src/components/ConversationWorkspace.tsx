import { useState } from "react";

import type { Message } from "../types/conversation";

import MessageList from "./MessageList";
import Composer from "./Composer";

export default function ConversationWorkspace() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = (content: string) => {
    const now = new Date().toISOString();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      platform: "user",
      model: "",
      content,
      createdAt: now,
    };

    const aiMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      platform: "ChatGPT",
      model: "GPT-5",
      content:
        "🤖 這是一則測試回覆。\n\n下一步我們會把這裡改成真正的 AI API。",
      createdAt: now,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      aiMessage,
    ]);
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#202020",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 20,
          borderBottom: "1px solid #333",
          fontWeight: "bold",
          fontSize: 20,
        }}
      >
        💬 Conversation
      </div>

      <MessageList messages={messages} />

      <Composer onSend={handleSend} />
    </div>
  );
}
import type { Message } from "../types/conversation";
import MessageBubble from "./MessageBubble";

type MessageListProps = {
  messages: Message[];
};

export default function MessageList({
  messages,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
          fontSize: 18,
        }}
      >
        💬 尚未開始對話
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: 20,
      }}
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          messageIndex={index}
        />
      ))}
    </div>
  );
}
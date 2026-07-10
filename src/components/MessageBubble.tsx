import type { Message } from "../types/conversation";

type MessageBubbleProps = {
  message: Message;
};

export default function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser
          ? "flex-end"
          : "flex-start",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "12px 16px",
          borderRadius: 12,
          background: isUser
            ? "#2d7ef7"
            : "#343541",
          color: "white",
        }}
      >
        {!isUser && (
          <div
            style={{
              fontSize: 12,
              opacity: 0.7,
              marginBottom: 6,
            }}
          >
            {message.platform} · {message.model}
          </div>
        )}

        <div
          style={{
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
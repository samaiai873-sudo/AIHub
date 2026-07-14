import type { Message } from "../types/conversation";

type MessageBubbleProps = {
  message: Message;
};

export default function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isError = message.role === "error";

  // System / Error 訊息不是真正的對話內容，用置中、跟一般對話泡泡不同的樣式呈現，
  // 一眼就能跟 user/assistant 的真實回覆區分開來。
  if (isSystem || isError) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            maxWidth: "80%",
            padding: "10px 16px",
            borderRadius: 10,
            background: isError ? "#3a1f1f" : "#2b2b2b",
            border: `1px solid ${isError ? "#c0392b" : "#555"}`,
            color: isError ? "#ff9a8b" : "#c2c2c2",
            fontSize: 13,
            whiteSpace: "pre-wrap",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {isError ? "❌ Error" : "ℹ️ System"}
          </div>
          {message.content}
        </div>
      </div>
    );
  }

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

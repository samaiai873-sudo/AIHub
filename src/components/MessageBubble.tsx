import { useState } from "react";
import type { Message } from "../types/conversation";
import { aiPlatforms } from "../data/aiPlatforms";
import { useConversationContext } from "../context/useConversationContext";

type MessageBubbleProps = {
  message: Message;
  messageIndex: number;
};

export default function MessageBubble({
  message,
  messageIndex,
}: MessageBubbleProps) {
  const [showReplyMenu, setShowReplyMenu] = useState(false);
  const { regenerateWith, currentConversation } = useConversationContext();

  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isError = message.role === "error";
  const isAssistant = message.role === "assistant";
  const isRegenerating = message.regenerating === true;

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

  const handleReplyWith = (platformId: string) => {
    if (!currentConversation) return;
    const platformInfo = aiPlatforms.find((p) => p.id === platformId);
    if (!platformInfo || platformInfo.models.length === 0) return;

    // 使用該平台的第一個模型作為預設
    const modelId = platformInfo.models[0].id;
    setShowReplyMenu(false);
    regenerateWith(currentConversation.id, messageIndex, platformId, modelId);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
        position: "relative",
      }}
      onMouseEnter={() => isAssistant && setShowReplyMenu(true)}
      onMouseLeave={() => setShowReplyMenu(false)}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "12px 16px",
          borderRadius: 12,
          background: isUser ? "#2d7ef7" : "#343541",
          color: "white",
          position: "relative",
        }}
      >
        {!isUser && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              opacity: 0.7,
              marginBottom: 6,
            }}
          >
            <span>
              {message.platform} · {message.model}
            </span>
            {isAssistant && showReplyMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: "#2b2b2b",
                  border: "1px solid #444",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  zIndex: 10,
                  minWidth: 160,
                }}
                onMouseEnter={() => setShowReplyMenu(true)}
                onMouseLeave={() => setShowReplyMenu(false)}
              >
                <div style={{ padding: "4px 8px", fontSize: 11, color: "#888", borderBottom: "1px solid #333" }}>
                  Reply with…
                </div>
                {aiPlatforms
                  .filter((p) => p.id !== message.platform)
                  .map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => handleReplyWith(platform.id)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "none",
                        background: "transparent",
                        color: "white",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      {platform.icon} {platform.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            whiteSpace: "pre-wrap",
            opacity: isRegenerating ? 0.7 : 1,
          }}
        >
          {message.content}
          {isRegenerating && " ▋"}
        </div>
      </div>
    </div>
  );
}

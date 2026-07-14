import { useState } from "react";

type ComposerProps = {
  onSend: (content: string) => void;
  /** Sprint 8：Browser Workflow — 複製 Prompt 並開啟對應平台官網 */
  onOpenInBrowser?: (content: string) => void;
  /** true：目前這個 Conversation 沒有設定 API Key，Send 會走免費的 Open in Browser 流程 */
  isFreeMode?: boolean;
};

export default function Composer({
  onSend,
  onOpenInBrowser,
  isFreeMode = true,
}: ComposerProps) {
  const [value, setValue] = useState("");

  const send = () => {
    const text = value.trim();

    if (!text) return;

    onSend(text);

    setValue("");
  };

  const openInBrowser = () => {
    const text = value.trim();

    if (!text || !onOpenInBrowser) return;

    onOpenInBrowser(text);

    setValue("");
  };

  return (
    <div style={{ borderTop: "1px solid #333" }}>
      <div
        style={{
          padding: "8px 20px 0",
          fontSize: 12,
          color: isFreeMode ? "#8bc98b" : "#87ceeb",
        }}
      >
        {isFreeMode
          ? "🆓 尚未設定 API Key：Send 會在對話裡顯示提示，真的要免費對話請按「Open in Browser」"
          : "🔌 API 模式：已設定這個平台的 API Key，Send 會直接打 API 並在這裡顯示回覆"}
      </div>

      <div
        style={{
          padding: 20,
          display: "flex",
          gap: 10,
        }}
      >
        <input
          value={value}
          onChange={(event) =>
            setValue(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              send();
            }
          }}
          placeholder="輸入 Prompt..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "none",
          }}
        />

        {onOpenInBrowser && (
          <button
            onClick={openInBrowser}
            title="複製 Prompt 並開啟對應平台官網"
            style={{
              padding: "0 20px",
              borderRadius: 8,
              cursor: "pointer",
              background: "transparent",
              border: "1px solid #555",
              color: "#87ceeb",
            }}
          >
            🌐 Open in Browser
          </button>
        )}

        <button
          onClick={send}
          style={{
            padding: "0 24px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { aiPlatforms } from "../data/aiPlatforms";

type ComposerProps = {
  onSend: (content: string, platform?: string, model?: string) => void;
  isFreeMode?: boolean;
  defaultPlatform?: string;
  defaultModel?: string;
};

export default function Composer({
  onSend,
  isFreeMode = true,
  defaultPlatform,
  defaultModel,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const [selectedModel, setSelectedModel] = useState(defaultModel || "");

  const send = () => {
    const text = value.trim();

    if (!text) return;

    onSend(text, defaultPlatform, selectedModel || defaultModel);

    setValue("");
  };

  // 取得當前平台的模型列表
  const currentPlatformInfo = aiPlatforms.find((p) => p.id === defaultPlatform);
  const availableModels = currentPlatformInfo?.models || [];

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
          ? "🆓 尚未設定 API Key：Send 會在對話裡顯示提示"
          : "🔌 API 模式：已設定這個平台的 API Key，Send 會直接打 API 並在這裡顯示回覆"}
      </div>

      <div
        style={{
          padding: 20,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Model Selector */}
        {availableModels.length > 0 && (
          <select
            value={selectedModel || availableModels[0]?.id || ""}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #444",
              background: "#2b2b2b",
              color: "white",
              fontSize: 13,
              cursor: "pointer",
              minWidth: 140,
            }}
            title="選擇這輪對話使用的模型（預設跟隨對話設定）"
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        )}

        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              send();
            }
          }}
          placeholder="輸入 Prompt..."
          style={{
            flex: 1,
            minWidth: 200,
            padding: 12,
            borderRadius: 8,
            border: "none",
          }}
        />

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
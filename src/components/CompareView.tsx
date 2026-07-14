import { useState, useEffect } from "react";
import { aiPlatforms } from "../data/aiPlatforms";
import { generateAssistantReply } from "../providers";
import useApiKeys from "../hooks/useApiKeys";

type CompareResult = {
  platform: string;
  model: string;
  content: string;
  error?: string;
  streaming: boolean;
};

type CompareViewProps = {
  /** 要比較的 prompt */
  prompt: string;
  /** 選中的模型列表：[{ platform, model }, ...] */
  selectedModels: { platform: string; model: string }[];
  /** 關閉比較視圖 */
  onClose: () => void;
  /** 使用者選擇其中一個回覆作為正式回覆 */
  onPickWinner: (platform: string, model: string, content: string) => void;
};

export default function CompareView({
  prompt,
  selectedModels,
  onClose,
  onPickWinner,
}: CompareViewProps) {
  const { apiKeys } = useApiKeys();
  
  // 使用 lazy initialization 避免在 effect 中同步 setState
  const [results, setResults] = useState<Record<string, CompareResult>>(() => {
    const initial: Record<string, CompareResult> = {};
    for (const { platform, model } of selectedModels) {
      const key = `${platform}:${model}`;
      initial[key] = {
        platform,
        model,
        content: "",
        streaming: true,
      };
    }
    return initial;
  });
  
  const [isRunning, setIsRunning] = useState(true);

  // 執行並行比較
  useEffect(() => {
    if (!isRunning) return;

    let cancelled = false;

    const runComparison = async () => {
      const promises = selectedModels.map(async ({ platform, model }) => {
        const key = `${platform}:${model}`;
        const apiKey = apiKeys[platform];

        if (!apiKey) {
          if (!cancelled) {
            setResults((prev) => ({
              ...prev,
              [key]: {
                ...prev[key],
                platform,
                model,
                content: `⚠️ ${platform} 尚未設定 API Key`,
                error: "no_api_key",
                streaming: false,
              },
            }));
          }
          return;
        }

        try {
          const reply = await generateAssistantReply({
            platform,
            model,
            prompt,
            apiKey,
            onChunk: (chunk) => {
              if (!cancelled) {
                setResults((prev) => ({
                  ...prev,
                  [key]: {
                    ...prev[key],
                    content: chunk,
                    streaming: true,
                  },
                }));
              }
            },
          });

          if (!cancelled) {
            setResults((prev) => ({
              ...prev,
              [key]: {
                platform,
                model,
                content: reply.content,
                error: reply.usedFallback ? reply.error : undefined,
                streaming: false,
              },
            }));
          }
        } catch (error) {
          if (!cancelled) {
            const message = error instanceof Error ? error.message : "未知錯誤";
            setResults((prev) => ({
              ...prev,
              [key]: {
                platform,
                model,
                content: `❌ 錯誤：${message}`,
                error: message,
                streaming: false,
              },
            }));
          }
        }
      });

      await Promise.all(promises);
      if (!cancelled) {
        setIsRunning(false);
      }
    };

    runComparison();

    return () => {
      cancelled = true;
    };
  }, [prompt, selectedModels, apiKeys, isRunning]);

  const platformInfo = (platformId: string) =>
    aiPlatforms.find((p) => p.id === platformId);

  const handlePickWinner = (platform: string, model: string, content: string) => {
    onPickWinner(platform, model, content);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        padding: 20,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
      onClick={onClose}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid #333",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #555",
              background: "#2b2b2b",
              color: "white",
              cursor: "pointer",
            }}
          >
            ← 關閉比較
          </button>
          <h2 style={{ margin: 0, fontSize: 18 }}>📊 模型回覆比較</h2>
          <span style={{ color: "#888", fontSize: 13 }}>
            Prompt: {prompt.length > 60 ? prompt.slice(0, 60) + "…" : prompt}
          </span>
        </div>

        {isRunning && (
          <div style={{ color: "#8bc98b", fontSize: 12 }}>
            🔄 串流中…
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "grid",
          gridTemplateColumns:
            selectedModels.length <= 2
              ? "repeat(2, 1fr)"
              : "repeat(3, 1fr)",
          gap: 16,
          width: "100%",
          maxWidth: 1400,
          margin: "0 auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedModels.map(({ platform, model }) => {
          const key = `${platform}:${model}`;
          const result = results[key];
          const info = platformInfo(platform);

          if (!result) return null;

          const isError = !!result.error;
          const isStreaming = result.streaming;

          return (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#1e1e1e",
                border: `1px solid ${isError ? "#c0392b" : "#333"}`,
                borderRadius: 12,
                overflow: "hidden",
                minHeight: 400,
              }}
            >
              {/* Model Header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #333",
                  background: "#252525",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>{info?.icon || "🤖"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {info?.name || platform}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#888",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {model}
                  </div>
                </div>
                {isStreaming && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#2d7ef7",
                      color: "white",
                    }}
                    className="animate-pulse"
                  >
                    ▋ 串流中
                  </span>
                )}
                {isError && !isStreaming && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#c0392b",
                      color: "white",
                    }}
                  >
                    錯誤
                  </span>
                )}
                {!isError && !isStreaming && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#27ae60",
                      color: "white",
                    }}
                  >
                    完成
                  </span>
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: 16,
                  overflow: "auto",
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  color: isError ? "#ff9a8b" : "white",
                }}
              >
                {result.content || (isStreaming ? "等待回覆…" : "無回覆")}
                {isStreaming && " ▋"}
              </div>

              {/* Actions */}
              {!isStreaming && !isError && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderTop: "1px solid #333",
                    background: "#252525",
                  }}
                >
                  <button
                    onClick={() => handlePickWinner(platform, model, result.content)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "#2d7ef7",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    ✅ 選擇此回覆
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
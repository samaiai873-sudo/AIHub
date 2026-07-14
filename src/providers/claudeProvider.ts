import type { AIProvider } from "./types";
import { createFallbackReply } from "./utils";

const ENDPOINT = "https://api.anthropic.com/v1/messages";

// UI 層 model id（見 constants/models.ts）→ 真正呼叫 Anthropic API 用的 model 字串
const API_MODEL_MAP: Record<string, string> = {
  "sonnet-3.5": "claude-3-5-sonnet-20241022",
  "haiku-3.5": "claude-3-5-haiku-20241022",
  "opus-3": "claude-3-opus-20240229",
};

function resolveApiModel(model: string): string {
  return API_MODEL_MAP[model] ?? model;
}

export const claudeProvider: AIProvider = {
  id: "claude",
  name: "Claude",
  supportsStreaming: true,
  defaultModel: "sonnet-3.5",

  async sendMessage({ model, prompt, apiKey, onChunk }) {
    if (!apiKey) {
      return createFallbackReply({
        platform: "claude",
        model,
        prompt,
        error: "尚未設定 API Key。",
      });
    }

    const apiModel = resolveApiModel(model || this.defaultModel);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          model: apiModel,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        throw new Error(errorPayload || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("API returned no streaming body.");
      }

      let messageContent = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const eventData = JSON.parse(trimmed.replace(/^data: /, ""));
            const eventType = eventData.type;

            if (eventType === "content_block_delta") {
              const deltaText = eventData.delta?.text ?? "";
              if (deltaText) {
                messageContent += deltaText;
                onChunk?.(messageContent);
              }
            }
            // message_stop 事件代表結束，可以忽略
          } catch {
            // 忽略解析錯誤（不完整的 chunk）
          }
        }
      }

      if (!messageContent) {
        throw new Error("API returned an empty response.");
      }

      return {
        content: messageContent,
        provider: "claude",
        model: apiModel,
        usedFallback: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知錯誤";
      return createFallbackReply({
        platform: "claude",
        model,
        prompt,
        error: `請求失敗：${message}`,
      });
    }
  },
};

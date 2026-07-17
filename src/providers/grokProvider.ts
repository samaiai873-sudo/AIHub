import type { AIProvider } from "./types";
import { createFallbackReply } from "./utils";

const ENDPOINT = "https://api.x.ai/v1/chat/completions";

// UI 層 model id → 真正呼叫 xAI API 用的 model 字串
// 官方 API 文件：https://docs.x.ai/developers/models
const API_MODEL_MAP: Record<string, string> = {
  "grok-4.5": "grok-4.5",
  "grok-4": "grok-4",
};

function resolveApiModel(model: string): string {
  return API_MODEL_MAP[model] ?? model;
}

export const grokProvider: AIProvider = {
  id: "grok",
  name: "Grok",
  supportsStreaming: true,
  defaultModel: "grok-4.5",

  async sendMessage({ model, prompt, apiKey, onChunk }) {
    if (!apiKey) {
      return createFallbackReply({
        platform: "grok",
        model,
        prompt,
        error: "尚未設定 API Key。",
      });
    }

    const apiModel = resolveApiModel(model || this.defaultModel);
    const callback = onChunk;
    const isStreaming = typeof callback === "function";

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant inside AIHub. Answer briefly and clearly.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          stream: isStreaming,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        throw new Error(
          errorPayload || `Request failed with status ${response.status}`
        );
      }

      if (!isStreaming) {
        const payload = await response.json();
        const messageContent = payload.choices?.[0]?.message?.content ?? "";

        if (!messageContent) {
          throw new Error("API returned an empty response.");
        }

        onChunk?.(messageContent);

        return {
          content: messageContent,
          provider: "grok",
          model: apiModel,
          usedFallback: false,
        };
      }

      // 串流模式 (SSE)
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
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          try {
            const jsonStr = trimmed.replace(/^data:\s*/, "");
            if (jsonStr === "[DONE]") continue;
            const data = JSON.parse(jsonStr);
            const deltaContent = data.choices?.[0]?.delta?.content ?? "";
            if (deltaContent) {
              messageContent += deltaContent;
              callback?.(messageContent);
            }
          } catch {
            // 忽略不完整的 stream payload
          }
        }
      }

      if (!messageContent) {
        throw new Error("API returned an empty response.");
      }

      return {
        content: messageContent,
        provider: "grok",
        model: apiModel,
        usedFallback: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知錯誤";
      return createFallbackReply({
        platform: "grok",
        model,
        prompt,
        error: `請求失敗：${message}`,
      });
    }
  },
};

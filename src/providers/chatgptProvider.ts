import type { AIProvider } from "./types";
import { createFallbackReply } from "./utils";

// OpenAI 不允許瀏覽器直接跨網域呼叫（會被 CORS 擋掉），
// 本機開發時透過 vite.config.ts 的 server.proxy 轉發，避開這個限制。
// 正式部署給別人用時，這裡要換成真正的後端 proxy 網址（見架構討論）。
const ENDPOINT = import.meta.env.DEV
  ? "/api/openai/v1/chat/completions"
  : "https://api.openai.com/v1/chat/completions";

// UI 層 model id（見 constants/models.ts）→ 真正呼叫 OpenAI API 用的 model 字串
// 官方 API 文件：https://developers.openai.com/api/docs/models
const API_MODEL_MAP: Record<string, string> = {
  "gpt-4o": "gpt-4o",
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4-turbo": "gpt-4-turbo",
  "gpt-5.6-sol": "gpt-5.6-sol",
  "gpt-5.6-terra": "gpt-5.6-terra",
  "gpt-5.6-luna": "gpt-5.6-luna",
};

function resolveApiModel(model: string): string {
  return API_MODEL_MAP[model] ?? model;
}

export const chatgptProvider: AIProvider = {
  id: "chatgpt",
  name: "ChatGPT",
  supportsStreaming: true,
  defaultModel: "gpt-4o",

  async sendMessage({ model, prompt, apiKey, onChunk }) {
    if (!apiKey) {
      return createFallbackReply({
        platform: "chatgpt",
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
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant inside AIHub. Answer briefly and clearly.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
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
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data:")) continue;

          try {
            const data = JSON.parse(trimmed.replace(/^data:\s*/, ""));
            const deltaContent = data.choices?.[0]?.delta?.content ?? "";
            if (deltaContent) {
              messageContent += deltaContent;
              onChunk?.(messageContent);
            }
          } catch {
            // 忽略還沒收完整的 stream payload
          }
        }
      }

      if (!messageContent) {
        throw new Error("API returned an empty response.");
      }

      return {
        content: messageContent,
        provider: "chatgpt",
        model: apiModel,
        usedFallback: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知錯誤";
      return createFallbackReply({
        platform: "chatgpt",
        model,
        prompt,
        error: `請求失敗：${message}`,
      });
    }
  },
};
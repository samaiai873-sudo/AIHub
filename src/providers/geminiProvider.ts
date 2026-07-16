import type { AIProvider } from "./types";
import { createFallbackReply } from "./utils";

function endpointFor(apiModel: string, streaming: boolean) {
  const action = streaming ? "streamGenerateContent" : "generateContent";
  // 串流時加 alt=sse，確保回傳 SSE 格式（data: {...}），而非 JSON 陣列
  return `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:${action}`;
}

// UI 層 model id（見 constants/models.ts）→ 真正呼叫 Gemini API 用的 model 字串
// 官方 API 模型名稱參考：https://ai.google.dev/gemini-api/docs/models
const API_MODEL_MAP: Record<string, string> = {
  "gemini-flash-latest": "gemini-3.5-flash",
  "gemini-pro-latest": "gemini-3.1-pro",
  "gemini-3.5-flash": "gemini-3.5-flash",
  "gemini-3.1-pro": "gemini-3.1-pro",
  "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
};

function resolveApiModel(model: string): string {
  return API_MODEL_MAP[model] ?? model;
}

export const geminiProvider: AIProvider = {
  id: "gemini",
  name: "Gemini",
  supportsStreaming: true,
  defaultModel: "gemini-flash-latest",

  async sendMessage({ model, prompt, apiKey, onChunk }) {
    if (!apiKey) {
      return createFallbackReply({
        platform: "gemini",
        model,
        prompt,
        error: "尚未設定 API Key。",
      });
    }

    const apiModel = resolveApiModel(model || this.defaultModel);
    const callback = onChunk; // 保存 callback 避免 TS 控制流縮窄問題
    const isStreaming = typeof callback === "function";

    try {
      const url = isStreaming
        ? `${endpointFor(apiModel, true)}?key=${apiKey}&alt=sse`
        : `${endpointFor(apiModel, false)}?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        throw new Error(errorPayload || `Request failed with status ${response.status}`);
      }

      if (!isStreaming) {
        // 非串流：一次性讀取完整回應
        const payload = await response.json();
        const messageContent = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (!messageContent) {
          throw new Error("API returned an empty response.");
        }

        onChunk?.(messageContent);

        return {
          content: messageContent,
          provider: "gemini",
          model: apiModel,
          usedFallback: false,
        };
      }

      // 串流：逐行解析 JSON（非 SSE，每行一個完整 JSON 物件）
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
            const chunk = JSON.parse(jsonStr);
            const deltaText = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (deltaText) {
              messageContent += deltaText;
              callback?.(messageContent);
            }
          } catch {
            // 忽略不完整的 JSON 行
          }
        }
      }

      // 處理剩餘 buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data:")) {
          try {
            const jsonStr = trimmed.replace(/^data:\s*/, "");
            if (jsonStr && jsonStr !== "[DONE]") {
              const chunk = JSON.parse(jsonStr);
              const deltaText = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              if (deltaText) {
                messageContent += deltaText;
                callback?.(messageContent);
              }
            }
          } catch {
            // 忽略
          }
        }
      }

      if (!messageContent) {
        throw new Error("API returned an empty response.");
      }

      return {
        content: messageContent,
        provider: "gemini",
        model: apiModel,
        usedFallback: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知錯誤";
      return createFallbackReply({
        platform: "gemini",
        model,
        prompt,
        error: `請求失敗：${message}`,
      });
    }
  },
};
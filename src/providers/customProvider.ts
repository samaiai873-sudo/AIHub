import type { AIProvider } from "./types";
import { createFallbackReply } from "./utils";

/**
 * Custom Provider — 透過 OpenAI 相容 API 端點串接任意模型
 * 使用者從 Settings → 自訂模型 新增，platform id 格式為 `custom:<id>`
 */
export function createCustomProvider(
  customId: string,
  endpoint: string,
  apiKey: string | undefined
): AIProvider {
  return {
    id: `custom:${customId}`,
    name: `Custom: ${customId}`,
    supportsStreaming: true,
    defaultModel: "",

    async sendMessage({ model, prompt, onChunk }) {
      if (!apiKey) {
        return createFallbackReply({
          platform: `custom:${customId}`,
          model,
          prompt,
          error: "尚未設定此自訂模型的 API Key。",
        });
      }

      // Endpoint 健全性檢查 — 早期失敗給清楚訊息，不要等到 fetch 拋「Failed to fetch」
      if (!endpoint) {
        return createFallbackReply({
          platform: `custom:${customId}`,
          model,
          prompt,
          error: "Endpoint 為空，請至 Settings 填入 OpenAI 相容 API 端點。",
        });
      }
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(endpoint);
      } catch {
        return createFallbackReply({
          platform: `custom:${customId}`,
          model,
          prompt,
          error: `Endpoint 無效：「${endpoint}」不是合法的 URL。`,
        });
      }
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        return createFallbackReply({
          platform: `custom:${customId}`,
          model,
          prompt,
          error: `Endpoint protocol 不支援：${parsedUrl.protocol}（需為 http: 或 https:）`,
        });
      }

      const callback = onChunk;
      const isStreaming = typeof callback === "function";
      const url = `${endpoint.replace(/\/$/, "")}/chat/completions`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
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
            errorPayload ||
              `Request failed with status ${response.status}`
          );
        }

        if (!isStreaming) {
          const payload = await response.json();
          const messageContent =
            payload.choices?.[0]?.message?.content ?? "";

          if (!messageContent) {
            throw new Error("API returned an empty response.");
          }

          onChunk?.(messageContent);

          return {
            content: messageContent,
            provider: `custom:${customId}`,
            model,
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
              const deltaContent =
                data.choices?.[0]?.delta?.content ?? "";
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
          provider: `custom:${customId}`,
          model,
          usedFallback: false,
        };
      } catch (error) {
        const rawMessage =
          error instanceof Error ? error.message : "未知錯誤";
        // TypeError 是 fetch 層級失敗（CORS / 網路 / DNS / Mixed Content），
        // 不是 HTTP 錯誤碼。把嘗試的 URL 一起帶上協助 debug。
        const isNetworkError =
          error instanceof TypeError ||
          /Failed to fetch|NetworkError|Load failed/i.test(rawMessage);
        const message = isNetworkError
          ? `${rawMessage}（URL: ${url}）。可能為 CORS、網路或 Mixed Content 問題。`
          : rawMessage;
        return createFallbackReply({
          platform: `custom:${customId}`,
          model,
          prompt,
          error: `請求失敗：${message}`,
        });
      }
    },
  };
}

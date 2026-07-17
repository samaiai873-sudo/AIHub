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

      const callback = onChunk;
      const isStreaming = typeof callback === "function";
      const url = `${endpoint}/chat/completions`;

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
        const message =
          error instanceof Error ? error.message : "未知錯誤";
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

/**
 * NVIDIA Provider - 支援 NVIDIA Nemotron 系列模型
 * 
 * 可透過以下方式使用：
 * 1. NVIDIA API (build.nvidia.com) - 需 API Key
 * 2. OpenRouter - 需 API Key
 * 3. 本地 Ollama (若已拉取 nemotron 模型)
 * 4. LM Studio (載入 Nemotron GGUF)
 */
import type { AIProvider, SendMessageParams, AssistantReply } from "./types";
import { createFallbackReply } from "./utils";

// NVIDIA API 端點
const NVIDIA_API_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

// OpenRouter 端點 (替代方案)
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// UI 層 model id → 實際 API model 名稱映射
const API_MODEL_MAP: Record<string, string> = {
  "nemotron-3-ultra": "nvidia/nemotron-3-ultra",
  "nemotron-4-340b": "nvidia/nemotron-4-340b",
  "nemotron-3-8b": "nvidia/nemotron-3-8b",
};

function resolveApiModel(model: string): string {
  return API_MODEL_MAP[model] ?? model;
}

function getEndpoint(apiKey: string): { url: string; headers: Record<string, string> } {
  // 如果是 OpenRouter key (以 sk-or- 開頭)，使用 OpenRouter
  if (apiKey.startsWith("sk-or-")) {
    return {
      url: OPENROUTER_ENDPOINT,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://aihub.app",
        "X-Title": "AIHub",
      },
    };
  }
  // 預設使用 NVIDIA 官方 API
  return {
    url: NVIDIA_API_ENDPOINT,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
  };
}

export const nvidiaProvider: AIProvider = {
  id: "nvidia",
  name: "NVIDIA Nemotron",
  supportsStreaming: true,
  defaultModel: "nemotron-3-ultra",

  async sendMessage({ model, prompt, apiKey, onChunk }: SendMessageParams): Promise<AssistantReply> {
    if (!apiKey) {
      return createFallbackReply({
        platform: "nvidia",
        model,
        prompt,
        error: "尚未設定 API Key。請在 Settings 中輸入 NVIDIA API Key 或 OpenRouter Key (sk-or-...)",
      });
    }

    const apiModel = resolveApiModel(model || this.defaultModel);
    const { url, headers } = getEndpoint(apiKey);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
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
          stream: !!onChunk,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        throw new Error(errorPayload || `Request failed with status ${response.status}`);
      }

      if (!onChunk) {
        // 非串流模式
        const payload = await response.json();
        const messageContent = payload.choices?.[0]?.message?.content ?? "";

        if (!messageContent) {
          throw new Error("API returned an empty response.");
        }

        return {
          content: messageContent,
          provider: "nvidia",
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
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data);
            const deltaContent = chunk.choices?.[0]?.delta?.content ?? "";
            if (deltaContent) {
              messageContent += deltaContent;
              onChunk?.(messageContent);
            }
          } catch {
            // 忽略解析錯誤 (不完整的 chunk)
          }
        }
      }

      if (!messageContent) {
        throw new Error("API returned an empty response.");
      }

      return {
        content: messageContent,
        provider: "nvidia",
        model: apiModel,
        usedFallback: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知錯誤";
      return createFallbackReply({
        platform: "nvidia",
        model,
        prompt,
        error: `請求失敗：${message}`,
      });
    }
  },
};
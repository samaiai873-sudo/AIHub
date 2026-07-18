/**
 * Local Provider - 統一的本機推理 Provider（相容 OpenAI API）
 *
 * 同時支援 Ollama 與 LM Studio：
 * - Ollama 啟用 OpenAI 相容端點 (http://localhost:11434/v1)
 * - LM Studio 本地伺服器 (http://localhost:1234/v1)
 *
 * 兩者都實作 /v1/chat/completions 與 /v1/models，
 * 差異只是 port 與 base URL，使用者可在 Settings 切換。
 *
 * API 相容性參考：
 * - Ollama: https://github.com/ollama/ollama/blob/main/docs/openai.md
 * - LM Studio: https://lmstudio.ai/docs/api
 */
import type { AIProvider, SendMessageParams, AssistantReply } from "./types";

const DEFAULT_BASE_URL = "http://localhost:1234/v1";
const STORAGE_KEY_BASE_URL = "local-base-url";

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModel[];
}

interface OpenAIChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

interface OpenAIChatResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIChatStreamChunk {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    delta: { role?: string; content?: string };
    finish_reason: string | null;
  }>;
}

export function getBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY_BASE_URL) ?? DEFAULT_BASE_URL;
}

export function setBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_BASE_URL, url);
}

/** 動態從本機端點抓可用模型列表（給 UI 下拉用） */
export async function fetchLocalModels(): Promise<string[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/models`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: OpenAIModelsResponse = await response.json();
    return data.data.map((m) => m.id);
  } catch (error) {
    console.error("Failed to fetch local models:", error);
    return [];
  }
}

/** 偵測本機服務是否可用 */
export async function isLocalAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${getBaseUrl()}/models`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

async function chatComplete(
  params: OpenAIChatRequest
): Promise<OpenAIChatResponse> {
  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message ?? `HTTP ${response.status}`);
  }

  return response.json();
}

async function* streamChatComplete(
  params: OpenAIChatRequest
): AsyncGenerator<string> {
  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, stream: true }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message ?? `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim() || !line.startsWith("data: ")) continue;

        const data = line.slice(6); // 移除 "data: "
        if (data === "[DONE]") return;

        try {
          const chunk: OpenAIChatStreamChunk = JSON.parse(data);
          const content = chunk.choices[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // 忽略解析錯誤（心跳行、不完整片段）
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const localProvider: AIProvider = {
  id: "local",
  name: "Local (Ollama / LM Studio)",
  supportsStreaming: true,
  defaultModel: "local-model",

  async sendMessage(params: SendMessageParams): Promise<AssistantReply> {
    const { prompt, model, onChunk } = params;

    // 檢查本機服務是否可用
    const available = await isLocalAvailable();
    if (!available) {
      return {
        content: "",
        provider: "local",
        model,
        usedFallback: false,
        error: `無法連線到本機推理服務。請確認 Ollama 或 LM Studio 正在運行，且已啟用 OpenAI 相容 API。預設端點：${getBaseUrl()}（可至 Settings 切換）`,
      };
    }

    const messages = [{ role: "user", content: prompt }];

    const requestParams: OpenAIChatRequest = {
      model,
      messages,
      stream: !!onChunk,
      temperature: 0.7,
      top_p: 0.9,
    };

    try {
      if (onChunk) {
        // 串流模式
        let fullContent = "";
        for await (const chunk of streamChatComplete(requestParams)) {
          fullContent += chunk;
          onChunk(fullContent);
        }
        return {
          content: fullContent,
          provider: "local",
          model,
          usedFallback: false,
        };
      } else {
        // 非串流模式
        const response = await chatComplete(requestParams);
        return {
          content: response.choices[0]?.message?.content ?? "",
          provider: "local",
          model,
          usedFallback: false,
        };
      }
    } catch (error) {
      return {
        content: "",
        provider: "local",
        model,
        usedFallback: false,
        error:
          error instanceof Error ? error.message : "本機推理發生未知錯誤",
      };
    }
  },
};

export { getBaseUrl as getLocalBaseUrl, setBaseUrl as setLocalBaseUrl };

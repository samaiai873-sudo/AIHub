/**
 * LM Studio Provider - 本地模型支援 (OpenAI 相容 API)
 * 
 * API 文件: https://lmstudio.ai/docs/api
 * 預設端點: http://localhost:1234/v1
 * 
 * LM Studio 提供與 OpenAI 相容的 /v1/chat/completions 和 /v1/models 端點
 */
import type { AIProvider, SendMessageParams, AssistantReply } from "./types";

const DEFAULT_BASE_URL = "http://localhost:1234/v1";

interface LMStudioModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface LMStudioModelsResponse {
  object: string;
  data: LMStudioModel[];
}

interface LMStudioChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

interface LMStudioChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface LMStudioChatStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: { role?: string; content?: string };
    finish_reason: string | null;
  }>;
}

function getBaseUrl(): string {
  return localStorage.getItem("lmstudio-base-url") ?? DEFAULT_BASE_URL;
}

function setBaseUrl(url: string): void {
  localStorage.setItem("lmstudio-base-url", url);
}

async function fetchModels(): Promise<string[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/models`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: LMStudioModelsResponse = await response.json();
    return data.data.map((m) => m.id);
  } catch (error) {
    console.error("Failed to fetch LM Studio models:", error);
    return [];
  }
}

async function chatComplete(
  params: LMStudioChatRequest
): Promise<LMStudioChatResponse> {
  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message ?? `HTTP ${response.status}`);
  }

  return response.json();
}

async function* streamChatComplete(
  params: LMStudioChatRequest
): AsyncGenerator<string> {
  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, stream: true }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
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
          const chunk: LMStudioChatStreamChunk = JSON.parse(data);
          const content = chunk.choices[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // 忽略解析錯誤
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const lmstudioProvider: AIProvider = {
  id: "lmstudio",
  name: "LM Studio (本地模型)",
  supportsStreaming: true,
  defaultModel: "local-model",

  async sendMessage(params: SendMessageParams): Promise<AssistantReply> {
    const { prompt, model, onChunk } = params;

    // 檢查 LM Studio 服務是否可用
    try {
      await fetch(`${getBaseUrl()}/models`, { method: "GET" });
    } catch {
      return {
        content: "",
        provider: "lmstudio",
        model,
        usedFallback: false,
        error: "無法連線到 LM Studio 服務。請確認 LM Studio 是否正在運行並已啟動本地伺服器 (http://localhost:1234)。",
      };
    }

    // 轉換 prompt 為 messages 格式
    const messages = [{ role: "user", content: prompt }];

    const requestParams: LMStudioChatRequest = {
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
          provider: "lmstudio",
          model,
          usedFallback: false,
        };
      } else {
        // 非串流模式
        const response = await chatComplete(requestParams);
        return {
          content: response.choices[0]?.message?.content ?? "",
          provider: "lmstudio",
          model,
          usedFallback: false,
        };
      }
    } catch (error) {
      return {
        content: "",
        provider: "lmstudio",
        model,
        usedFallback: false,
        error: error instanceof Error ? error.message : "LM Studio 發生未知錯誤",
      };
    }
  },
};

export { fetchModels, getBaseUrl, setBaseUrl };
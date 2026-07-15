/**
 * Ollama Provider - 本地模型支援
 * 
 * API 文件: https://github.com/ollama/ollama/blob/main/docs/api.md
 * 預設端點: http://localhost:11434
 */
import type { AIProvider, SendMessageParams, AssistantReply } from "./types";

const DEFAULT_BASE_URL = "http://localhost:11434";

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: Record<string, unknown>;
  system?: string;
  template?: string;
  context?: number[];
  images?: string[];
  format?: "json" | "";
  keep_alive?: string | number;
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

function parseModelName(fullName: string): string {
  // 移除 tag (如 :latest, :7b 等)
  return fullName.split(":")[0];
}

function getBaseUrl(): string {
  // 可從 localStorage 或環境變數讀取自定義 URL
  return localStorage.getItem("ollama-base-url") ?? DEFAULT_BASE_URL;
}

function setBaseUrl(url: string): void {
  localStorage.setItem("ollama-base-url", url);
}

async function fetchModels(): Promise<string[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/tags`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: OllamaTagsResponse = await response.json();
    return data.models.map((m) => parseModelName(m.name));
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return [];
  }
}

async function generate(
  params: OllamaGenerateRequest
): Promise<OllamaGenerateResponse> {
  const response = await fetch(`${getBaseUrl()}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }
  
  return response.json();
}

async function* streamGenerate(
  params: OllamaGenerateRequest
): AsyncGenerator<string> {
  const response = await fetch(`${getBaseUrl()}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, stream: true }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
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
        if (!line.trim()) continue;
        try {
          const data: OllamaGenerateResponse = JSON.parse(line);
          if (data.response) yield data.response;
          if (data.done) return;
        } catch {
          // 忽略解析錯誤
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const ollamaProvider: AIProvider = {
  id: "ollama",
  name: "Ollama (本地模型)",
  supportsStreaming: true,
  defaultModel: "llama3.1",
  
  async sendMessage(params: SendMessageParams): Promise<AssistantReply> {
    const { prompt, model, onChunk } = params;
    
    // 檢查 Ollama 服務是否可用
    try {
      await fetch(`${getBaseUrl()}/api/tags`, { method: "GET" });
    } catch {
      return {
        content: "",
        provider: "ollama",
        model: model,
        usedFallback: false,
        error: "無法連線到 Ollama 服務。請確認 Ollama 是否正在運行 (http://localhost:11434)。",
      };
    }
    
    const requestParams: OllamaGenerateRequest = {
      model: model,
      prompt: prompt,
      stream: !!onChunk,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    };
    
    try {
      if (onChunk) {
        // 串流模式
        let fullContent = "";
        for await (const chunk of streamGenerate(requestParams)) {
          fullContent += chunk;
          onChunk(fullContent);
        }
        return { 
          content: fullContent, 
          provider: "ollama", 
          model: model, 
          usedFallback: false 
        };
      } else {
        // 非串流模式
        const response = await generate(requestParams);
        return { 
          content: response.response, 
          provider: "ollama", 
          model: model, 
          usedFallback: false 
        };
      }
    } catch (error) {
      return {
        content: "",
        provider: "ollama",
        model: model,
        usedFallback: false,
        error: error instanceof Error ? error.message : "Ollama 發生未知錯誤",
      };
    }
  },
};

export { fetchModels, getBaseUrl, setBaseUrl };
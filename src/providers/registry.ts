import type { AIProvider } from "./types";
import { chatgptProvider } from "./chatgptProvider";
import { claudeProvider } from "./claudeProvider";
import { geminiProvider } from "./geminiProvider";
import { ollamaProvider } from "./ollamaProvider";
import { lmstudioProvider } from "./lmstudioProvider";
import { nvidiaProvider } from "./nvidiaProvider";
import { createUnsupportedProvider } from "./unsupportedProvider";

// 已支援：ChatGPT, Claude, Gemini, Ollama, LM Studio, NVIDIA Nemotron
// 未實作（僅佔位）：Grok, Perplexity, Copilot
// 新增 Provider：建立 xxxProvider.ts 實作 AIProvider 介面，再於此註冊。
export const providerRegistry: Record<string, AIProvider> = {
  chatgpt: chatgptProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
  ollama: ollamaProvider,
  lmstudio: lmstudioProvider,
  nvidia: nvidiaProvider,
  grok: createUnsupportedProvider("grok", "Grok"),
  perplexity: createUnsupportedProvider("perplexity", "Perplexity"),
  copilot: createUnsupportedProvider("copilot", "Microsoft Copilot"),
};

export function getProvider(id: string): AIProvider | undefined {
  return providerRegistry[id];
}

export function listProviders(): AIProvider[] {
  return Object.values(providerRegistry);
}

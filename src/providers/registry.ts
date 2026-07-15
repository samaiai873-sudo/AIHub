import type { AIProvider } from "./types";
import { chatgptProvider } from "./chatgptProvider";
import { claudeProvider } from "./claudeProvider";
import { geminiProvider } from "./geminiProvider";
import { ollamaProvider } from "./ollamaProvider";
import { lmstudioProvider } from "./lmstudioProvider";
import { createUnsupportedProvider } from "./unsupportedProvider";

// 之後要支援 LM Studio / grok / perplexity / copilot 等，
// 只要新增一個 xxxProvider.ts 實作 AIProvider 介面，並把下面對應的
// createUnsupportedProvider(...) 換成真正的實作即可。
export const providerRegistry: Record<string, AIProvider> = {
  chatgpt: chatgptProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
  ollama: ollamaProvider,
  lmstudio: lmstudioProvider,
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

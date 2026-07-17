import type { AIProvider } from "./types";
import { chatgptProvider } from "./chatgptProvider";
import { claudeProvider } from "./claudeProvider";
import { geminiProvider } from "./geminiProvider";
import { grokProvider } from "./grokProvider";
import { ollamaProvider } from "./ollamaProvider";
import { lmstudioProvider } from "./lmstudioProvider";
import { nvidiaProvider } from "./nvidiaProvider";

// 已支援：ChatGPT, Claude, Gemini, Grok, Ollama, LM Studio, NVIDIA Nemotron
// 新增 Provider：建立 xxxProvider.ts 實作 AIProvider 介面，再於此註冊。
export const providerRegistry: Record<string, AIProvider> = {
  chatgpt: chatgptProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
  grok: grokProvider,
  ollama: ollamaProvider,
  lmstudio: lmstudioProvider,
  nvidia: nvidiaProvider,
};

export function getProvider(id: string): AIProvider | undefined {
  return providerRegistry[id];
}

export function listProviders(): AIProvider[] {
  return Object.values(providerRegistry);
}

import type { Platform } from "./platforms";

// 各平台的預設模型（UI 層 model id）
export const DEFAULT_MODELS: Record<Platform, string> = {
  chatgpt: "gpt-5.6-sol",
  claude: "sonnet-5",
  gemini: "gemini-flash-latest",
  grok: "grok-4.5",
  perplexity: "sonar-pro",
  copilot: "copilot",
  ollama: "llama3.1",
  lmstudio: "local-model",
  nvidia: "nemotron-3-ultra",
};

// 全域預設模型（當無法決定時使用）
export const GLOBAL_DEFAULT_MODEL = "gpt-5.6-sol";

// UI 層 model id 列表（用於驗證與下拉選單）
export const SUPPORTED_MODELS: Record<Platform, readonly string[]> = {
  chatgpt: ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  claude: ["sonnet-5", "opus-4", "haiku-4", "sonnet-3.5", "haiku-3.5", "opus-3"],
  gemini: [
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-3.5-flash",
    "gemini-3.1-pro",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ],
  grok: ["grok-4.5", "grok-4"],
  perplexity: ["sonar-pro", "sonar-reasoning-pro", "sonar-deep-research", "sonar"],
  copilot: ["copilot"],
  ollama: ["llama3.1", "llama3.2", "qwen2.5", "mistral", "codellama"],
  lmstudio: ["local-model"],
  nvidia: ["nemotron-3-ultra", "nemotron-4-340b", "nemotron-3-8b"],
} as const;

// 取得平台的預設模型
export function getDefaultModel(platform: Platform): string {
  return DEFAULT_MODELS[platform];
}

// 驗證某平台的模型是否有效
export function isValidModelForPlatform(
  platform: Platform,
  model: string
): boolean {
  const models = SUPPORTED_MODELS[platform];
  return models ? models.includes(model as never) : false;
}
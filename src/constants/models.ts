import type { Platform } from "./platforms";

// 各平台的預設模型（UI 層 model id）
export const DEFAULT_MODELS: Record<Platform, string> = {
  chatgpt: "gpt-4o",
  claude: "sonnet-3.5",
  gemini: "gemini-1.5-pro",
  grok: "grok-4",
  perplexity: "sonar",
  copilot: "copilot",
};

// 全域預設模型（當無法決定時使用）
export const GLOBAL_DEFAULT_MODEL = "gpt-4o";

// UI 層 model id 列表（用於驗證與下拉選單）
export const SUPPORTED_MODELS = {
  chatgpt: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  claude: ["sonnet-3.5", "haiku-3.5", "opus-3"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
  grok: ["grok-4"],
  perplexity: ["sonar"],
  copilot: ["copilot"],
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

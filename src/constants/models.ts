import type { Platform } from "./platforms";
import { isCustomPlatformId } from "./platforms";

// 各平台的預設模型（UI 層 model id）
export const DEFAULT_MODELS: Record<Platform, string> = {
  chatgpt: "gpt-5.6-sol",
  claude: "sonnet-5",
  gemini: "gemini-flash-latest",
  grok: "grok-4.5",
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
  ollama: ["llama3.1", "llama3.2", "qwen2.5", "mistral", "codellama"],
  lmstudio: ["local-model"],
  nvidia: ["nemotron-3-ultra", "nemotron-4-340b", "nemotron-3-8b"],
} as const;

// 取得平台的預設模型
// 自訂模型 platform id ("custom:<id>") 由 caller 透過 customModel.modelId 指定，
//此處回空字串代表「無內建預設」，呼叫端應已傳入 model。
export function getDefaultModel(platform: Platform | string): string {
  if (isCustomPlatformId(platform)) return "";
  return DEFAULT_MODELS[platform as Platform] ?? GLOBAL_DEFAULT_MODEL;
}

// 驗證某平台的模型是否有效
export function isValidModelForPlatform(
  platform: Platform | string,
  model: string
): boolean {
  if (isCustomPlatformId(platform)) {
    // 自訂模型：任何非空 modelId 視為有效
    return Boolean(model);
  }
  const models = SUPPORTED_MODELS[platform as Platform];
  return models ? models.includes(model as never) : false;
}
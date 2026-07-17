// Platform 型別定義 - 確保類型安全
export type Platform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "grok"
  | "ollama"
  | "lmstudio"
  | "nvidia";

// 預設平台
export const DEFAULT_PLATFORM: Platform = "chatgpt";

// 所有支援的平台列表
export const SUPPORTED_PLATFORMS: Platform[] = [
  "chatgpt",
  "claude",
  "gemini",
  "grok",
  "ollama",
  "lmstudio",
  "nvidia",
];

// 驗證字串是否為有效的 Platform
export function isPlatform(value: unknown): value is Platform {
  return (
    typeof value === "string" &&
    SUPPORTED_PLATFORMS.includes(value as Platform)
  );
}

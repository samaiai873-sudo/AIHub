// Platform 型別定義 - 確保類型安全
export type Platform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "grok"
  | "local";

// 預設平台
export const DEFAULT_PLATFORM: Platform = "chatgpt";

// 所有支援的平台列表
export const SUPPORTED_PLATFORMS: Platform[] = [
  "chatgpt",
  "claude",
  "gemini",
  "grok",
  "local",
];

// 驗證字串是否為有效的 Platform
export function isPlatform(value: unknown): value is Platform {
  return (
    typeof value === "string" &&
    SUPPORTED_PLATFORMS.includes(value as Platform)
  );
}

// 自訂模型 platform id 前綴
export const CUSTOM_PLATFORM_PREFIX = "custom:";

// 判斷是否為自訂模型 platform id（格式 "custom:<id>"）
export function isCustomPlatformId(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.startsWith(CUSTOM_PLATFORM_PREFIX) &&
    value.length > CUSTOM_PLATFORM_PREFIX.length
  );
}

// 從 custom platform id 抽出自訂模型的 id（"custom:abc" → "abc"）
export function getCustomIdFromPlatformId(
  platformId: string
): string | null {
  if (!isCustomPlatformId(platformId)) return null;
  return platformId.slice(CUSTOM_PLATFORM_PREFIX.length);
}

/**
 * 廣義 platform 驗證：接受內建 Platform 或自訂模型 id（"custom:<id>"）。
 * 回傳後保證字串可安全存入 Conversation.platform 並被 Provider 層處理。
 */
export function isValidPlatformId(value: unknown): boolean {
  return isPlatform(value) || isCustomPlatformId(value);
}

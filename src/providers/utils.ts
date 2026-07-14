import type { AssistantReply } from "./types";

export function normalizePrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ");
}

type FallbackParams = {
  platform: string;
  model: string;
  prompt: string;
  error?: string;
};

/** 當 Provider 尚未支援 / 沒有 API Key / 請求失敗時，統一產生一則可讀的假訊息 */
export function createFallbackReply({
  platform,
  model,
  prompt,
  error,
}: FallbackParams): AssistantReply {
  const normalizedPrompt = normalizePrompt(prompt);
  const preview =
    normalizedPrompt.length > 80
      ? `${normalizedPrompt.slice(0, 80)}…`
      : normalizedPrompt;

  return {
    content: error
      ? `⚠️ ${error}\n\n請前往 Settings 中為 ${platform} 輸入有效的 API Key。`
      : `⚠️ ${platform.toUpperCase()} 尚未設定可用的 API Key，請先在 Settings 中輸入。\n\n${preview}`,
    provider: platform,
    model,
    usedFallback: true,
    error,
  };
}

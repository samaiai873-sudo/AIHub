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

  // 依 error 類型給不同提示
  // 1. 沒有 error → 單純缺 API Key（舊行為）
  // 2. error 含「Failed to fetch」或 TypeError 訊息 → 網路/CORS 問題，
  //    不是 API Key 問題，引導用戶檢查 endpoint / CORS / 網路
  // 3. 其他 error（HTTP 4xx/5xx）→ 顯示原 error，不誤導為 API Key 問題
  let content: string;
  if (!error) {
    content = `⚠️ ${platform.toUpperCase()} 尚未設定可用的 API Key，請先在 Settings 中輸入。\n\n${preview}`;
  } else if (/Failed to fetch|NetworkError|Load failed/i.test(error)) {
    content =
      `⚠️ ${error}\n\n` +
      `無法連線到 ${platform}。可能原因：\n` +
      `• Endpoint 無效或伺服器未啟動\n` +
      `• 瀏覽器 CORS 擋下請求（外部 API 需允許跨來源）\n` +
      `• Mixed Content（https 頁面打 http 端點會被擋）\n\n` +
      `請至 Settings 檢查 endpoint 設定。`;
  } else {
    content = `⚠️ ${error}\n\n請至 Settings 檢查 ${platform} 的設定（endpoint / API Key / 模型 ID）。`;
  }

  return {
    content,
    provider: platform,
    model,
    usedFallback: true,
    error,
  };
}

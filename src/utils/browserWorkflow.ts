import { aiPlatforms } from "../data/aiPlatforms";

/** 依 platform id 找出對應的官方網站網址 */
export function getPlatformUrl(platformId: string): string | null {
  return aiPlatforms.find((platform) => platform.id === platformId)?.url ?? null;
}

/** 把 Prompt 複製到剪貼簿，回傳是否成功（給 UI 顯示 toast 用） */
export async function copyPromptToClipboard(prompt: string): Promise<boolean> {
  const text = prompt.trim();

  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 部分瀏覽器/情境（例如非 HTTPS）會擋掉 clipboard API
    return false;
  }
}

/** 開啟對應平台的官方網站分頁，回傳是否成功找到網址 */
export function openPlatformInBrowser(platformId: string): boolean {
  const url = getPlatformUrl(platformId);

  if (!url) return false;

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export type OpenInBrowserResult = {
  copied: boolean;
  opened: boolean;
};

/**
 * 完整的 Browser Workflow：複製 Prompt → 開啟官方網站。
 * 對照 workspace-concept.md：官方網站是輔助功能，這是降低切換成本的核心動線。
 */
export async function runOpenInBrowserWorkflow(
  platformId: string,
  prompt: string
): Promise<OpenInBrowserResult> {
  const copied = await copyPromptToClipboard(prompt);
  const opened = openPlatformInBrowser(platformId);

  return { copied, opened };
}

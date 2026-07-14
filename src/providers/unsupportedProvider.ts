import type { AIProvider } from "./types";
import { createFallbackReply } from "./utils";

/**
 * 尚未實作 API 串接的平台先用這個佔位 Provider，
 * 之後要新增真正的串接時，只要新增一個檔案實作 AIProvider 介面，
 * 並在 providers/registry.ts 換掉對應的 entry 即可，不用動到其他程式碼。
 */
export function createUnsupportedProvider(id: string, name: string): AIProvider {
  return {
    id,
    name,
    supportsStreaming: false,
    defaultModel: "",
    async sendMessage({ model, prompt }) {
      return createFallbackReply({
        platform: id,
        model,
        prompt,
        error: `${name} 尚未支援 API 串接，目前僅能透過 Open in Browser 使用。`,
      });
    },
  };
}

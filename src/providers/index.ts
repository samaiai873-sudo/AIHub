import { getProvider } from "./registry";
import { createFallbackReply } from "./utils";
import type { AssistantReply } from "./types";

export type { AIProvider, AssistantReply, SendMessageParams } from "./types";
export { providerRegistry, getProvider, listProviders } from "./registry";

type GenerateAssistantReplyParams = {
  platform: string;
  model: string;
  prompt: string;
  apiKey?: string;
  onChunk?: (chunk: string) => void;
};

/**
 * 對外統一入口：不管平台是誰，呼叫方式都一樣。
 * 內部會找到對應的 Provider 並呼叫它的 sendMessage()。
 */
export async function generateAssistantReply({
  platform,
  model,
  prompt,
  apiKey,
  onChunk,
}: GenerateAssistantReplyParams): Promise<AssistantReply> {
  const normalizedPlatform = platform || "chatgpt";
  const provider = getProvider(normalizedPlatform);

  if (!provider) {
    return createFallbackReply({
      platform: normalizedPlatform,
      model,
      prompt,
      error: "目前尚未支援此 Provider。",
    });
  }

  return provider.sendMessage({
    model: model || provider.defaultModel,
    prompt,
    apiKey,
    onChunk,
  });
}

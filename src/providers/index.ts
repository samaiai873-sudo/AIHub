import { getProvider } from "./registry";
import { createCustomProvider } from "./customProvider";
import { createFallbackReply } from "./utils";
import type { AssistantReply } from "./types";
import type { CustomModel } from "../hooks/useAppSettings";

export type { AIProvider, AssistantReply, SendMessageParams } from "./types";
export { providerRegistry, getProvider, listProviders } from "./registry";

type GenerateAssistantReplyParams = {
  platform: string;
  model: string;
  prompt: string;
  apiKey?: string;
  onChunk?: (chunk: string) => void;
  /** 自訂模型列表（從 settings 傳入，用於 `custom:` platform） */
  customModels?: CustomModel[];
  /** 自訂模型的 API Key（key = customModel.id） */
  customApiKeys?: Record<string, string>;
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
  customModels = [],
  customApiKeys = {},
}: GenerateAssistantReplyParams): Promise<AssistantReply> {
  const normalizedPlatform = platform || "chatgpt";

  // 處理自訂模型（platform 格式 "custom:<id>"）
  if (normalizedPlatform.startsWith("custom:")) {
    const customId = normalizedPlatform.slice("custom:".length);
    const customModel = customModels.find((m) => m.id === customId);

    if (!customModel) {
      return createFallbackReply({
        platform: normalizedPlatform,
        model,
        prompt,
        error: "找不到此自訂模型，請至 Settings 確認設定。",
      });
    }

    const customApiKey = customModel.apiKey ?? customApiKeys[customId] ?? apiKey;

    const provider = createCustomProvider(
      customId,
      customModel.endpoint.replace(/\/$/, ""),
      customApiKey
    );

    return provider.sendMessage({
      model: model || customModel.modelId,
      prompt,
      apiKey: customApiKey,
      onChunk,
    });
  }

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

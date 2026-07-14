// 統一的 AI Provider 抽象介面
// 對照 docs/provider-design.md：統一 Provider 介面 sendMessage()

export type AssistantReply = {
  content: string;
  provider: string;
  model: string;
  usedFallback: boolean;
  error?: string;
};

export type SendMessageParams = {
  /** UI 層使用的 model id（例如 "sonnet-4"），Provider 內部會轉換成真正的 API model 字串 */
  model: string;
  prompt: string;
  apiKey?: string;
  /** Streaming 時每次收到新內容會呼叫，帶入目前累積的完整內容 */
  onChunk?: (accumulatedContent: string) => void;
};

export interface AIProvider {
  /** 對應 constants/platforms.ts 的 Platform id */
  id: string;
  /** 顯示用名稱 */
  name: string;
  /** 是否支援 streaming 回應 */
  supportsStreaming: boolean;
  /** 找不到對應 model 時的預設 model id（UI 層 id） */
  defaultModel: string;
  /** 統一的訊息發送介面 */
  sendMessage(params: SendMessageParams): Promise<AssistantReply>;
}

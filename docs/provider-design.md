# Provider Design

## 統一 Provider 介面

所有 AI 提供商實作統一的 `AIProvider` 介面，透過 `registry.ts` 統一註冊管理：

```typescript
interface AIProvider {
  id: string;
  name: string;
  supportsStreaming: boolean;
  defaultModel: string;
  sendMessage(params: SendMessageParams): Promise<AssistantReply>;
}
```

## 已實作的 Provider

| Provider | 檔案 | 串流方式 | 端點 |
|----------|------|----------|------|
| ChatGPT | `chatgptProvider.ts` | SSE | `api.openai.com/v1/chat/completions` |
| Claude | `claudeProvider.ts` | SSE | `api.anthropic.com/v1/messages` |
| Gemini | `geminiProvider.ts` | SSE (`alt=sse`) | `generativelanguage.googleapis.com/v1beta` |
| Grok | `grokProvider.ts` | SSE | `api.x.ai/v1/chat/completions` |
| Ollama | `ollamaProvider.ts` | SSE | `localhost:11434` |
| LM Studio | `lmstudioProvider.ts` | SSE | `localhost:1234/v1` |
| NVIDIA | `nvidiaProvider.ts` | SSE | `integrate.api.nvidia.com/v1` |
| Custom | `customProvider.ts` | SSE | 使用者自訂端點 (OpenAI 相容) |

## Custom Provider

自訂模型透過 `customProvider.ts` 實作，支援 OpenAI 相容 API 端點：
- 用戶從 Settings → 自訂模型新增（名稱、端點、模型 ID、API Key）
- platform id 格式：`custom:<id>`
- `generateAssistantReply` 偵測 `custom:` 前綴後動態建立 provider
- 自訂模型顯示於左側 AI Agents 列表，點擊即建立對話

## 新增 Provider 步驟

1. 在 `src/providers/` 建立 `xxxProvider.ts`
2. 實作 `AIProvider` 介面
3. 在 `registry.ts` 註冊
4. 在 `constants/models.ts` 新增模型列表
5. 在 `data/aiPlatforms.ts` 新增平台資訊

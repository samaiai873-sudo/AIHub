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
| Local | `localProvider.ts` | SSE | OpenAI 相容端點（預設 `http://localhost:1234/v1`，可切 `http://localhost:11434/v1`） |
| Custom | `customProvider.ts` | SSE | 使用者自訂端點 (OpenAI 相容) |

> **Local Provider 說明**：Ollama 與 LM Studio 兩者皆實作 OpenAI 相容 API（`/v1/chat/completions`、`/v1/models`），因此合併為單一 `local` Provider。使用者於 Settings 選擇對應 Base URL（或點快速 preset 按鈕切換）即可。UI 模型列表為靜態預設，可於 Provider 內呼叫 `fetchLocalModels()` 動態從 `/v1/models` 抓取。

## Native Messaging Host

Native Messaging Host 的安裝不會由 `npm install` 自動執行，必須手動提供 extension ID：

```bash
python extension/native-host/install.py <extension_id>
```

`<extension_id>` 需為 Chrome 擴充功能的 32 位小寫 ID，且會寫入 manifest 的 `allowed_origins`。

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

# Architecture

## 核心技術

- React 19 + TypeScript (strict) + Vite 8
- React Context API + Custom Hooks
- Web Crypto API (AES-GCM 256-bit, 瀏覽器綁定, 無主密碼)
- Vitest + happy-dom + @testing-library/react
- GitHub Actions CI/CD (lint → typecheck → build → test)

## 分層架構

```
UI Components → Context → Hooks → Providers → External APIs
                                     ↓
                              SecureStorage (AES-GCM)
```

### UI Components
- `Sidebar` — 導航 + AI Agents 列表（含自訂模型）
- `ConversationWorkspace` — 對話主畫面
- `Composer` — 輸入區
- `MessageList` / `MessageBubble` — 訊息渲染
- `CompareView` — 多模型並排對比
- `CustomModels` — 自訂模型管理

### Context
- `ConversationContext` — 對話 CRUD、搜尋、分支
- `AgentContext` — AI 代理人管理

### Hooks
- `useConversations` — 對話 CRUD、重新生成 (regenerateWith)
- `useApiKeys` — API 金鑰加密儲存
- `useSecureLocalStorage` — 異步加密儲存
- `useAppSettings` — 應用設定 + 自訂模型 + 路由規則

### Providers (5 個 + Custom)
- `chatgptProvider` / `claudeProvider` / `geminiProvider` / `grokProvider`
- `localProvider` — 統一本機推理（Ollama / LM Studio，OpenAI 相容 API）
- `customProvider` — OpenAI 相容 API，動態建立

### Utilities
- `secureStorage` — AES-GCM 加密/解密
- `conversationExport` — Markdown/JSON 匯出
- `promptImportExport` — Prompt 匯入/匯出

### Constants
- `platforms` — Platform 型別 + 支援列表 (7 個)
- `models` — 預設模型 + 支援模型列表
- `routing` — 9 條預設路由規則

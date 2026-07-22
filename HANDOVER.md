# AIHub 專案交接文件（v1.1.0／Sprint 16 完成）

---

## 1. 專案現狀總覽

| 項目 | 狀態 | 備註 |
|------|------|------|
| **版本** | v1.1.0 | Sprint 16 完成 ✅ |
| **核心功能** | 對話管理、Prompt Library、AI Agent 管理、全域搜尋、專案分類、匯出、比較與路由 | 全部可用 |
| **AI Provider** | ChatGPT、Claude、Gemini、Grok、Local 與自訂模型 | 全部支援 Streaming |
| **架構** | React 19 + TypeScript 6 + Vite 8 + Context API + LocalStorage | 乾淨、可擴展 |
| **最新功能** | 最多 4 個模型同時回答、Local Provider、自訂模型編輯 | 已完成 |
| **下一階段** | v1.2+：效能、離線/PWA、匯入匯出、參數調整與 i18n | 見 `docs/roadmap.md` |

---

## 2. 關鍵架構決策

### Provider 抽象層（`src/providers/`）
```
types.ts             → AIProvider 介面、SendMessageParams、AssistantReply
registry.ts          → Provider Registry
index.ts             → 統一入口 generateAssistantReply()
chatgptProvider.ts   → OpenAI Chat Completions（SSE + Vite Proxy）
claudeProvider.ts    → Anthropic Messages（SSE）
geminiProvider.ts    → Google Generative Language（SSE）
grokProvider.ts      → xAI Chat Completions（SSE）
localProvider.ts     → Ollama / LM Studio 的統一 OpenAI 相容 Provider
customProvider.ts    → 使用者設定的 OpenAI 相容端點
utils.ts             → 統一錯誤回退與 CORS／網路錯誤提示
```
**新增 Provider 只需：**
1. 建立 `xxxProvider.ts` 實作 `AIProvider` 介面
2. 在 `registry.ts` 註冊
3. `constants/models.ts` 加入 UI Model ID

### 資料流
```
User Input (Composer／ReplyTargetBar)
    ↓
useConversations.addMessage() → LocalStorage 更新
    ↓
ConversationWorkspace.handleSend()
    ↓
依 Routing Rule 或 Reply Targets 決定一個或多個目標模型
    ↓
generateAssistantReply({ platform, model, prompt, apiKey, onChunk })
    ↓
Provider.sendMessage() → Streaming → onChunk 更新 UI
    ↓
Assistant Reply 寫入 LocalStorage
```

### 狀態管理
- **Conversation**：`useConversations` Hook + `ConversationContext`（LocalStorage 持久化）
- **Prompt/Agent**：`usePrompts` / `useAgents` Hook + Context
- **Settings/API Keys**：`useAppSettings` / `useApiKeys` Hook

---

## 3. 開發環境啟動

```bash
cd /Users/ai-pc/Desktop/AIHub
npm install
npm run dev          # 開發伺服器 (localhost:5173)
npm run build        # Production Build
npm run lint         # ESLint 檢查
```

**必要設定**：瀏覽器開啟後，Settings 頁面輸入三組 API Key（ChatGPT、Claude、Gemini）即可開始真實對話。

---

## 4. v1.1 後續工作建議

目前 Sprint 9 的 Reply with...、單一 Thread 多模型與 Conversation Routing，及 Sprint 16 的最多四模型並行回覆均已完成。下一輪工作請以 `docs/roadmap.md` 為準：

1. **效能與可靠性**：大量對話的虛擬化渲染、測試覆蓋與離線快取。
2. **使用體驗**：PWA、Prompt 版本控制、模型參數調整與 i18n。
3. **資料可攜性**：補強 Markdown/PDF 匯出與對話匯入。
4. **擴充功能與 MCP**：網頁 Context 注入、Popup 模式、MCP Server 管理與工具結果快取。

---

## 5. 程式碼風格與規範

| 規範 | 標準 |
|------|------|
| Component | PascalCase、函式元件、Inline Style |
| Hook | `useXxx` 命名、回傳物件解構 |
| Type | PascalCase、嚴格模式、避免 `any` |
| 檔案 | 資料檔 camelCase、Component PascalCase |
| Commit | 小步提交、Build 通過才 Commit |
| Provider 新增 | 實作 `AIProvider` → 註冊 `registry.ts` → 更新 `models.ts` |

---

## 6. 已知技術債與注意事項

| 項目 | 狀態 | 備註 |
|------|------|------|
| API Key 明文存 LocalStorage | ✅ 已改善 | 使用 Web Crypto AES-GCM 加密儲存 |
| 測試覆蓋不足 | ⚠️ 待補 | 已有 Vitest 基礎測試，仍需擴充元件與 Provider 測試 |
| CI/CD | ✅ 已有 | GitHub Actions 執行 lint、typecheck、build、test |
| 多模態輸入與檔案上傳 | 📋 規劃中 | 可配合未來知識庫／RAG 功能設計 |
| Provider 擴充 | 📋 可持續擴充 | Grok、Local 與自訂 OpenAI 相容端點已支援；新增平台依 `AIProvider` 介面實作 |

---

## 7. 常用指令速查

```bash
# 開發
npm run dev

# 檢查
npm run lint
npx tsc --noEmit

# 建置
npm run build

# 新增 Provider 模板
cp src/providers/geminiProvider.ts src/providers/xxxProvider.ts
# 修改實作後，編輯 registry.ts 註冊
```

---

## 8. 關鍵檔案地圖

```
/src
├── App.tsx                      # 主入口、頁面路由、Global Search 綁定
├── main.tsx                     # React 18 createRoot
├── vite.config.ts               # Vite 設定 + /api/openai Proxy
├── components/
│   ├── ConversationWorkspace.tsx  # 核心工作區、API 呼叫邏輯
│   ├── ConversationSidebar.tsx    # 對話列表、搜尋、Context Menu、專案分組
│   ├── Composer.tsx               # 多行輸入區；Shift+Enter 換行、Enter 發送
│   ├── MessageList.tsx / MessageBubble.tsx
│   ├── ReplyTargetBar.tsx         # 最多 4 個模型並行回答目標
│   ├── GlobalSearch.tsx           # Cmd/Ctrl+K 全域搜尋
│   ├── ProjectManager.tsx         # 專案 CRUD
│   ├── PromptLibrary.tsx / PromptForm.tsx
│   └── AIAgentManager.tsx
├── context/
│   ├── ConversationContext.tsx
│   └── AgentContext.tsx
├── hooks/
│   ├── useConversations.ts        # 對話 CRUD、搜尋、專案、平台切換
│   ├── useGlobalSearch.ts / useConversationSearch.ts
│   ├── usePrompts.ts / useAgents.ts
│   ├── useAppSettings.ts / useApiKeys.ts
│   └── useLocalStorage.ts
├── providers/                     # Provider 抽象層（見上方架構）
├── constants/
│   ├── platforms.ts               # Platform 型別、驗證
│   ├── models.ts                  # UI Model ID、預設值、驗證
│   └── projects.ts
├── types/
│   ├── conversation.ts            # Conversation、Message
│   └── prompt.ts
├── utils/
│   └── conversationExport.ts      # Markdown/JSON 匯出
└── data/
    └── aiPlatforms.ts             # 平台定義（名稱、圖示、官網、模型清單）
```

---

## 9. 交接人聯繫

- 專案位置：`/Users/ai-pc/Desktop/AIHub`
- Git Remote：`origin` (GitHub)
- 主分支：`main`
- 文件：`docs/roadmap.md`、`docs/sprint-history.md`、`docs/changelog.md`、`AIHub_v0.7_Project_Report.md`、`HANDOVER.md`

---

**目前 AIHub 已具備多模型協作、並行回覆與本機模型整合能力；後續請以效能、資料可攜性與擴充性為優先。** 🚀

# AIHub 專案交接文件（v0.8 Sprint 8 完成，準備 Sprint 9）

---

## 1. 專案現狀總覽

| 項目 | 狀態 | 備註 |
|------|------|------|
| **版本** | v0.8.0 | Sprint 8 完成 ✅ |
| **核心功能** | 對話管理、Prompt Library、AI Agent 管理、全域搜尋、專案分類、匯出 | 全部可用 |
| **AI Provider** | ChatGPT、Claude、Gemini 三大 Provider 真實 API 串接完成 | 全部支援 Streaming |
| **架構** | React 19 + TypeScript 6 + Vite 8 + Context API + LocalStorage | 乾淨、可擴展 |
| **下一階段** | Sprint 9：Reply with...、Multi-AI Conversation、Conversation Routing | 待開發 |

---

## 2. 關鍵架構決策

### Provider 抽象層（`src/providers/`）
```
types.ts          → AIProvider 介面、SendMessageParams、AssistantReply
registry.ts       → Provider Registry（單例模式，輕鬆新增 Provider）
index.ts          → 統一入口 generateAssistantReply()
chatgptProvider.ts   → OpenAI Chat Completions (SSE Streaming + Vite Proxy)
claudeProvider.ts    → Anthropic Messages (SSE Streaming + dangerous-direct-browser-access)
geminiProvider.ts    → Google Generative Language (JSON Lines Streaming + streamGenerateContent)
unsupportedProvider.ts → 佔位 Provider
utils.ts          → createFallbackReply() 統一錯誤回退
```
**新增 Provider 只需：**
1. 建立 `xxxProvider.ts` 實作 `AIProvider` 介面
2. 在 `registry.ts` 註冊
3. `constants/models.ts` 加入 UI Model ID

### 資料流
```
User Input (Composer)
    ↓
useConversations.addMessage() → LocalStorage 更新
    ↓
ConversationWorkspace.handleSend()
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
cd /Users/ai-pc/Desktop/aihub
npm install
npm run dev          # 開發伺服器 (localhost:5173)
npm run build        # Production Build
npm run lint         # ESLint 檢查
```

**必要設定**：瀏覽器開啟後，Settings 頁面輸入三組 API Key（ChatGPT、Claude、Gemini）即可開始真實對話。

---

## 4. Sprint 9 開發指南（優先序已定）

### P0: Reply with...（同一輪對話一鍵換模型重答）
**核心價值**：使用者看到不滿意的回覆，點選「Reply with Claude」即可保留上下文、換模型重新生成。

**實作切入點**：
1. `Message` 型別新增 `regenerating?: boolean`、`originalModel?: string` 欄位
2. `useConversations` 新增 `regenerateWith(conversationId, messageIndex, newPlatform, newModel)`
3. `MessageBubble` 右上角加入選單：`Reply with ChatGPT` / `Reply with Claude` / `Reply with Gemini`
4. 邏輯：截取 `messages[0...messageIndex]` 為新上下文，呼叫新 Provider，結果取代原 assistant message

**預估工時**：4-6 小時

---

### P1: Multi-AI Conversation（單一 Thread 串接多模型）
**核心價值**：一個對話中，User 問程式用 GPT-4o，問寫作用 Claude，問搜尋用 Gemini。

**實作切入點**：
1. `Message` 已有 `platform` / `model` 欄位（現行每則訊息獨立記錄）
2. `Composer` 右側新增模型下拉選單（預設跟隨 Conversation 當前模型，可單輪切換）
3. `handleSend` 讀取 Composer 選擇的目標模型，而非 Conversation 預設模型
4. UI：訊息氣泡顯示模型標籤（已有），Composer 顯示當前目標模型

**預估工時**：3-4 小時

---

### P2: Conversation Routing（依關鍵字/指令自動導向模型）
**核心價值**：`@claude 幫我寫文案`、`/code python快速排序`、`@gemini 搜尋最新新聞` 自動導向對應模型。

**實作切入點**：
1. `constants/routing.ts` 定義 `RoutingRule = { pattern: RegExp, platform: Platform, model: string, prefix?: string }`
2. `useAppSettings` 新增 `routingRules` 設定（預設內建常用規則）
3. `ConversationWorkspace.handleSend` 發送前先跑 `matchRoutingRule(prompt)`，命中則覆寫目標平台/模型
4. Settings 頁面加入 Routing Rules 編輯器

**預估工時**：4-5 小時

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
| API Key 明文存 LocalStorage | ⚠️ 待加密 | 建議用 Web Crypto API (AES-GCM) + 機器指紋衍生金鑰 |
| 無測試覆蓋 | ⚠️ 待補 | 建議引入 Vitest + React Testing Library |
| 無 CI/CD | ⚠️ 待補 | GitHub Actions: lint → typecheck → build → test |
| 僅支援文字對話 | 📋 規劃中 | 圖片/檔案上傳、Function Calling 預留給 v1.0 MCP |
| Grok/Perplexity/Copilot 為佔位 | 📋 規劃中 | 同樣實作 `AIProvider` 介面即可啟用 |

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
│   ├── Composer.tsx               # 輸入區、Send/Open in Browser
│   ├── MessageList.tsx / MessageBubble.tsx
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
│   ├── browserWorkflow.ts         # 複製 Prompt + 開啟官網
│   └── conversationExport.ts      # Markdown/JSON 匯出
└── data/
    └── aiPlatforms.ts             # 平台定義（名稱、圖示、官網、模型清單）
```

---

## 9. 交接人聯繫

- 專案位置：`/Users/ai-pc/Desktop/aihub`
- Git Remote：`origin` (GitHub)
- 主分支：`main`
- 文件：`docs/roadmap.md`、`docs/sprint-history.md`、`docs/changelog.md`、`AIHub_v0.7_Project_Report.md`、`HANDOVER.md`

---

**祝開發順利！Sprint 9 的三大功能將讓 AIHub 從「多模型切換工具」進化為「真正的多模型協作工作台」。** 🚀
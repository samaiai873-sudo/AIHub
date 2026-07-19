# Sprint History

## Sprint 14（完成 ✅） - v1.0.2

### Bug 修復
- **regenerateWith 加密讀取 bug**: 直接讀 `localStorage` 解析加密資料 → 改用 `secureStorage.getItem` 解密，修復「Reply with...」功能
- **PromptLibrary 無效 model id**: `gpt-5` → `gpt-5.6-sol`
- **PromptCard 編輯模式過時快照**: 進入編輯模式時同步 `content`，不再用掛載時的舊值
- **ConversationWorkspace 佈局問題**: `MessageList` 和 `Composer` 原本被放在中間面板 `div` 外面，變成跟 sidebar 平級的 flex item，修正為正確包在容器內
- **Gemini 串流回應解析**: `streamGenerateContent` 端點加入 `alt=sse` 參數確保回傳 SSE 格式，解析邏輯改為正確處理 `data:` 前綴

### 新功能
- **Grok Provider**: 新增 `grokProvider.ts`，串接 xAI API (`api.x.ai/v1/chat/completions`)，支援 SSE 串流，模型 `grok-4.5`（預設）/ `grok-4`
- **自訂模型完整整合**: 
  - 新增 `customProvider.ts`（OpenAI 相容 API 端點）
  - `Sidebar` 左側 AI Agents 列表顯示自訂模型
  - `generateAssistantReply` 支援 `custom:<id>` platform 前綴
  - `ConversationWorkspace` 和 `useConversations` 傳入 `customModels`
- **CustomModels.tsx**: 新增 API Key 欄位（選用）
- Settings 頁面新增 xAI / Grok API Key 輸入欄

### 刪除
- **Perplexity / Copilot 平台**: 從 `platforms.ts`、`models.ts`、`aiPlatforms.ts`、`registry.ts` 全部移除
- **`unsupportedProvider.ts`**: 不再需要
- **死碼檔案 6 個**: `ImportExportBar.tsx`、`Header.tsx`、`AppHeader.tsx`、`data/apps.ts`、`utils/browserWorkflow.ts`、`vite.config.example.ts`

### 一致性更新
- 路由規則全部更新至最新模型（`sonnet-3.5`→`sonnet-5`、`gpt-4o`→`gpt-5.6-sol`、`gemini-pro-latest`→`gemini-flash-latest`）
- Gemini `API_MODEL_MAP` 移除孤立 `gemini-2.5-flash-lite` entry
- `types.ts`、`registry.ts` 過時註解修正
- README.md 重寫為 AIHub 專案說明
- 全平台模型更新至最新版本（GPT-5.6、Claude Sonnet 5、Gemini 3.5 Flash、Grok 4.5 等）

---

## Sprint 13（完成 ✅）- v1.0.1

### Bug Fixes
- **Gemini API model names updated**: `gemini-1.5-flash` → `gemini-3.5-flash`, `gemini-1.5-pro` → `gemini-2.5-pro`
- **Cross-platform model contamination fixed**: `normalizeConversation` validates `model` belongs to target platform
- **handleSend model validation**: Composer-passed model validated before API call
- **regenerateWith model validation**: "Reply with..." model now validated against platform

### New Features
- NVIDIA Nemotron provider (nemotron-3-ultra, nemotron-4-340b, nemotron-3-8b)
- Custom Models management in App Settings

---

## Sprint 12（完成 ✅） - v1.0.0

### Testing & CI/CD
- `package.json`：新增 `test`, `test:ui`, `test:coverage` scripts
- `vitest.config.ts`：React plugin, jsdom/happy-dom, globals, setup file, v8 coverage
- `tsconfig.app.json`：新增 `vitest/globals`, `node` types
- `src/test/setup.ts`：測試設定 (localStorage mock, crypto.subtle mock)
- `secureStorage.test.ts`：13 測試全部通過 (encrypt/decrypt/reEncryptAll/isAvailable)
- `.github/workflows/ci.yml`：GitHub Actions CI (lint → typecheck → build → test)

### Refactoring & Code Quality
- Context 拆分：`AgentContext.tsx` + `ConversationContext.tsx` → Provider + Context + Hook 檔案分離
- Import path 更新
- 完整驗證：`npm run build` ✅, `tsc --noEmit` ✅, `eslint src/` ✅, `npm run test` ✅

### Major Architecture Change: Remove Master Password
- **secureStorage.ts 重寫**：移除 PBKDF2/主密碼，改用 Web Crypto `generateKey` + AES-GCM
- 金鑰綁定瀏覽器/profile，換裝置自動失效
- **useSecureLocalStorage.ts**：移除密碼參數，簡化為直接加密
- **useApiKeys.ts**：移除 `reEncryptApiKeys`
- **FirstTimeSetup.tsx**：4 步驟密碼流程 → 單一歡迎頁
- **ResetAllData.tsx**：移除密碼驗證，直接確認輸入
- **ChangeMasterPassword.tsx**：**刪除**
- **App.tsx**：First-time 檢查改用 `aihub-first-time-setup` flag
- 刪除 `src/pages/Home.tsx` 與空 `src/pages/` 目錄

### Extension & MCP
- Extension MV3 完整建構：Side Panel, Context Menus, MCP Client (SSE + STDIO)
- Native Messaging Host (Python) for MCP STDIO
- MCP Tool Invocation Panel: JSON 參數編輯器、智慧結果渲染
- Extension 圖示生成 (16/32/48/128px PNG)

### Documentation & Deployment
- `docs/handoff.md`：完整交接文件
- `docs/privacy/policy.md` + `index.html`：隱私權政策
- GitHub Pages 部署就緒
- Chrome Web Store 發布套件

---

## Sprint 11（完成 ✅） - v0.9.8

### Settings & Encryption System
- `secureStorage.ts`：AES-GCM (256-bit) + PBKDF2 → **後來在 v1.0.0 改為 Web Crypto 隨機金鑰**
- `useSecureLocalStorage.ts`：非同步加密儲存 Hook
- `useApiKeys.ts`：遷移至 `useSecureLocalStorage`
- `FirstTimeSetup.tsx`：Modal 工作流（後簡化為歡迎頁）

---

## Sprint 10（完成 ✅） - v0.9.5

### Compare View (多模型並排對比)
- 新組件 `CompareView.tsx`
- 每模型獨立串流、`Pick Winner` 動作
- Loading pulse 動畫

---

## Sprint 9（完成 ✅） - v0.9.0

### Reply with... (換模型重答)
### Multi-AI Conversation (單一 Thread 多模型)
### Conversation Routing (關鍵字自動導向)
- 9 預設規則：`@claude`、`@gpt`、`@gemini`、`/code`、`/write`、`/search` 等

---

## Sprint 8（完成 ✅） - v0.8.0

- AI Provider 完整抽象
- API 串接：ChatGPT、Claude、Gemini
- Streaming 實作：SSE / JSON Lines
- Vite Dev Proxy 解決 CORS
- Model Map 校驗

---

## Sprint 7（完成 ✅） - v0.7.0

- Conversation CRUD、Context Menu、Favorite、Project、Export
- Conversation Search v2

---

## Sprint 7A

- Conversation CRUD
- Search planning
- Context menu planned

---

## 版本對照表

| 版本 | 日期 | 主要里程碑 |
|------|------|------------|
| 0.6.0 | 2026-07-12 | Conversation/Prompt/Agent 基礎 |
| 0.7.0 | 2026-07-13 | Sprint 7 完整功能 |
| 0.8.0 | 2026-07-14 | Sprint 8 Provider/Streaming |
| 0.9.0 | 2026-07-14 | Sprint 9 Reply/Routing/Multi-AI |
| 0.9.5 | 2026-07-15 | Sprint 10 Compare View |
| 0.9.8 | 2026-07-15 | Sprint 11 Settings/Encryption (舊架構) |
| 1.0.0 | 2026-07-15 | Sprint 12 Test/CI/CD + **移除主密碼** + Extension 完整 |
| 1.0.1 | 2026-07-16 | Sprint 13 Gemini 修正 + Nemotron + Custom Models |
| 1.0.2 | 2026-07-17 | Sprint 14 **Grok Provider** + **自訂模型整合** + Bug 修復 + 死碼清理 |
| 1.1.0 | 2026-07-18 | Sprint 15 **修復自訂模型 platform** + **合併 Ollama/LM Studio 為 Local** + **刪除 NVIDIA** + **CustomModels 修改按鈕** + Sprint 16 **多模型同時回答 (ReplyTargetBar)** |

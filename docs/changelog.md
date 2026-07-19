# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-07-18

### ✨ Added
- **CustomModels「修改」按鈕**: Settings 自訂模型列表新增「修改」按鈕，支援原地編輯自訂模型（名稱、端點、模型 ID、API Key）。編輯模式保留原 model id，不破壞既有 Conversation 引用。
- **Local Provider**: 新增 `localProvider.ts`，統一介面支援 Ollama 與 LM Studio（兩者皆實作 OpenAI 相容 API）。
- **Settings 本機服務端點切換**: 輸入框 + 「LM Studio (1234)」「Ollama (11434)」preset 按鈕，一鍵切換本機推理後端。
- **CORS 限制提醒框**: Settings → 自訂模型 區塊加上黃色警示框，列出會被瀏覽器 CORS 擋下的情境（NVIDIA NIM 等）與替代方案（擴充功能版 / OpenRouter / 本機服務）。

### 🔧 Fixed
- **自訂模型 platform 無法選取與生效**: 所有 `isPlatform()` 驗證對 `custom:<id>` 都回 false，silently fallback 到 `chatgpt`。改用新增的 `isValidPlatformId()`，全鏈路支援 `custom:<id>`。
  - `useConversations.ts` 4 處：normalizeConversation / createConversation / changeConversationPlatform / regenerateWith
  - `regenerateWith` custom 的 API Key 改從 `settings.customModels[customId].apiKey` 讀取（原本錯走 `aihub-api-keys` 加密 map）
  - `ConversationWorkspace.handleSend` 統一 API Key 處理（custom 走 customModels，內建走 apiKeys）
  - `Conversation.platform` 型別放寬為 string（含內建 Platform 與 `custom:<id>`）
  - 新增 `platforms.ts` 的 `isCustomPlatformId()` / `getCustomIdFromPlatformId()` / `isValidPlatformId()`
  - `models.ts` 的 `getDefaultModel` / `isValidModelForPlatform` 對 custom 不再 silent fallback
- **自訂模型「Failed to fetch」誤導訊息**: `createFallbackReply` 舊文案對所有錯誤都叫人填 API Key，但「Failed to fetch」其實是 fetch 層級錯誤（CORS / 網路 / 無效 URL）。改為分三種情況給不同提示：
  - 缺 API Key（保留原行為）
  - 含 `Failed to fetch` / `NetworkError` → 顯示 CORS / 網路 / Mixed Content 可能原因
  - HTTP 4xx/5xx → 顯示原 error 並引導檢查完整設定
- **customProvider endpoint 健全性檢查**: 在 fetch 前先檢查 endpoint 空字串、非法 URL、非 http(s) protocol，避免把問題丟給 fetch 拋「Failed to fetch」難以 debug。fetch catch 區分 `TypeError`（網路/CORS）vs 一般 Error，網路錯誤帶上嘗試的 URL。

### ♻️ Changed
- **合併 Ollama + LM Studio**: 高度重複的兩個本機 Provider 合併為單一 `local` Provider。
  - 刪除 `ollamaProvider.ts` 與 `lmstudioProvider.ts`
  - 新檔走 OpenAI 相容 `/v1/chat/completions` + `/v1/models` 端點
  - Sidebar 從 🦙 / 🧪 兩個按鈕合併為單一 💻 Local (Ollama / LM Studio)
  - `Platform` type 從 7 個（chatgpt/claude/gemini/grok/ollama/lmstudio/nvidia）縮為 5 個（chatgpt/claude/gemini/grok/local）

### 🗑️ Removed
- **NVIDIA Nemotron Provider**: 刪除 `nvidiaProvider.ts`、`aiPlatforms.ts` / `platforms.ts` / `models.ts` 的 nvidia 項目、Settings 的 NVIDIA API Key 輸入框。
- **Ollama / LM Studio 獨立 Provider**: 合併為 `local`（見上方 Changed）

---

## [1.0.2] - 2026-07-17

### ✨ Added
- **Grok Provider**: 新增 `grokProvider.ts`，串接 xAI API (`api.x.ai/v1/chat/completions`)，支援 SSE 串流，模型 `grok-4.5`（預設）/ `grok-4`
- **Custom Provider**: 新增 `customProvider.ts`，支援 OpenAI 相容 API 端點，用戶可從 Settings 新增自訂模型
- **自訂模型整合**: Sidebar 左側 AI Agents 列表顯示自訂模型，點擊即建立對話；`generateAssistantReply` 支援 `custom:<id>` platform 前綴
- **CustomModels.tsx**: 新增 API Key 欄位（選用）
- Settings 頁面新增 xAI / Grok API Key 輸入欄

### 🔧 Fixed
- **regenerateWith 加密讀取 bug**: 直接讀 `localStorage` 加密資料 → 改用 `secureStorage.getItem` 解密，修復「Reply with...」功能
- **Gemini 串流回應解析**: `streamGenerateContent` 端點加入 `alt=sse` 參數，確保回傳 SSE 格式；解析邏輯改為正確處理 `data:` 前綴
- **PromptLibrary 無效 model id**: `gpt-5` → `gpt-5.6-sol`
- **PromptCard 編輯模式過時快照**: 進入編輯模式時同步 `content`
- **ConversationWorkspace 佈局**: `MessageList` 和 `Composer` 原本被放在 flex 容器外面，修正為正確包在中間面板內

### 🗑️ Removed
- **Perplexity / Copilot 平台**: 從 `platforms.ts`、`models.ts`、`aiPlatforms.ts`、`registry.ts` 全部移除
- **`unsupportedProvider.ts`**: 不再需要（所有平台已實作或移除）
- **死碼檔案**: `ImportExportBar.tsx`、`Header.tsx`、`AppHeader.tsx`、`data/apps.ts`、`utils/browserWorkflow.ts`、`vite.config.example.ts`

### 📝 Changed
- **路由規則**: 9 條預設路由規則全部更新至最新模型（`sonnet-3.5`→`sonnet-5`、`gpt-4o`→`gpt-5.6-sol`、`gemini-pro-latest`→`gemini-flash-latest`）
- **Gemini API_MODEL_MAP**: 移除孤立 `gemini-2.5-flash-lite` entry
- **過時註解**: `types.ts`（`sonnet-4`→`sonnet-5`）、`registry.ts` 更新
- **README.md**: 重寫為 AIHub 專案說明（取代 Vite 模板預設）

---

## [1.0.1] - 2026-07-16

### 🔧 Fixed
- **Gemini API model names**: Updated deprecated `gemini-1.5-flash`/`gemini-1.5-pro` to `gemini-3.5-flash`/`gemini-2.5-pro`
- **Cross-platform model contamination**: `normalizeConversation` now validates model belongs to target platform
- **handleSend model validation**: Composer-passed model validated before API call
- **regenerateWith model validation**: "Reply with..." model now validated against platform

### ✨ Added
- NVIDIA Nemotron provider support
- Custom Models management in settings

### 📝 Documentation
- handoff.md, changelog.md, sprint-history.md, roadmap.md synced

---

## [1.0.0] - 2026-07-15

### 🔐 Security - Major Architecture Change
- **Removed master password mechanism** - Replaced with browser-bound random key encryption
- **New encryption architecture**: AES-GCM (256-bit) via Web Crypto API
- Keys generated per browser/profile via `crypto.subtle.generateKey()`
- Keys stored in localStorage (Base64 encoded raw key)
- Data automatically encrypted, zero user friction
- Device/browser change automatically invalidates encrypted data

### ✨ Added
- **Sprint 12**: API Key encryption migration to secureStorage
- **Sprint 11**: Complete Settings system
- **Sprint 10**: Compare View (多模型並排對比)
- **Sprint 9**: Reply with... / Multi-AI Conversation / Conversation Routing
- **Ollama Provider**: Local model support
- **LM Studio Provider**: OpenAI-compatible local API
- **Browser Extension (MV3)**: Side Panel, Context Menus, MCP Client (SSE + STDIO)
- **Native Messaging Host**: Python host for MCP STDIO transport
- **MCP Tool Invocation Panel**: JSON param editor, smart result renderer

### 🔧 Changed
- **secureStorage.ts**: Complete rewrite - removed PBKDF2/master password, added Web Crypto key generation
- **useSecureLocalStorage.ts**: Removed password parameter, simplified to direct encryption
- **useApiKeys.ts**: Removed `reEncryptApiKeys`, simplified API
- **FirstTimeSetup.tsx**: 4-step password flow → single welcome screen
- **GitHub Actions CI**: lint → typecheck → build → test pipeline

### 🗑️ Removed
- `src/components/ChangeMasterPassword.tsx` (deleted)
- `src/pages/Home.tsx` and empty `src/pages/` directory
- `aihub-master-password-set` localStorage key
- Master password UI from Settings page

### 🐛 Fixed
- **TypeScript config conflict** in FirstTimeSetup.tsx: `as const` for stepOrder, early return after declaration, underscore prefix for unused params
- **ESLint exhaustive-deps** in Context providers: split into Provider + Context + Hook files
- **Vitest setup**: Removed localStorage mock, use real localStorage for tests
- **Chrome Web Store screenshots**: Regenerated after Settings UI changes

---

## [0.9.0] - 2026-07-14 (Sprint 8 Complete)

### ✨ Added
- AI Provider abstraction layer (`AIProvider` interface, Registry Pattern)
- Unified `generateAssistantReply()` entry point
- ChatGPT Provider: SSE streaming via `/v1/chat/completions`
- Claude Provider: SSE streaming with `anthropic-dangerous-direct-browser-access`
- Gemini Provider: JSON Lines streaming via `streamGenerateContent`
- Vite Dev Proxy for OpenAI CORS
- Model Map validation with official model names
- Browser Workflow: Copy Prompt → Open official site
- Project Management: CRUD, grouped display, move conversations

---

## [0.7.0] - 2026-07-13 (Sprint 7 Complete)

### ✨ Added
- Conversation CRUD (Create, Read, Update, Delete)
- Context Menu (Analyze, Summarize, Translate selected text)
- Favorite conversations
- Project grouping
- Export conversations (JSON)
- Conversation Search v2 (Title, Content, Platform, Project, Favorite)
- `createConversation(options)` + `createConversationByPlatform()`

---

## [0.6.0] - 2026-07-12

### ✨ Added
- Conversation Manager
- Prompt Library
- AI Agent Manager

# AIHub 專案整理報告（截至 AIHub v0.8 Sprint 8 完成）

## 1. 已完成功能與架構

### 已完成功能（v0.8 含 v0.7 全部）

-   AI Platform 管理（啟用/停用，LocalStorage）
-   Sidebar 顯示 AI Agent 與 Prompt Library
-   Prompt Library 基本新增流程
-   Conversation Workspace
-   Conversation 建立、選取、重新命名、刪除
-   MessageList / MessageBubble / Composer
-   LocalStorage 持久化
-   **Context Menu（右鍵選單：Rename/Delete/Favorite/Duplicate/Move）**
-   **Favorite Conversation（標星置頂）**
-   **Project Folder（資料夾分類、分組顯示、移動對話）**
-   **Export（Markdown / JSON 下載）**
-   **Smart Conversation Search v2（Title、Content、Platform、Project、Favorite 多維搜尋、預覽）**
-   **全域搜尋（Cmd/Ctrl+K，跨 Conversation/Prompt/Project）**
-   **AI Provider 完整抽象層（`AIProvider` 介面、Registry Pattern、統一 `generateAssistantReply` 入口）**
-   **三大 Provider 真實 API 串接：ChatGPT、Claude、Gemini**
-   **全 Provider Streaming 支援：SSE (OpenAI/Anthropic) + JSON Lines (Gemini)**
-   **CORS 解決方案：Vite Dev Proxy (ChatGPT) / `dangerous-direct-browser-access` (Claude) / 直連 (Gemini)**
-   **Model Map 校驗更新為官方正式版本名稱**
-   **Browser Workflow：複製 Prompt → 開啟官網分頁**
-   Build 成功，可正常執行

### 主要檔案架構

-   `App.tsx`：頁面切換與整體 Layout
-   `Sidebar.tsx`：主側邊欄
-   `ConversationWorkspace.tsx`：Conversation 主工作區
-   `ConversationSidebar.tsx`：Conversation 清單、Search、Context Menu、Project 分組
-   `MessageList.tsx`：訊息列表
-   `MessageBubble.tsx`：單則訊息
-   `Composer.tsx`：輸入框（支援 Send / Open in Browser）
-   `PromptLibrary.tsx` / `PromptForm.tsx`：Prompt 管理
-   `GlobalSearch.tsx`：全域搜尋（Cmd/Ctrl+K）
-   `ProjectManager.tsx`：專案管理
-   `useConversations.ts`：Conversation CRUD、Favorite、Project、Search v2、Platform 切換
-   `useGlobalSearch.ts` / `useConversationSearch.ts`：搜尋邏輯
-   `useAppSettings.ts` / `useApiKeys.ts`：設定與 API Key 管理
-   `ConversationContext.tsx` / `AgentContext.tsx`：Context Providers
-   `types/conversation.ts` / `types/prompt.ts`：核心型別定義
-   `constants/platforms.ts` / `models.ts` / `projects.ts`：平台、模型、專案常數
-   `data/aiPlatforms.ts`：AI 平台定義（官網 URL、模型清單、圖示）
-   `providers/`：Provider 抽象層
    -   `types.ts`：`AIProvider`、`SendMessageParams`、`AssistantReply`
    -   `registry.ts`：Provider Registry（ChatGPT/Claude/Gemini/Grok/Perplexity/Copilot）
    -   `index.ts`：統一入口 `generateAssistantReply()`
    -   `chatgptProvider.ts`：OpenAI Chat Completions（SSE Streaming、Vite Proxy）
    -   `claudeProvider.ts`：Anthropic Messages（SSE Streaming、dangerous-direct-browser-access）
    -   `geminiProvider.ts`：Google Generative Language（JSON Lines Streaming、streamGenerateContent）
    -   `unsupportedProvider.ts`：佔位 Provider
    -   `utils.ts`：`createFallbackReply()` 統一錯誤回退
-   `utils/browserWorkflow.ts`：Open in Browser 工作流
-   `utils/conversationExport.ts`：Markdown/JSON Export
-   `vite.config.ts`：Vite 設定（含 `/api/openai` Proxy）

## 2. 技術棧、命名慣例、程式碼風格

### 技術棧

-   React 19
-   TypeScript 6
-   Vite 8
-   LocalStorage
-   Context API
-   ESLint 10 + TypeScript ESLint

### 命名慣例

-   Component：PascalCase
-   Hook：`useXxx`
-   Type：PascalCase
-   資料檔：camelCase
-   一個元件負責單一職責

### 程式碼風格

-   函式元件
-   TypeScript 型別明確
-   Inline Style 為主
-   小步提交（Build 成功後 Commit）

## 3. 待完成功能（依優先順序 —— Sprint 9 / v1.0）

1.  **Reply with...**（同一輪對話一鍵換模型重答）
2.  **Multi-AI Conversation**（單一 Thread 串接多模型）
3.  **Conversation Routing**（依關鍵字/指令自動導向不同模型）
4.  **Compare Responses**（並排比較多模型回覆）
5.  **Workspace Global Search 增強**（更豐富的篩選與預覽）
6.  **Browser Extension**（側邊欄快速呼叫）
7.  **Ollama / LM Studio 本地模型支援**
8.  **MCP 整合**（工具調用標準化）

## 4. 實作方向（Sprint 9 / v1.0 重點）

### Reply with...

-   Conversation 新增 `regenerateWith(platform, model)` 方法
-   保留原訊息歷史，以新模型重新發送最後一則 user prompt
-   UI：MessageBubble 右上角加入「Reply with…」選單

### Multi-AI Conversation

-   Message 型別增加 `provider` 欄位（已存在）
-   Composer 允許每輪選擇目標模型
-   同一 Thread 內可見多模型交替回覆

### Conversation Routing

-   設定 `routingRules: { pattern, platform, model }[]`
-   發送前攔截判斷，自動切換目標 Provider
-   關鍵字、正則、指令前綴（如 `@claude`、`/code`）支援

### Compare Responses

-   新增 Compare 模式：並排顯示 2~3 模型對同一 Prompt 的回覆
-   支援並行發送請求、Streaming 同步渲染

### Browser Extension

-   Manifest V3 Side Panel
-   Content Script 擷取頁面內容注入 Prompt
-   與 Web 版共用 Provider 抽象層

### Ollama / LM Studio

-   新增 `ollamaProvider.ts` 實作 `AIProvider`（呼叫 `http://localhost:11434/api/chat`）
-   模型列表動態從 `/api/tags` 取得
-   無需 API Key，本機優先

### MCP 整合

-   依 `model-context-protocol` 規格實作 Client
-   Tool Calling 統一介面，Provider 端轉換為各自 Function Calling 格式

## 5. 當前版本目標

**AIHub v0.8（Sprint 8 完成 ✅）** 聚焦於：
-   Smart Search、Context Menu、Favorite、Project 管理、Workspace 體驗優化（v0.7 範圍）
-   **AI Provider 完整抽象、真實 API 串接、Streaming、CORS 解決、Model Map 校驗**（v0.8 新增）

**下一階段進入 v0.9（Sprint 9）**，開始實作差異化功能：Reply with...、Multi-AI Conversation、Conversation Routing。

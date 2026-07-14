# Sprint History

## Sprint 7A

-   Conversation CRUD
-   Search planning
-   Context menu planned

## Sprint 7（完成）

-   Conversation CRUD
-   Context Menu
-   Favorite
-   Project
-   Export
-   Conversation Search v2（Title、Content、Platform、Project、Favorite）
-   `createConversation(options)` + `createConversationByPlatform()`

## Sprint 8（完成 ✅）

-   AI Provider 完整抽象（`AIProvider` 介面、Registry Pattern）
-   API 串接完成：ChatGPT、Claude、Gemini 三大 Provider
-   Streaming 實作：全部支援即時串流回應（SSE / JSON Lines）
-   Vite Dev Proxy 解決 CORS（ChatGPT `/api/openai/*`）
-   Anthropic `anthropic-dangerous-direct-browser-access` 直連
-   Gemini `streamGenerateContent` 端點支援
-   Model Map 校驗：對照官方文件更新為正式版本名稱
  - OpenAI: `gpt-4o` / `gpt-4o-mini` / `gpt-4-turbo`
  - Anthropic: `claude-3-5-sonnet-20241022` / `claude-3-5-haiku-20241022` / `claude-3-opus-20240229`
  - Google: `gemini-1.5-pro` / `gemini-1.5-flash` / `gemini-1.0-pro`
-   Browser Workflow 優化
-   Project 管理完善

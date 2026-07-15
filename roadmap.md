# Roadmap

## Sprint 7（已完成）

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
-   Browser Workflow 優化（複製 Prompt + 開啟官網分頁）
-   Project 管理完善（CRUD、分組顯示、移動對話）

## Sprint 9（規劃中）

-   Reply with...（同一輪對話一鍵換模型重答）
-   Multi-AI Conversation（單一 Thread 串接多模型）
-   Conversation Routing（依關鍵字/指令自動導向不同模型）

## v1.0（目標）

-   Compare Responses（並排比較多模型回覆）
-   Workspace Global Search（跨 Conversation/Prompt/Project）
-   Browser Extension（側邊欄快速呼叫）
-   Ollama / LM Studio 本地模型支援
-   MCP 整合（工具調用標準化）

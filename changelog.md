# Changelog

## Sprint 8（v0.8.0）

-   AI Provider 完整抽象層（`AIProvider` 介面、Registry Pattern、統一 `generateAssistantReply` 入口）
-   三大 Provider 真實 API 串接完成：ChatGPT、Claude、Gemini
-   全 Provider Streaming 支援：SSE (OpenAI/Anthropic) + JSON Lines (Gemini)
-   CORS 解決方案：Vite Dev Proxy (ChatGPT) / `dangerous-direct-browser-access` (Claude) / 直連 (Gemini)
-   Model Map 校驗更新為官方正式版本名稱
-   Browser Workflow：複製 Prompt → 開啟官網分頁
-   Project 管理：CRUD、分組顯示、對話移動

## Sprint 7（v0.7.0）

-   Conversation CRUD
-   Context Menu
-   Favorite
-   Project
-   Export
-   Conversation Search v2（Title、Content、Platform、Project、Favorite）
-   `createConversation(options)` + `createConversationByPlatform()`

## v0.7

-   Conversation manager
-   Prompt library
-   AI Agent manager

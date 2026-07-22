# Roadmap

## Sprint 7（已完成 ✅）

- Conversation CRUD
- Context Menu
- Favorite
- Project
- Export
- Conversation Search v2（Title、Content、Platform、Project、Favorite）
- `createConversation(options)` + `createConversationByPlatform()`

## Sprint 8（已完成 ✅） - v0.8.0

- AI Provider 完整抽象（`AIProvider` 介面、Registry Pattern）
- API 串接完成：ChatGPT、Claude、Gemini 三大 Provider
- Streaming 實作：全部支援即時串流回應（SSE / JSON Lines）
- Vite Dev Proxy 解決 CORS（ChatGPT `/api/openai/*`）
- Anthropic `anthropic-dangerous-direct-browser-access` 直連
- Gemini `streamGenerateContent` 端點支援
- Model Map 校驗：對照官方文件更新為正式版本名稱
  - OpenAI: `gpt-4o` / `gpt-4o-mini` / `gpt-4-turbo`
  - Anthropic: `claude-3-5-sonnet-20241022` / `claude-3-5-haiku-20241022` / `claude-3-opus-20240229`
  - Google: `gemini-1.5-pro` / `gemini-1.5-flash` / `gemini-1.0-pro`
- Browser Workflow 優化（複製 Prompt + 開啟官網分頁）
- Project 管理完善（CRUD、分組顯示、移動對話）

## Sprint 9（已完成 ✅） - v0.9.0

- Reply with...（同一輪對話一鍵換模型重答）
- Multi-AI Conversation（單一 Thread 串接多模型）
- Conversation Routing（依關鍵字/指令自動導向不同模型）

## Sprint 10（已完成 ✅） - v0.9.5

- Compare Responses（並排比較多模型回覆）

## Sprint 11（已完成 ✅） - v0.9.8

- Settings & Encryption System
  - AES-GCM + PBKDF2 加密（後在 v1.0.0 改為 Web Crypto 隨機金鑰）
  - First-time Setup Wizard
  - Change Master Password (已在 v1.0.0 移除)
  - Reset All Data

## Sprint 12（已完成 ✅） - v1.0.0

- Testing & CI/CD (Vitest + GitHub Actions)
- **移除主密碼機制** - 改為瀏覽器綁定隨機金鑰加密
- Context 重構修復 ESLint 警告
- Chrome Extension MV3 完整發布就緒
- MCP 整合 (SSE + STDIO)
- Ollama / LM Studio 本地模型支援
- 工具調用 UI (MCP Tool Invocation Panel)

---

## v1.0.0 發布完成項目 ✅

| 項目 | 狀態 | 備註 |
|------|------|------|
| Compare Responses | ✅ 完成 | Sprint 10 |
| Workspace Global Search | ✅ 完成 | Sprint 7/9 |
| Browser Extension (MV3 Side Panel) | ✅ 完成 | Sprint 12 |
| Ollama / LM Studio 本地模型支援 | ✅ 完成 | Sprint 12 |
| MCP 整合 (工具調用標準化) | ✅ 完成 | Sprint 12 (SSE + STDIO) |
| 單元測試 + CI/CD | ✅ 完成 | Sprint 12 |
| 隱私權政策 | ✅ 完成 | GitHub Pages 就緒 |
| Chrome Web Store 發布套件 | ✅ 完成 | store-assets/ 目錄就緒 |
## Sprint 13（已完成 ✅）- v1.0.1

| 項目 | 狀態 | 備註 |
|------|------|------|
| Gemini API 模型名稱更新 | ✅ 完成 | gemini-1.5-flash → gemini-3.5-flash |
| Cross-platform 模型汙染修復 | ✅ 完成 | normalizeConversation 加入驗證 |
| NVIDIA Nemotron Provider | 🗂️ 歷史項目 | 曾於 v1.0.1 支援，已在 v1.1.0 移除 |
| Custom Models 管理 | ✅ 完成 | Settings UI 支援 |

## Sprint 15、16（已完成 ✅）- v1.1.0

- 修正自訂模型 `custom:<id>` platform 在對話建立、切換與重新生成時被錯誤回退的問題
- Local Provider 統一支援 Ollama 與 LM Studio 的 OpenAI 相容 API，並可在 Settings 切換端點
- 移除 NVIDIA Nemotron 與 Ollama／LM Studio 的獨立 Provider
- 自訂模型支援原地修改名稱、端點、模型 ID 與 API Key
- 新增最多 4 個內建或自訂模型的並行回覆選擇列（ReplyTargetBar）


---

## 後續規劃（v1.2+）

### 核心優化
- [ ] 效能優化：大量對話時的虛擬化渲染
- [ ] 離線支援：Service Worker 快取策略
- [ ] PWA 支援：安裝為桌面應用

### 功能增強
- [ ] Prompt 版本控制 / 分支
- [ ] 對話分享連結 (匿名化)
- [ ] 自定義系統 Prompt 模板
- [ ] 模型參數微調 UI (temperature, top_p, max_tokens)
- [ ] 對話匯入/匯出 (Markdown, PDF)

### Extension 強化
- [ ] Popup 模式 (替代 Side Panel 選項)
- [ ] 網頁內容自動注入 Context
- [ ] 右鍵選單自定義 Prompt

### MCP 擴充
- [ ] MCP Server Marketplace 整合
- [ ] 工具結果快取
- [ ] 多 MCP Server 並行管理

### 國際化
- [ ] i18n 架構 (繁中/英文/日文/韓文)

---

## 長期願景 (v2.0+)

- **AI Agent Orchestration**: 多 Agent 協作工作流
- **知識庫 / RAG**: 本地向量搜尋 + 文件上傳
- **團隊協作**: 共享 Workspace、權限管理
- **Plugin System**: 社群擴充功能市集

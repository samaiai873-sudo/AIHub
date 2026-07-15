# Chrome Web Store 上架文案

---

## 📝 標題 (最多 45 字元)

**AIHub: 多模型 AI 聊天 + 本地模型 + MCP 工具**

---

## 📝 簡短說明 (最多 132 字元)

**雲端/本地模型雙支援、MCP 工具調用、無主密碼加密、Compare View 多模型對比——一站式 AI 工作區。**

---

## 📝 詳細說明

### 🎯 為什麼選擇 AIHub？

AIHub 是**唯一**同時支援雲端 AI、本地模型與 MCP 工具調用的瀏覽器擴充功能。不論你偏好 ChatGPT/Claude/Gemini 的強大推理，或是 Ollama/LM Studio 的隱私優先，AIHub 都能在同一個 Side Panel 無縫切換。

---

### ✨ 核心功能

#### 🤖 6 大 AI 提供商，任你切換
- **雲端**：OpenAI (GPT-4o, GPT-4o-mini)、Anthropic (Claude 3.5 Sonnet/Haiku)、Google (Gemini 1.5 Pro/Flash)
- **本地**：Ollama (自動發現模型)、LM Studio (OpenAI 相容 API)
- **零配置**：本地模型自動偵測，雲端模型輸入 API Key 即用

#### 🔌 Model Context Protocol (MCP) 完整支援
- **SSE 傳輸**：連接遠端 MCP Server
- **STDIO 傳輸**：透過 Native Messaging Host 連接本地 MCP Server (Python 開源實作)
- **工具調用面板**：JSON 參數編輯器、即時結果渲染 (文字/圖片/資源/錯誤)

#### 🔐 隱私優先：無主密碼加密架構
- **瀏覽器綁定隨機金鑰**：Web Crypto API AES-GCM 256-bit
- **零摩擦體驗**：無需設定/記住密碼，資料自動加密
- **裝置級安全**：換裝置/瀏覽器自動失效，無密碼遺忘風險
- **完全離線**：本地模型使用時零資料上傳

#### ⚡ 生產力功能
- **Compare View**：同一提示詞並排比較 3+ 模型回覆，一鍵選出最佳答案
- **Reply with...**：對任何 AI 回覆右鍵選單，換模型重新生成
- **智慧路由**：`@claude 寫代碼`、`@gemini 翻譯`、`/code` 等前綴自動導向對應模型
- **右鍵選單**：網頁選取文字 → 分析/總結/翻譯
- **快捷鍵**：`Ctrl+Shift+A` 瞬間開啟 Side Panel

#### 🎨 體驗細節
- 深色主題、響應式 Side Panel
- 串流即時顯示、Markdown/代碼高亮渲染
- 對話搜尋、專案分組、匯出 JSON
- Prompt Library 管理常用提示詞

---

### 🛡️ 隱私權政策
https://samaiai873-sudo.github.io/AIHub/privacy/

- **不收集任何個人資料、聊天內容、API Keys**
- 所有資料僅存於您的瀏覽器本地 (`chrome.storage.local` + `localStorage`)
- API 呼叫直連各提供商端點，不經由我們伺服器
- 開源透明：https://github.com/samaiai873-sudo/AIHub

---

### 🔧 權限說明
| 權限 | 用途 |
|------|------|
| `sidePanel` | 提供側邊欄聊天介面 |
| `storage` | 本地加密儲存設定與歷史 |
| `activeTab` | 右鍵選單取得選取文字 |
| `scripting` | 注入內容腳本 |
| `contextMenus` | 建立右鍵選單 |
| `tabs` | 快捷鍵開啟面板、取得頁面資訊 |
| `nativeMessaging` | MCP STDIO 連線本地伺服器 |
| `host_permissions: <all_urls>` | **僅用於直接呼叫 AI API 端點**，不存取網頁內容 |

---

### 📥 開源與貢獻
- **原始碼**：MIT License，歡迎 Issue/PR
- **Native Messaging Host**：Python 開源，可自行編譯驗證
- **回報問題**：GitHub Issues

---

### 🆕 v1.0.0 更新重點
- ✅ 移除主密碼，改為瀏覽器綁定加密
- ✅ 新增 Compare View 多模型對比
- ✅ 新增 Ollama / LM Studio 本地模型支援
- ✅ 完整 MCP SSE + STDIO 整合
- ✅ 單元測試 + CI/CD (GitHub Actions)
- ✅ 隱私權政策部署就緒

---

**立即體驗**——在 Side Panel 中擁有最完整的 AI 工作區。
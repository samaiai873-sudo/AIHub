# AIHub

> 多 AI 聊天介面 · 瀏覽器綁定端到端加密 · Chrome Extension (MV3)

AIHub 是一個**多 AI 聊天介面**，支援 ChatGPT、Claude、Gemini、Ollama、LM Studio、NVIDIA Nemotron 等多種 AI 提供商，整合 Model Context Protocol (MCP) 支援本地工具調用，採用**瀏覽器綁定 Web Crypto 加密**儲存（無需主密碼）。

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Vite](https://img.shields.io/badge/Vite-8-646cff)

---

## ✨ 功能特色

### 多 AI 提供商整合

| Provider | 串流方式 | 特色 |
|----------|----------|------|
| **ChatGPT** (OpenAI) | SSE | `/v1/chat/completions`，Vite Dev Proxy 解決 CORS |
| **Claude** (Anthropic) | SSE | `anthropic-dangerous-direct-browser-access` 直連 |
| **Gemini** (Google) | JSON Lines | `streamGenerateContent` 端點 |
| **Ollama** | SSE | 本地模型，模型自動探索，自訂端點 |
| **LM Studio** | SSE | OpenAI 相容 API，連線狀態檢測 |
| **NVIDIA Nemotron** | SSE | nemotron-3-ultra / nemotron-4-340b / nemotron-3-8b |

### 核心功能

- **多模型並排對比** (Compare View) — 多模型同時回答，Pick Winner
- **Reply with...** — 同一輪對話一鍵換模型重答
- **Multi-AI Conversation** — 單一 Thread 串接多模型
- **Conversation Routing** — 依關鍵字/指令自動導向不同模型（`@claude`、`/code` 等）
- **Custom Models** — 自訂模型管理（Settings UI）
- **Conversation CRUD** — 建立/搜尋/收藏/專案分組/匯出
- **Prompt Library** — Prompt 庫管理
- **AI Agent Manager** — AI 代理人管理
- **Global Search** — 跨對話/Prompt 全文搜尋

### 安全與加密

- **AES-GCM 256-bit** — Web Crypto API 生成隨機金鑰
- **瀏覽器綁定** — 金鑰綁定當前瀏覽器設定檔，換裝置自動失效
- **零配置** — 無需設定/記住任何密碼，資料自動加密
- **API 金鑰加密儲存** — 所有敏感資料使用 `useSecureLocalStorage` 加密

### Chrome Extension (MV3)

- **Side Panel** — 側邊欄聊天介面
- **Context Menus** — 右鍵選單（分析/總結/翻譯選取文字）
- **MCP Client** — 支援 SSE + STDIO（透過 Native Messaging Host）
- **MCP Tool Invocation Panel** — JSON 參數編輯器、智慧結果渲染

---

## 🛠 技術棧

| 層級 | 技術 |
|------|------|
| **前端框架** | React 19 + TypeScript (strict) + Vite 8 |
| **狀態管理** | React Context API + Custom Hooks |
| **樣式** | Inline Styles + CSS Variables（深色主題） |
| **測試** | Vitest + happy-dom + @testing-library/react |
| **CI/CD** | GitHub Actions（lint → typecheck → build → test） |
| **瀏覽器擴充** | Manifest V3（Side Panel + Background SW） |
| **加密** | Web Crypto API（AES-GCM 256-bit，瀏覽器綁定） |

---

## 📦 安裝與執行

### 前置需求

- Node.js 18+
- npm 或 yarn

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 生產建構
npm run build

# 執行測試
npm run test

# 程式碼檢查
npm run lint
```

### Chrome Extension 開發

```bash
cd extension
npm install
npm run build        # 輸出到 dist/

# Chrome → 擴充功能 → 載入未封裝項目 → 選擇 dist/
```

### MCP Native Messaging Host（選用）

```bash
# 安裝 Native Messaging Host（用於 MCP STDIO）
python extension/native-host/install.py
```

---

## 📂 專案結構

```
AIHub/
├── src/                          # 主 Web App
│   ├── components/               # UI 組件（24 個）
│   ├── context/                  # React Context 狀態管理
│   ├── hooks/                    # 自定義 Hooks
│   ├── providers/                # AI Provider 抽象層
│   │   ├── chatgptProvider.ts
│   │   ├── claudeProvider.ts
│   │   ├── geminiProvider.ts
│   │   ├── ollamaProvider.ts
│   │   ├── lmstudioProvider.ts
│   │   ├── nvidiaProvider.ts
│   │   └── registry.ts           # 統一註冊管理
│   ├── utils/                    # 工具函式（加密、匯出等）
│   ├── constants/                # 常數定義
│   ├── types/                    # TypeScript 型別定義
│   ├── App.tsx                   # 主應用程式
│   └── main.tsx                  # 入口點
├── extension/                    # Chrome Extension (MV3)
│   ├── background/               # Service Worker
│   ├── content/                  # Content Script
│   ├── native-host/              # Python Native Messaging Host
│   └── src/sidepanel/            # Side Panel UI
├── docs/                         # 文件
│   ├── handoff.md                # 交接文件
│   ├── changelog.md              # 變更日誌
│   ├── sprint-history.md         # Sprint 歷程
│   ├── roadmap.md                # 路線圖
│   ├── architecture.md           # 架構說明
│   ├── coding-style.md           # 程式碼風格
│   └── privacy/policy.md         # 隱私權政策
├── .github/workflows/            # CI/CD
└── store-assets/                 # Chrome Web Store 素材
```

---

## 🏗 架構概覽

### Provider Pattern

所有 AI 提供商實作統一的 `AIProvider` 介面，透過 `registry.ts` 統一註冊管理：

```typescript
interface AIProvider {
  id: string;
  name: string;
  supportsStreaming: boolean;
  defaultModel: string;
  sendMessage(params: SendMessageParams): Promise<AssistantReply>;
}
```

### 資料流向

```
User Input → Composer → ConversationWorkspace → generateAssistantReply()
    → Provider Registry → Specific Provider → API Call (fetch + streaming)
    → onChunk 回呼（即時更新 UI） → onComplete（儲存到 ConversationContext）
```

### 加密架構（v1.0.0）

```
Browser Session
    ↓
Web Crypto API: generateKey(AES-GCM, 256-bit)
    ↓
Export raw key → Base64 → localStorage
    ↓
AES-GCM（每筆資料獨立 IV）→ Encrypted Blob → localStorage / chrome.storage.local
```

> **無主密碼設計**：金鑰由瀏覽器自動生成並綁定，使用者零摩擦，換裝置自動失效。

---

## 🚀 部署

### Web（Vercel）

- 已部署至 Vercel：[ai-hub-six-rouge.vercel.app](https://ai-hub-six-rouge.vercel.app)
- 自動部署：`git push` 觸發 Vercel 自動建構

### Chrome Web Store

- 發布套件位於 `store-assets/chrome-web-store-package/`
- 包含：5 張截圖 (1280×800)、2 張宣傳圖、`aihub-extension.zip`
- 隱私權政策部署於 GitHub Pages

---

## 📋 發布檢查清單

- [ ] `npm run build` 成功
- [ ] `npm run test` 全通過
- [ ] `npm run lint` 0 errors
- [ ] Extension `dist/` 建構成功
- [ ] 截圖素材準備齊全（`store-assets/`）
- [ ] 隱私權政策部署（GitHub Pages）

---

## 🗺 路線圖

### v1.1.0 規劃中

- 效能優化：大量對話虛擬化渲染
- 離線支援：Service Worker 快取策略
- PWA 支援：安裝為桌面應用
- Prompt 版本控制 / 分支
- 對話分享連結（匿名化）
- 模型參數微調 UI（temperature, top_p, max_tokens）
- 對話匯入/匯出（Markdown, PDF）
- i18n 國際化（繁中/英文/日文/韓文）

### 長期願景 (v2.0+)

- **AI Agent Orchestration** — 多 Agent 協作工作流
- **知識庫 / RAG** — 本地向量搜尋 + 文件上傳
- **團隊協作** — 共享 Workspace、權限管理
- **Plugin System** — 社群擴充功能市集

完整路線圖請見 [docs/roadmap.md](docs/roadmap.md)。

---

## 📚 文件

| 文件 | 說明 |
|------|------|
| [交接文件](docs/handoff.md) | 專案完整交接說明 |
| [變更日誌](docs/changelog.md) | 版本變更記錄 |
| [Sprint 歷程](docs/sprint-history.md) | 開發 Sprint 記錄 |
| [路線圖](docs/roadmap.md) | 功能規劃與願景 |
| [架構說明](docs/architecture.md) | 系統架構概覽 |
| [程式碼風格](docs/coding-style.md) | 命名與風格規範 |
| [隱私權政策](docs/privacy/policy.md) | 資料收集與加密說明 |

---

## 🔒 隱私權

- **不收集任何資料** — 無伺服器、無追蹤器、無分析工具
- **所有資料本地加密儲存** — API 金鑰、對話歷史、設定均 AES-GCM 加密
- **API 金鑰永不離開瀏覽器**
- **開源透明化** — 歡迎安全性審計

完整政策請見 [隱私權政策](docs/privacy/policy.md)。

---

## 🤝 貢獻

歡迎提交 Issue、PR 或進行安全性審計。

- **GitHub**：[samaiai873-sudo/AIHub](https://github.com/samaiai873-sudo/AIHub)
- **授權**：MIT License

---

## 📄 授權

MIT License — 詳見 [LICENSE](LICENSE)。

# AIHub 專案交接文件

> **版本**: 1.1.0  
> **更新日期**: 2026-07-22  
> **專案狀態**: 生產就緒，可提交 Chrome Web Store 審核

---

## 1. 專案概覽

### 1.1 專案定位
AIHub 是一個多 AI 聊天介面，支援 ChatGPT、Claude、Gemini、Grok、Local (Ollama / LM Studio 統一介面) 等 5 種內建 AI Provider，加上自訂模型（OpenAI 相容 API 端點）可任意擴充，整合 Model Context Protocol (MCP) 支援本地工具調用，採用瀏覽器綁定端到端加密儲存（無需主密碼）。

### 1.2 技術棧
| 層級 | 技術 |
|------|------|
| **前端框架** | React 19 + TypeScript + Vite |
| **狀態管理** | React Context + Custom Hooks |
| **樣式** | CSS Modules / Inline Styles (深色主題) |
| **測試** | Vitest + happy-dom + @testing-library/react |
| **建構工具** | Vite + TypeScript |
| **CI/CD** | GitHub Actions |
| **瀏覽器擴充** | Manifest V3 (Side Panel + Background SW) |

### 1.3 專案結構
```
AIHub/
├── src/                          # 主 Web App
│   ├── components/               # UI 組件
│   ├── context/                  # React Context 狀態管理
│   ├── hooks/                    # 自定義 Hooks
│   ├── providers/                # AI Provider 抽象層
│   ├── utils/                    # 工具函式 (加密、匯出等)
│   ├── constants/                # 常數定義
│   ├── types/                    # TypeScript 型別定義
│   ├── data/                     # 靜態資料 (aiPlatforms.ts)
│   ├── App.tsx                   # 主應用程式
│   └── main.tsx                  # 入口點
├── extension/                    # Chrome Extension (MV3)
│   ├── background/               # Service Worker
│   ├── content/                  # Content Script
│   ├── native-host/              # Python Native Messaging Host
│   └── src/sidepanel/            # Side Panel UI
├── docs/                         # 文件
│   ├── privacy/                  # 隱私權政策
│   └── handoff.md                # 本文件
├── .github/workflows/            # CI/CD
└── store-assets/                 # Chrome Web Store 素材
```

---

## 2. 程式架構

### 2.1 核心架構模式

#### Provider Pattern (AI 提供商抽象)
```typescript
// src/providers/types.ts
interface AIProvider {
  id: string;
  name: string;
  supportsStreaming: boolean;
  defaultModel: string;
  sendMessage(params: SendMessageParams): Promise<AssistantReply>;
}
```

**已實作 Provider**:
- `chatgptProvider.ts` — OpenAI API (SSE 串流)
- `claudeProvider.ts` — Anthropic API (SSE 串流)
- `geminiProvider.ts` — Google Gemini API (SSE 串流, `alt=sse`)
- `grokProvider.ts` — xAI API (SSE 串流) **v1.0.2 新增**
- `localProvider.ts` — 本機推理統一介面 (Ollama / LM Studio 合併) **v1.1.0 重構**
- `customProvider.ts` — 自訂 OpenAI 相容 API **v1.0.2 新增**

**註冊**: `src/providers/registry.ts` - 統一管理所有 Provider

#### Custom Provider (自訂模型) **v1.0.2 新增 / v1.1.0 支援修改**
- 用戶從 Settings → 自訂模型新增 / 修改 / 移除（名稱、端點、模型 ID、API Key）
- platform id 格式：`custom:<id>`
- `generateAssistantReply` 偵測 `custom:` 前綴後動態建立 provider
- 自訂模型顯示於左側 `Sidebar` AI Agents 列表，點擊即建立對話

#### CORS 限制（純網頁版重要須知）**v1.1.0 新增**
純網頁版（Vercel / npm run dev 等瀏覽器環境）對於「未開放 CORS」的 API 端點會被瀏覽器擋下 fetch，錯誤訊息為 `Failed to fetch`：

- NVIDIA NIM (`integrate.api.nvidia.com`) 等官方雲端 API 通常不開放 CORS
- 多數企業內部 API 也未開放 CORS

解法：
1. 使用 Chrome 擴充功能版（SidePanel）— `manifest.json` 已開 `host_permissions: <all_urls>`，可繞過 CORS
2. 改用本身支援 CORS 的中繼服務（如 OpenRouter）
3. 使用本機 localhost 服務（Ollama / LM Studio）— 本身允許跨來源

Settings → 自訂模型 區塊有黃色提醒框，列出上述限制。

#### Native Messaging Host 安裝
Native Messaging Host 需手動執行安裝腳本，並帶入 Chrome 擴充功能的 32 位小寫 extension ID：

```bash
python extension/native-host/install.py <extension_id>
```

`<extension_id>` 會寫入 `allowed_origins`，避免通用萬用字元設定造成安裝與審核風險。

#### Context Pattern (狀態管理)
**Context 列表**:
- `ConversationContext` - 對話 CRUD、搜尋、分支
- `AgentContext` - AI 代理人管理

#### Hook Pattern (邏輯復用)
| Hook | 用途 |
|------|------|
| `useConversations` | 對話 CRUD、搜尋、重新生成 (regenerateWith) |
| `useApiKeys` | API 金鑰加密儲存 |
| `useSecureLocalStorage` | 異步加密儲存 |
| `useAppSettings` | 應用設定、自訂模型、路由規則持久化 |
| `usePrompts` | Prompt 庫管理 |
| `useConversationSearch` | 全文搜尋 |
| `useGlobalSearch` | 跨對話/Prompt 搜尋 |

### 2.2 資料流向

```
User Input
    ↓
Composer (輸入區) → handleSend()
    ↓
ConversationWorkspace → generateAssistantReply()
    ↓
providers/index.ts → generateAssistantReply()
    ↓
Provider Registry → getProvider(platform)
    ↓
Specific Provider (chatgpt/claude/gemini/grok/local/custom)
    ↓
API Call (fetch + streaming)
    ↓
onChunk 回呼 → 即時更新 UI
    ↓
onComplete → 儲存到 ConversationContext
```

### 2.3 加密架構 (v1.0.0 起)

> **重大變更**: 移除主密碼機制，改為瀏覽器綁定隨機金鑰加密

```
Browser Session
    ↓
Web Crypto API: generateKey(AES-GCM, 256-bit, extractable: true)
    ↓
Export raw key → Base64 → localStorage["aihub-master-encryption-key"]
    ↓
AES-GCM (每筆資料獨立 IV + 隨機生成)
    ↓
Encrypted Blob (version + iv + ciphertext)
    ↓
localStorage / chrome.storage.local
```

**關鍵特性**:
- **零配置** - 使用者無需設定/記住任何密碼
- **瀏覽器綁定** - 金鑰生成於瀏覽器，換裝置/瀏覽器自動失效
- **資料安全** - AES-GCM 256-bit，每筆資料獨立 IV
- **向後相容** - 現有資料自動無縫遷移

**關鍵檔案**: `src/utils/secureStorage.ts`

---

## 3. 語言風格與程式碼規範

### 3.1 TypeScript 風格

#### 命名規範
| 類型 | 規範 | 範例 |
|------|------|------|
| **元件** | PascalCase | `ConversationWorkspace.tsx` |
| **Hook** | camelCase + `use` 前綴 | `useConversations.ts` |
| **類型/介面** | PascalCase | `Conversation`, `AIProvider` |
| **常數** | UPPER_SNAKE_CASE | `DEFAULT_ROUTING_RULES` |
| **函式** | camelCase | `generateAssistantReply()` |
| **私有方法** | `_` 前綴 | `_deriveKey()` |

### 3.2 React 組件風格

#### 函式式組件 + Hooks
```tsx
export default function ConversationWorkspace() {
  const { conversations, createConversation } = useConversationContext();
  const [page, setPage] = useState<Page>("conversation");
  
  const handleSend = useCallback(async (content: string) => {
    // ...
  }, []);
  
  return <div className="workspace">{/* JSX */}</div>;
}
```

#### 樣式風格
- **Inline Styles** 為主 (動態主題、條件式樣式)
- **CSS Variables** 用於主題色系
- **無 CSS-in-JS 库** (保持輕量)

---

## 4. 專案特定慣例

### 4.1 Provider 開發規範

新增 AI Provider 步驟：
1. 在 `src/providers/` 建立 `xxxProvider.ts`
2. 實作 `AIProvider` 介面
3. 在 `registry.ts` 註冊
4. 在 `constants/models.ts` 新增模型列表
5. 在 `data/aiPlatforms.ts` 新增平台資訊

### 4.2 加密儲存規範

```typescript
// 所有敏感資料必須使用 useSecureLocalStorage (無需密碼參數)
const [apiKeys, setApiKeys, isLoaded] = useSecureLocalStorage<ApiKeys>(
  "aihub-api-keys",
  {}
);

// 一般設定可用 useLocalStorage
const [settings, setSettings] = useLocalStorage<Settings>(
  "aihub-settings",
  defaultSettings
);
```

### 4.3 訊息格式

```typescript
interface Message {
  role: "user" | "assistant" | "system" | "error";
  content: string;
  timestamp: number;
  provider?: string;      // assistant 訊息專用
  model?: string;         // assistant 訊息專用
  isError?: boolean;      // 錯誤訊息標記
  regenerating?: boolean; // 重新生成中
  originalModel?: string;  // 原始模型（重新生成時保留）
}

### 4.4 支援的平台 (5 個內建 + 自訂)

| Platform | ID | 預設模型 | 串流 |
|----------|----|----------|------|
| ChatGPT | `chatgpt` | `gpt-5.6-sol` | SSE |
| Claude | `claude` | `sonnet-5` | SSE |
| Gemini | `gemini` | `gemini-flash-latest` | SSE (`alt=sse`) |
| Grok | `grok` | `grok-4.5` | SSE |
| Local (Ollama / LM Studio) | `local` | `local-model` | SSE |
| Custom | `custom:<id>` | 使用者指定 | SSE |

> v1.1.0 起 Ollama 與 LM Studio 合併為單一 `local` Provider，使用者於 Settings 切換 Base URL 即可。NVIDIA Nemotron 已移除。
```

---

## 5. 部署與發布流程

### 5.1 本地開發
```bash
npm install
npm run dev          # 啟動開發伺服器
npm run build        # 生產建構
npm run test         # 執行測試
npm run lint         # 程式碼檢查
```

### 5.2 Extension 開發
```bash
cd extension
npm install
npm run build        # 輸出到 dist/
# Chrome → 擴充功能 → 載入未封裝項目 → 選擇 dist/
```

### 5.3 發布檢查清單
- [ ] `npm run build` 成功
- [ ] `npm run test` 全通過
- [ ] `npm run lint` 0 errors
- [ ] Extension `dist/` 建構成功
- [ ] 截圖素材準備齊全 (store-assets/)
- [ ] 隱私權政策部署 (GitHub Pages)

---

## 6. 常見問題與解決方案

| 問題 | 解決方案 |
|------|----------|
| `host_permissions: <all_urls>` 審核不過 | 僅用於 AI API 直連，不存取網頁內容，提供權限說明文件 |
| Native Messaging 無法連線 | 確認 `install.py <extension_id>` 已執行，檢查 manifest 路徑 |
| 本機推理（Ollama / LM Studio）連線失敗 | 確認本地服務啟動，至 Settings → 本機服務端點檢查 Base URL（LM Studio 1234 / Ollama 11434） |
| 自訂模型「Failed to fetch」 | 多為 CORS 擋下（如 NVIDIA NIM 未開放 CORS）。網頁版請改用擴充功能版、OpenRouter 或本機服務。詳見 §2.1 CORS 限制 |
| Gemini API 回應為空 | 確認串流使用 `alt=sse` 參數 (v1.0.2 修復) |
| Reply with... 失敗 | `regenerateWith` 需用 `secureStorage.getItem` 解密讀取 (v1.0.2 修復) |
| 加密解密失敗 | 檢查瀏覽器是否支援 Web Crypto API，確認 localStorage 金鑰存在 |
| CI 失敗 | 檢查 Node 版本 (需 18+)、依賴安裝完整性 |

---

## 7. 關鍵檔案快速索引

| 功能 | 檔案路徑 |
|------|----------|
| 主入口 | `src/main.tsx` |
| 應用根組件 | `src/App.tsx` |
| Provider 註冊 | `src/providers/registry.ts` |
| Provider 統一入口 | `src/providers/index.ts` |
| ChatGPT Provider | `src/providers/chatgptProvider.ts` |
| Claude Provider | `src/providers/claudeProvider.ts` |
| Gemini Provider | `src/providers/geminiProvider.ts` |
| Grok Provider | `src/providers/grokProvider.ts` |
| Custom Provider | `src/providers/customProvider.ts` |
| Local Provider (Ollama / LM Studio) | `src/providers/localProvider.ts` |
| 加密核心 | `src/utils/secureStorage.ts` |
| 安全儲存 Hook | `src/hooks/useSecureLocalStorage.ts` |
| 對話狀態 | `src/context/ConversationContext.tsx` |
| API Keys 管理 | `src/hooks/useApiKeys.ts` |
| 設定管理 + 自訂模型 | `src/hooks/useAppSettings.ts` |
| 自訂模型 UI (新增 / 修改 / 移除) | `src/components/CustomModels.tsx` |
| 多模型回覆選擇列 (4 欄 + N/A) | `src/components/ReplyTargetBar.tsx` |
| 左側導航 (含自訂模型) | `src/components/Sidebar.tsx` |
| Extension Background | `extension/background/background.js` |
| Native Messaging Host | `extension/native-host/aihub_native_host.py` |
| Side Panel UI | `extension/src/sidepanel/App.tsx` |
| 隱私權政策 | `docs/privacy/index.html` |
| 路由規則 | `src/constants/routing.ts` |
| 平台定義 | `src/constants/platforms.ts` |
| 模型定義 | `src/constants/models.ts` |
| 平台資料 | `src/data/aiPlatforms.ts` |

---

## 8. 程式碼品質標準

- **TypeScript**: `strict: true`, 無 `any` 隱性使用
- **ESLint**: `react-hooks/exhaustive-deps` 嚴格模式
- **測試覆蓋**: 核心加密模組 100% 覆蓋 (10/10 測試通過)
- **Git 提交**: Conventional Commits 格式

---

## 9. 版本歷程與重大變更

### v1.1.0 (2026-07-18)
- ✅ 修復自訂模型 platform 無法選取與生效的問題（`isPlatform` → `isValidPlatformId`，全鏈路支援 `custom:<id>`）
- ✅ `useConversations` 4 處修正：normalizeConversation / createConversation / changeConversationPlatform / regenerateWith
- ✅ `regenerateWith` 對 custom 改從 `settings.customModels[customId].apiKey` 讀 API Key
- ✅ `ConversationWorkspace.handleSend` 統一 API Key 處理（custom 走 customModels，內建走 apiKeys）
- ✅ `Conversation.platform` 型別放寬為 string（含內建 Platform 與 `custom:<id>`）
- ✅ 刪除 NVIDIA Nemotron Provider
- ✅ 合併 Ollama + LM Studio 為單一 `local` Provider（OpenAI 相容 API）
  - 新增 `localProvider.ts`，刪除 `ollamaProvider.ts` + `lmstudioProvider.ts`
  - Settings 提供 Base URL 輸入框 + LM Studio (1234) / Ollama (11434) 快速 preset 按鈕
- ✅ `CustomModels.tsx` 支援「修改」按鈕（原僅新增 / 移除）：
  - 編輯模式保留原 model id（不破壞既有 Conversation 引用）
  - 移除前加確認對話框
- ✅ 修復 `customProvider` 「Failed to fetch」誤導訊息：分三種情況（缺 Key / 網路 CORS / HTTP 4xx-5xx）
- ✅ `customProvider` 加 endpoint 健全性檢查（空字串 / 非法 URL / 非 http(s) protocol）
- ✅ Settings → 自訂模型 加 CORS 限制黃色警示框（NVIDIA NIM 等未開放 CORS 之 API）
- ✅ **多模型同時回答（Sprint 16）**：
  - 對話框上方新增 4 個 AI 選擇欄（`ReplyTargetBar.tsx`）
  - 每個可選 N/A（不參與）或任一內建 / 自訂模型
  - 送出後所有非 N/A target 並行打 API，各自回覆加到對話裡
  - target state 持久化到 localStorage (`aihub-reply-targets`)
  - 路由規則命中時覆蓋多模型回覆（路由是更明確指令）

### v1.0.2 (2026-07-17)
- ✅ 實作 Grok Provider（xAI API，grok-4.5/grok-4，SSE 串流）
- ✅ 刪除 Perplexity / Copilot 平台
- ✅ 刪除 `unsupportedProvider.ts`（不再需要）
- ✅ 自訂模型完整整合（customProvider + Sidebar 顯示 + generateAssistantReply 支援 custom:<id>）
- ✅ CustomModels.tsx 新增 API Key 欄位
- ✅ Gemini 串流回應解析改用 SSE 格式（`alt=sse`）
- ✅ 修復 `regenerateWith` 加密讀取 bug（改用 `secureStorage.getItem` 解密）
- ✅ 修復 PromptLibrary gpt-5 無效 model id → gpt-5.6-sol
- ✅ 修復 PromptCard 編輯模式過時快照
- ✅ 修復 ConversationWorkspace 佈局問題
- ✅ 刪除死碼檔案 6 個（ImportExportBar/Header/AppHeader/apps.ts/browserWorkflow.ts/vite.config.example.ts）
- ✅ 路由規則全部更新至最新模型
- ✅ 重寫 README.md

### v1.0.1 (2026-07-16)
- ✅ 修復 Gemini API 模型名稱過期（gemini-1.5-flash → gemini-3.5-flash）
- ✅ 修復 localStorage 模型跨平台汙染（normalizeConversation model 驗證）
- ✅ 修復 handleSend、regenerateWith 模型驗證缺失
- ✅ 新增 NVIDIA Nemotron Provider 支援
- ✅ 更新 docs/ 文件同步

### v1.0.0 (2026-07-15)
- ✅ 移除主密碼機制，改為瀏覽器綁定隨機金鑰加密
- ✅ 修復 FirstTimeSetup.tsx TypeScript 類型收窄問題
- ✅ 修復 GlobalSearch.tsx ESLint exhaustive-deps 警告
- ✅ 更新所有截圖素材反映新版 Settings UI (無主密碼)
- ✅ 刪除 `src/components/ChangeMasterPassword.tsx`
- ✅ 簡化 `src/components/ResetAllData.tsx` (移除密碼驗證)
- ✅ 簡化 `src/components/FirstTimeSetup.tsx` (僅歡迎頁)
- ✅ Chrome Web Store 發布套件完整準備

---

*文件版本: 1.1.0 | 最後更新: 2026-07-18*  
*此文件應隨專案演進持續更新*

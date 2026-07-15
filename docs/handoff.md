# AIHub 專案交接文件

> **版本**: 1.0.0  
> **更新日期**: 2026-07-15  
> **專案狀態**: 生產就緒，可提交 Chrome Web Store 審核

---

## 1. 專案概覽

### 1.1 專案定位
AIHub 是一個**多 AI 聊天介面**，支援 ChatGPT、Claude、Gemini、Ollama、LM Studio 等多種 AI 提供商，整合 Model Context Protocol (MCP) 支援本地工具調用，採用**瀏覽器綁定端到端加密**儲存（無需主密碼）。

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

**實作**: `chatgptProvider.ts`, `claudeProvider.ts`, `geminiProvider.ts`, `ollamaProvider.ts`, `lmstudioProvider.ts`

**註冊**: `src/providers/registry.ts` - 統一管理所有 Provider

#### Context Pattern (狀態管理)
```typescript
// src/context/ConversationContext.tsx
export function ConversationProvider({ children }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // CRUD operations...
  return <ConversationContext.Provider value={{...}}>{children}</ConversationContext.Provider>;
}
```

**Context 列表**:
- `ConversationContext` - 對話 CRUD、搜尋、分支
- `AgentContext` - AI 代理人管理

#### Hook Pattern (邏輯復用)
| Hook | 用途 |
|------|------|
| `useConversations` | 對話 CRUD、搜尋、重新生成 |
| `useApiKeys` | API 金鑰加密儲存 |
| `useSecureLocalStorage` | 異步加密儲存 |
| `useAppSettings` | 應用設定持久化 |
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
Specific Provider (chatgpt/claude/gemini/ollama/lmstudio)
    ↓
API Call (fetch + streaming)
    ↓
onChunk 回呼 → 即時更新 UI
    ↓
onComplete → 儲存到 ConversationContext
```

### 2.3 **新版加密架構** (v1.0.0 重大變更)

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

**Hook 變更**:
```typescript
// 所有敏感資料使用 useSecureLocalStorage (無需密碼參數)
const [apiKeys, setApiKeys, isLoaded] = useSecureLocalStorage<ApiKeys>(
  "aihub-api-keys",
  {}
);

// 一般設定繼續使用 useLocalStorage
const [settings, setSettings] = useLocalStorage<Settings>(
  "aihub-settings",
  defaultSettings
);
```

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

#### 型別定義風格
```typescript
// 介面優於 type alias
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 聯合類型用於狀態
type Page = "conversation" | "prompt" | "settings";

// 泛型 Hook 回傳型別
function useLocalStorage<T>(key: string, initialValue: T): [
  T,
  (value: T | ((prev: T) => T)) => void,
  boolean
];
```

### 3.2 React 組件風格

#### 函式式組件 + Hooks
```tsx
export default function ConversationWorkspace() {
  const { conversations, createConversation } = useConversationContext();
  const [page, setPage] = useState<Page>("conversation");
  
  // 事件處理器使用 useCallback
  const handleSend = useCallback(async (content: string) => {
    // ...
  }, []);
  
  return (
    <div className="workspace">
      {/* JSX */}
    </div>
  );
}
```

#### 樣式風格
- **Inline Styles** 為主 (動態主題、條件式樣式)
- **CSS Variables** 用於主題色系
- **無 CSS-in-JS 库** (保持輕量)

```tsx
<div style={{
  display: "flex",
  height: "100vh",
  background: "#202123",
}}>
  <Sidebar />
  <main style={{ flex: 1, overflow: "auto", padding: 20 }}>
    {page === "conversation" && <ConversationWorkspace />}
  </main>
</div>
```

### 3.3 非同步處理

```typescript
// 統一使用 async/await
const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(params)
});

if (!response.ok) {
  const error = await response.json().catch(() => ({ error: "Unknown error" }));
  throw new Error(error.error ?? `HTTP ${response.status}`);
}

return response.json();
```

#### 串流處理
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = JSON.parse(line.slice(6));
      if (data.response) yield data.response;
    }
  }
}
```

### 3.4 錯誤處理

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  // 統一錯誤格式
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error"
  };
}
```

### 3.5 測試風格

```typescript
// Vitest + happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("secureStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should encrypt and decrypt data", async () => {
    const result = await encryptData("test-key", "secret");
    expect(result.success).toBe(true);
  });
});
```

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
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  provider?: string;      // assistant 訊息專用
  model?: string;         // assistant 訊息專用
  isError?: boolean;      // 錯誤訊息標記
}
```

### 4.4 路由/頁面狀態

```typescript
// App.tsx 使用單一 state 管理頁面
const [page, setPage] = useState<"conversation" | "prompt" | "settings">("conversation");
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
| Native Messaging 無法連線 | 確認 `install.py` 已執行，檢查 manifest 路徑 |
| Ollama/LM Studio 連線失敗 | 確認本地服務啟動，檢查端點 URL |
| **加密解密失敗** | **新架構：檢查瀏覽器是否支援 Web Crypto API，確認 localStorage 金鑰存在** |
| CI 失敗 | 檢查 Node 版本 (需 18+)、依賴安裝完整性 |

---

## 7. 關鍵檔案快速索引

| 功能 | 檔案路徑 |
|------|----------|
| 主入口 | `src/main.tsx` |
| 應用根組件 | `src/App.tsx` |
| Provider 註冊 | `src/providers/registry.ts` |
| **加密核心** | `src/utils/secureStorage.ts` |
| **安全儲存 Hook** | `src/hooks/useSecureLocalStorage.ts` |
| 對話狀態 | `src/context/ConversationContext.tsx` |
| API Keys 管理 | `src/hooks/useApiKeys.ts` |
| 設定管理 | `src/hooks/useAppSettings.ts` |
| Extension Background | `extension/background/background.js` |
| Native Messaging Host | `extension/native-host/aihub_native_host.py` |
| Side Panel UI | `extension/src/sidepanel/App.tsx` |
| 隱私權政策 | `docs/privacy/index.html` |

---

## 8. 程式碼品質標準

- **TypeScript**: `strict: true`, 無 `any` 隱性使用
- **ESLint**: `react-hooks/exhaustive-deps` 嚴格模式
- **測試覆蓋**: 核心加密模組 100% 覆蓋
- **Git 提交**: Conventional Commits 格式

---

## 9. 版本歷程與重大變更

### v1.0.0 (2026-07-15)
- ✅ 移除主密碼機制，改為瀏覽器綁定隨機金鑰加密
- ✅ 修復 FirstTimeSetup.tsx TypeScript 類型收窄問題
- ✅ 修復 GlobalSearch.tsx ESLint exhaustive-deps 警告
- ✅ 更新所有截圖素材反映新版 Settings UI (無主密碼)
- ✅ 刪除 `src/pages/Home.tsx` 與空 `src/pages/` 目錄
- ✅ 刪除 `src/components/ChangeMasterPassword.tsx`
- ✅ 簡化 `src/components/ResetAllData.tsx` (移除密碼驗證)
- ✅ 簡化 `src/components/FirstTimeSetup.tsx` (僅歡迎頁)
- ✅ 更新 `src/hooks/useApiKeys.ts` 移除 `reEncryptApiKeys`
- ✅ 更新 `src/hooks/useSecureLocalStorage.ts` 移除密碼參數
- ✅ Chrome Web Store 發布套件完整準備

---

*文件版本: 1.0.0 | 最後更新: 2026-07-15*  
*此文件應隨專案演進持續更新*
# AIHub Chrome Web Store 提交套件

## 📦 套件內容

```
chrome-web-store-package/
├── aihub-extension.zip          # 擴充功能打包檔 (98KB)
├── screenshot-main.png          # 主要聊天介面 (1280x800)
├── screenshot-mcp.png           # MCP 服務管理 (1280x800)
├── screenshot-compare.png       # Compare View (1280x800)
├── screenshot-tools.png         # 工具調用面板 (1280x800)
├── screenshot-settings.png      # 設定與安全性 (1280x800)
├── promo-tile-440x280.png       # 小圖磚 (440x280)
├── promo-banner-1400x560.png    # 大橫幅 (1400x560)
└── README.md                    # 本文件
```

## 🎯 Chrome Web Store 提交清單

### 必要資訊

| 項目 | 內容 | 狀態 |
|------|------|------|
| **擴充功能名稱** | AIHub | ✅ |
| **簡短描述** (132字) | 多 AI 聊天介面：ChatGPT、Claude、Gemini、Ollama、LM Studio，支援 MCP 工具整合、端到端加密、本地模型優先 | ✅ |
| **詳細描述** | 見下方 | ✅ |
| **類別** | 生產力工具 | ✅ |
| **語言** | 繁體中文、英文 | ✅ |

### 詳細描述 (建議)

```
AIHub - 多 AI 聊天介面

🤖 多模型支援
• ChatGPT (GPT-4o, GPT-4o-mini, GPT-4 Turbo)
• Claude (Sonnet 3.5, Haiku 3.5, Opus 3)
• Gemini (1.5 Pro, 1.5 Flash, 1.0 Pro)
• Ollama 本地模型 (Llama 3.1/3.2, Qwen 2.5, Mistral, CodeLlama)
• LM Studio 本地模型 (OpenAI 相容 API)

🔒 企業級安全
• AES-256-GCM 認證加密
• PBKDF2 (100,000 迭代) 金鑰派生
• 裝置指紋 + 主密碼雙因子派生
• 主密碼不落地，僅記憶體驗證

🔧 MCP (Model Context Protocol) 整合
• SSE (Server-Sent Events) 遠端伺服器
• STDIO 本地進程 (透過 Native Messaging)
• 支援 filesystem、github、postgres、sqlite 等工具
• 視覺化工具調用面板與結果渲染

⚡ 進階功能
• Compare View：多模型並行比較，一鍵選為最佳
• 智能路由：@claude /code /write 前綴自動導向
• 會話管理：搜尋、分支、重新生成、匯出
• 首次啟動引導：4 步驟設定主密碼與 API Keys

🏠 本地優先
• 完全離線運作 (Ollama/LM Studio)
• 零資料上傳至我們伺服器
• 所有資料本地加密儲存
```

### 隱私權政策連結
```
https://samaiai873-sudo.github.io/AIHub/
```

### 圖片規格檢查

| 圖片 | 尺寸 | 檔案大小 | 狀態 |
|------|------|----------|------|
| 小圖磚 | 440x280 | 76KB | ✅ |
| 大橫幅 | 1400x560 | 856KB | ✅ |
| 截圖 1 | 1280x800 | 228KB | ✅ |
| 截圖 2 | 1280x800 | 196KB | ✅ |
| 截圖 3 | 1280x800 | 198KB | ✅ |
| 截圖 4 | 1280x800 | 172KB | ✅ |
| 截圖 5 | 1280x800 | 132KB | ✅ |

### 權限說明 (給審核團隊)

| 權限 | 用途 | 必要性 |
|------|------|--------|
| `sidePanel` | 側邊欄聊天介面 | 必要 |
| `storage` | 本地加密儲存設定、歷史 | 必要 |
| `activeTab` | 右鍵選單分析選取文字 | 必要 |
| `scripting` | 注入內容腳本取得選取文字 | 必要 |
| `contextMenus` | 建立右鍵選單 | 必要 |
| `tabs` | 快捷鍵開啟面板、取得頁面資訊 | 必要 |
| `nativeMessaging` | MCP STDIO 本地進程通訊 | 選用 |
| `host_permissions: <all_urls>` | 直接呼叫 AI API 端點 | 必要 |

> **說明**：`host_permissions: <all_urls>` 僅用於直接連線 OpenAI/Anthropic/Google/Ollama/LM Studio API 端點，**不**存取、讀取或修改使用者瀏覽的網頁內容。

### 版本資訊
- **版本**：1.0.0
- **Manifest 版本**：3
- **最低 Chrome 版本**：88+

---

## 🚀 提交步驟

1. 登入 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 點擊「新增項目」
3. 上傳 `aihub-extension.zip`
4. 填寫上述資訊
5. 上傳截圖與宣傳圖
6. 設定隱私權政策連結
7. 選擇「公開」或「不公開」
7. 提交審核

---

## 📝 審核常見問題預判

| 問題 | 回應策略 |
|------|----------|
| `host_permissions: <all_urls>` 過寬 | 僅用於 AI API 直連，不存取網頁內容，提供權限說明文件 |
| `nativeMessaging` 用途 | 僅用於 MCP STDIO，提供原始碼供審核 |
| 資料安全性 | AES-GCM + PBKDF2，提供加密實作細節 |
| 隱私權政策 | 已部署至 GitHub Pages |

---

## 📞 聯絡資訊

- **開發者**：AIHub Team
- **GitHub**：https://github.com/samaiai873-sudo/AIHub
- **Issues**：https://github.com/samaiai873-sudo/AIHub/issues
- **Email**：[您的聯絡信箱]

---

*套件建立時間：2026-07-15*
*AIHub v1.0.0*
# AIHub 隱私權政策

**最後更新日期：2026年7月15日**

---

## 1. 簡介

歡迎使用 AIHub（「我們」、「本擴充功能」或「擴充功能」）。AIHub 是一個多 AI 聊天介面瀏覽器擴充功能，支援 ChatGPT、Claude、Gemini、Ollama、LM Studio 等多種 AI 提供商，並整合 Model Context Protocol (MCP) 以支援本地工具調用。

本隱私權政策說明我們如何收集、使用、儲存和保護您的資料。使用本擴充功能即表示您同意本政策的條款。

---

## 2. 資料收集與使用

### 2.1 我們**不**收集的資料

- ❌ **不收集** 個人身分資訊 (姓名、電子郵件、電話等)
- ❌ **不收集** 聊天內容、提示詞、AI 回覆
- ❌ **不收集** API 金鑰內容
- ❌ **不收集** 瀏覽歷史、Cookies、網站資料
- ❌ **不傳送** 任何資料到我們的伺服器 (我們沒有伺服器)
- ❌ **不使用** 追蹤器、分析工具、廣告 ID

### 2.2 本地儲存的資料 (僅存在您的裝置)

以下資料**僅儲存在您的瀏覽器本地** (`chrome.storage.local`)：

| 資料類型 | 用途 | 加密狀態 |
|----------|------|----------|
| API 金鑰 | 調用 AI 提供商 API | ✅ AES-GCM + PBKDF2 加密 |
| 對話歷史 | 顯示歷史聊天記錄 | ✅ 加密 |
| 設定偏好 | 模型選擇、主題、語言等 | ✅ 加密 |
| MCP 伺服器配置 | 連線本地工具伺服器 | ✅ 加密 |
| 主密碼驗證資訊 | 解鎖加密儲存 | ✅ PBKDF2 (100,000 迭代) |

### 2.3 網路請求說明

本擴充功能會發起以下網路請求，**僅直接連線至您選擇的 AI 提供商**：

| 目標 | 用途 | 資料傳輸 |
|------|------|----------|
| `api.openai.com` | ChatGPT API | 您的提示詞 + API Key (標頭) |
| `api.anthropic.com` | Claude API | 您的提示詞 + API Key (標頭) |
| `generativelanguage.googleapis.com` | Gemini API | 您的提示詞 + API Key (查詢參數) |
| `localhost:11434` | Ollama 本地服務 | 您的提示詞 (無 API Key) |
| `localhost:1234` | LM Studio 本地服務 | 您的提示詞 (無 API Key) |
| 您設定的 MCP SSE 端點 | MCP 伺服器連線 | 工具調用參數/結果 |

> **重要**：所有 API 金鑰**永不離開您的瀏覽器**，我們無法存取、查看或記錄您的金鑰。

---

## 3. 資料安全

### 3.1 加密機制

- **演算法**：AES-GCM (256-bit 金鑰)
- **金鑰衍生**：PBKDF2 (SHA-256, 100,000 次迭代)
- **鹽值**：每筆資料獨立隨機產生 (16 bytes)
- **初始向量**：每次加密獨立隨機產生 (12 bytes)
- **裝置綁定**：金鑰衍生包含瀏覽器指紋 (User Agent + 螢幕解析度 + 時區 + 語言)

### 3.2 主密碼保護

- 首次使用需設定主密碼 (最少 8 字元)
- 主密碼**不儲存**，僅在記憶體中驗證
- 支援修改主密碼 (需驗證舊密碼)
- 忘記密碼可透過「重置所有資料」功能清除 (需輸入確認文字)

---

## 4. 權限說明

| 權限 | 必要性 | 用途說明 |
|------|--------|----------|
| `sidePanel` | 必要 | 提供側邊欄聊天介面 |
| `storage` | 必要 | 本地加密儲存設定與歷史 |
| `activeTab` | 必要 | 右鍵選單分析當前頁面選取文字 |
| `scripting` | 必要 | 注入內容腳本取得選取文字 |
| `contextMenus` | 必要 | 建立右鍵選單 (分析/總結/翻譯) |
| `tabs` | 必要 | 快捷鍵開啟面板、取得頁面標題/網址 |
| `nativeMessaging` | 選用 | MCP STDIO 連線本地伺服器 |
| `host_permissions: <all_urls>` | 必要 | 直接呼叫各 AI 提供商 API 端點 |

> **注意**：`host_permissions: <all_urls>` 僅用於直接連線 AI API 端點，我們**不**存取、讀取或修改您瀏覽的網頁內容。

---

## 5. 本地模型支援 (Ollama / LM Studio)

- 連線至 `http://localhost:11434` (Ollama) 或 `http://localhost:1234` (LM Studio)
- **完全離線運作**，無任何資料傳送至外部伺服器
- 模型列表從本地 API 取得 (`/api/tags` 或 `/v1/models`)
- 無需註冊帳號、無需 API 金鑰

---

## 6. MCP (Model Context Protocol) 整合

- 支援 **SSE** (Server-Sent Events) 遠端伺服器
- 支援 **STDIO** (標準輸入/輸出) 本地進程 (透過 Native Messaging Host)
- 工具調用參數與結果**僅在您的裝置處理**
- Native Messaging Host 為開源 Python 腳本，可自行審核編譯

---

## 7. 資料保留與刪除

| 操作 | 結果 |
|------|------|
| 刪除對話 | 僅移除該對話，其他資料保留 |
| 修改主密碼 | 重新加密所有資料 (不遺失資料) |
| 重置所有資料 | **永久清除** 所有本地儲存 (需輸入「RESET ALL DATA」確認) |
| 移除擴充功能 | 瀏覽器自動清除 `chrome.storage.local` 所有資料 |

---

## 8. 兒童隱私

本擴充功能不針對 13 歲以下兒童設計，不會主動收集兒童個人資料。

---

## 9. 國際資料傳輸

您的資料**不會**傳輸至我們的伺服器。AI API 呼叫直接連線至各提供商位於美國/全球的伺服器，請參閱各提供商隱私權政策：
- [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy)
- [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- [Google Privacy Policy](https://policies.google.com/privacy)

---

## 10. 您的權利

依據 GDPR、CCPA 及相關法規，您擁有：
- ✅ 存取權：檢視本地儲存的所有資料 (開發者工具 → Application → Local Storage)
- ✅ 更正權：隨時修改設定、API 金鑰
- ✅ 刪除權：使用「重置所有資料」功能
- ✅ 可攜權：匯出對話歷史 (JSON 格式)
- ✅ 限制處理：停用擴充功能即停止所有處理

---

## 11. 開源透明化

- **原始碼**：[GitHub - samaiai873-sudo/AIHub](https://github.com/samaiai873-sudo/AIHub)
- **授權**：MIT License
- **Native Messaging Host**：`extension/native-host/aihub_native_host.py` (可自行編譯驗證)

歡迎提交 Issue、PR 或進行安全性審計。

---

## 12. 政策變更

本政策如有變更，將在擴充功能更新時通知您，並更新「最後更新日期」。重大變更將要求您重新確認同意。

---

## 13. 聯絡我們

如有任何隱私權相關問題，請透過以下管道聯絡：

- **GitHub Issues**：[提交問題](https://github.com/samaiai873-sudo/AIHub/issues)
- **Email**：privacy@aihub.example.com (範例信箱，請替換為實際聯絡資訊)

---

## 14. 免責聲明

本擴充功能按「現狀」提供，不保證不中斷、無錯誤或完全安全。使用 AI 服務時請注意：
- 請勿輸入敏感個人資料 (身分證字號、信用卡號、密碼等)
- AI 回覆可能包含錯誤資訊，請自行驗證
- 本地模型品質取決於您的硬體與模型選擇

---

*本隱私權政策採用繁體中文 (台灣) 撰寫，如有翻譯差異以中文版為準。*
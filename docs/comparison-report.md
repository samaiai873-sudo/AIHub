# AIHub 模型比對報告

> **日期**: 2026-07-16  
> **目的**: 確認各 AI 平台官方 API 最新模型名稱與程式碼一致，不一致則更新

---

## 各平台對照表

### 1. OpenAI / ChatGPT

| 項目 | 說明 |
|------|------|
| **官方最新模型** | `gpt-5.6-sol` (alias `gpt-5.6`), `gpt-5.6-terra`, `gpt-5.6-luna` |
| **程式現有模型** | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| **差異** | OpenAI 已推出 GPT-5.6 系列，但 gpt-4o 系列仍可使用 |
| **行動** | ✅ 保留既有 + 新增 gpt-5.6 系列 |

**mapping**:
```
UI id → API model
"gpt-5.6-sol"  → "gpt-5.6-sol"
"gpt-5.6-terra" → "gpt-5.6-terra"
"gpt-5.6-luna"  → "gpt-5.6-luna"
```

**變更檔案**: `aiPlatforms.ts`, `constants/models.ts`, `chatgptProvider.ts`

---

### 2. Anthropic / Claude

| 項目 | 說明 |
|------|------|
| **官方最新模型** | `claude-opus-4-8`, `claude-sonnet-5`, `claude-haiku-4-5`, `claude-fable-5` |
| **程式現有模型** | `sonnet-3.5` → `claude-3-5-sonnet-20241022`<br>`haiku-3.5` → `claude-3-5-haiku-20241022`<br>`opus-3` → `claude-3-opus-20240229` |
| **差異** | Anthropic 已推出 Claude Opus 4.8、Sonnet 5、Haiku 4.5、Fable 5 |
| **行動** | ✅ 保留既有 + 新增最新系列 |

**mapping**:
```
UI id → API model
"opus-4"   → "claude-opus-4-8"
"sonnet-5" → "claude-sonnet-5"
"haiku-4"  → "claude-haiku-4-5-20251001"
```

**變更檔案**: `aiPlatforms.ts`, `constants/models.ts`, `claudeProvider.ts`

---

### 3. Google Gemini

| 項目 | 說明 |
|------|------|
| **官方最新模型** | `gemini-3.5-flash` (stable)、`gemini-3.1-flash-lite` (stable)<br>`gemini-3.1-pro` (preview)、`gemini-2.5-flash`、`gemini-2.5-pro` |
| **程式現有模型** | `gemini-flash-latest`、`gemini-pro-latest`、`gemini-2.5-flash`、`gemini-2.5-pro` |
| **差異** | Gemini 3 系列已推出；2.5 系列仍可使用<br>上次已修正 `gemini-flash-latest` → `gemini-1.5-flash` |
| **行動** | ✅ 保留既有 + 新增 Gemini 3 系列 |

**mapping**:
```
UI id → API model
"gemini-3.5-flash"     → "gemini-3.5-flash"
"gemini-3.1-flash-lite" → "gemini-3.1-flash-lite"
```

**變更檔案**: `aiPlatforms.ts`, `constants/models.ts`

---

### 4. NVIDIA Nemotron

| 項目 | 說明 |
|------|------|
| **官方最新模型** | `nemotron-3-ultra-550b-a55b`、`nemotron-4-340b`、`nemotron-3-8b` 等 |
| **程式現有模型** | `nemotron-3-ultra`、`nemotron-4-340b`、`nemotron-3-8b` |
| **差異** | **無差異** ✅ 名稱正確，不需修改 |
| **行動** | 不需變更 |

---

## 總結：需變更檔案清單

| 檔案 | 修改內容 |
|------|---------|
| `src/data/aiPlatforms.ts` | 各平台新增最新型號選項 |
| `src/constants/models.ts` | 對應更新 `SUPPORTED_MODELS` + `DEFAULT_MODELS` |
| `src/providers/chatgptProvider.ts` | 新增 gpt-5.6 系列 API mapping |
| `src/providers/claudeProvider.ts` | 新增 opus-4/sonnet-5/haiku-4 API mapping |
| `src/providers/geminiProvider.ts` | 新增 gemini-3 系列 API mapping (上次已修正 1.5 系列) |
| `docs/comparison-report.md` | 本文件 |

---

*報告完畢，下一步：執行程式碼編輯 → 驗證 → 推送 GitHub/Vercel*
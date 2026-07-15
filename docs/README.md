# AIHub 專案文件索引

## 📁 文件結構

```
docs/
├── handoff.md              # 專案交接文件 (架構、風格、規範)
├── privacy/                # 隱私權政策
│   ├── index.html          # HTML 版本 (GitHub Pages 部署)
│   └── policy.md           # Markdown 版本 (原始內容)
└── README.md               # 本文件
```

## 📋 文件說明

### handoff.md
完整的專案交接文件，包含：
- 專案架構概覽
- 核心設計模式 (Provider/Context/Hook Pattern)
- 語言風格與程式碼規範 (TypeScript/React/Testing)
- 專案特定慣例
- 部署與發布流程
- 關鍵檔案快速索引
- **版本歷程與重大變更** (v1.0.0: 移除主密碼、TypeScript 衝突修復等)

### privacy/
隱私權政策文件，符合 Chrome Web Store 審核要求：
- **index.html**: 可直接部署到 GitHub Pages 的完整 HTML 版本
- **policy.md**: Markdown 版本，方便維護與版本控制

內容涵蓋：
- 資料收集與使用說明
- **瀏覽器綁定加密儲存機制** (AES-GCM + Web Crypto API，無主密碼)
- 權限說明表格
- 本地模型支援說明
- MCP 整合說明
- 資料保留與刪除機制
- 使用者權利 (GDPR/CCPA)
- 開源透明化資訊

---

## 🔗 相關連結

- **專案倉庫**: https://github.com/samaiai873-sudo/AIHub
- **GitHub Pages**: https://samaiai873-sudo.github.io/AIHub/ (隱私權政策)
- **Chrome Web Store**: 待提交
- **Issues**: https://github.com/samaiai873-sudo/AIHub/issues

---

## 🏗️ 專案現狀 (v1.0.0)

| 項目 | 狀態 | 備註 |
|------|------|------|
| **核心功能** | ✅ 完成 | 6 AI Providers, Context/Hook 三層架構 |
| **加密系統** | ✅ 完成 | 瀏覽器綁定 AES-GCM (無主密碼) |
| **MCP 整合** | ✅ 完成 | SSE + STDIO 雙協定 |
| **Extension MV3** | ✅ 完成 | Side Panel + Context Menu + Native Messaging |
| **單元測試** | ✅ 完成 | 10/10 通過 (secureStorage 100%) |
| **CI/CD** | ✅ 完成 | GitHub Actions (lint + typecheck + build + test) |
| **隱私權政策** | ✅ 完成 | GitHub Pages 部署就緒 |
| **Chrome Web Store** | ✅ 準備完成 | store-assets/chrome-web-store-package/ |

---

*最後更新: 2026-07-15*
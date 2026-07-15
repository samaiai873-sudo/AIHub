# Chrome Web Store 截圖素材

## 檔案清單

| 檔案 | 尺寸 | 用途 | 說明 |
|------|------|------|------|
| `screenshot-main.html` | 1280x800 | 主要聊天介面 | 展示對話列表、模型選擇、MCP 面板、代碼高亮 |
| `screenshot-mcp.html` | 1280x800 | MCP 服務管理 | 展示 SSE/STDIO 雙協定、狀態指示、工具計數、新增/編輯 Modal |
| `screenshot-compare.html` | 1280x800 | Compare View | 三模型並行比較、選為最佳、匯出功能 |
| `screenshot-tools.html` | 1280x800 | 工具調用面板 | Filesystem 工具調用、JSON 參數、結果渲染 |
| `screenshot-settings.html` | 1280x800 | 設定頁面 | API Keys、Ollama/LM Studio 端點、主密碼修改、重置資料 |
| `promo-tile-440x280.html` | 440x280 | 商店小圖磚 | 橫幅推廣圖 |
| `promo-banner-1400x560.html` | 1400x560 | 商店大橫幅 | 完整功能展示橫幅 |

## 使用方式

### 方法一：瀏覽器截圖（推薦）

1. 在瀏覽器開啟 `.html` 檔案
2. 將瀏覽器視窗調整為對應尺寸
3. 使用瀏覽器內建截圖工具或系統截圖工具
4. 儲存為 PNG 格式

### 方法二：自動化截圖 (Puppeteer/Playwright)

```bash
# 安裝 puppeteer
npm install puppeteer

# 建立截圖腳本
```

### 方法三：Chrome DevTools 截圖

1. 開啟 DevTools (F12)
2. 點擊左上角裝置工具列圖示 (Ctrl+Shift+M)
2. 設定自訂尺寸 (1280x800)
3. 右鍵頁面 → "Capture screenshot"

## Chrome Web Store 規範

### 必須提供
- ✅ **至少 1 張截圖** (1280x800 或 640x400)
- ✅ **小圖磚** 440x280 (JPG/PNG)
- ✅ **大宣傳圖** 1400x560 (JPG/PNG)

### 建議提供
- 📱 **3-5 張截圖** 展示核心功能
- 🎨 **統一風格** (深色主題、一致的配色)
- 📝 **標註關鍵功能** (可在圖片上加文字說明)

## 截圖內容建議

| 截圖 | 核心展示重點 |
|------|-------------|
| 1. 主介面 | 模型選擇器、對話列表、代碼高亮、MCP 圖示 |
| 2. MCP 面板 | SSE/STDIO 徽章、狀態點(綠/紅)、工具數量、新增 Modal |
| 3. Compare View | 三模型並行、選為最佳按鈕、匯出按鈕 |
| 4. 工具調用 | JSON 參數編輯器、執行按鈕、結果渲染(文字/JSON/圖片) |
| 5. 設定頁 | API Keys 蒙版、端點設定、主密碼修改、重置確認 |

## 檔名命名建議

```
screenshot-1-main-chat.png
screenshot-2-mcp-panel.png
screenshot-3-compare-view.png
screenshot-4-tool-invocation.png
screenshot-5-settings.png
promo-tile-440x280.png
promo-banner-1400x560.png
```

## 顏色配置參考

```css
/* 深色主題 */
--bg-primary: #1e1e1e;
--bg-secondary: #252525;
--bg-tertiary: #2d2d2d;
--border: #333;
--primary: #2d7ef7;
--primary-hover: #1a6de0;
--success: #22c55e;
--error: #ef4444;
--warning: #f59e0b;
--text-primary: #fff;
--text-secondary: #aaa;
--text-muted: #666;
```

## 注意事項

1. **隱藏敏感資訊** - API Keys 使用蒙版 (sk-****)
2. **展示真實功能** - 不要用佔位符內容
3. **多語言考量** - 介面為繁體中文，符合台灣/香港市場
4. **無障礙** - 確保對比度足夠
3. **品牌一致性** - Logo、配色、字體統一

## 部署後驗證

上傳到 Chrome Web Store Developer Dashboard 後：
- [ ] 截圖在商店頁面正確顯示
- [ ] 小圖磚在搜尋結果清晰可見
- [ ] 大橫幅在詳情頁完整顯示
- [ ] 文字可讀性良好
- [ ] 無敏感資訊洩露
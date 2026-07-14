import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 這是範例檔案，請把 server.proxy 的部分合併進你專案原本的
// vite.config.ts，不要整份覆蓋掉（你原本的 plugins、resolve.alias
// 等設定要保留）。

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // 開發模式下，前端打 /api/openai/... 會被轉發到 https://api.openai.com/...
      // 因為是 Vite 這個 Node server 幫忙轉發，不受瀏覽器 CORS 限制，
      // 前端還是要自己帶 Authorization header（API Key），Key 本身不會經過任何第三方。
      "/api/openai": {
        target: "https://api.openai.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ""),
      },
    },
  },
});

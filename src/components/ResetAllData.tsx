import useApiKeys from "../hooks/useApiKeys";
import { isSecureStorageAvailable } from "../utils/secureStorage";

export default function ResetAllData() {
  const { apiKeys } = useApiKeys();

  const hasApiKeys = Object.keys(apiKeys).length > 0;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Confirm action
    if (window.confirm("⚠️ 警告：此操作將永久刪除所有 API Keys、對話記錄、Prompt Library 等所有資料！\n\n此操作無法復原，確定要繼續嗎？")) {
      if (!isSecureStorageAvailable()) {
        alert("當前瀏覽器不支援加密存儲功能");
        return;
      }

      try {
        // Clear all localStorage data
        localStorage.clear();

        // Also clear any other app-related localStorage keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("aihub-") || key.startsWith("aihub_"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        alert("所有資料已重置完成。頁面將重新載入。");
        window.location.reload();
      } catch (error) {
        alert("重置失敗：" + (error instanceof Error ? error.message : "未知錯誤"));
      }
    }
  };

  if (!hasApiKeys) {
    return (
      <div style={{ padding: 16, textAlign: "center", color: "#888" }}>
        尚未設定任何 API Key，無需重置資料。
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ padding: 12, background: "#4d1a1a", border: "1px solid #c62828", borderRadius: 8, marginBottom: 16 }}>
        <strong style={{ color: "#ef9a9a" }}>⚠️ 危險操作警告</strong>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#ef9a9a" }}>
          此操作將永久刪除所有資料，包括：
        </p>
        <ul style={{ margin: "8px 0", paddingLeft: 20, fontSize: 13, color: "#ef9a9a" }}>
          <li>所有 API Keys (ChatGPT, Claude, Gemini 等)</li>
          <li>所有對話記錄</li>
          <li>所有 Prompt Library 項目</li>
          <li>所有設定與偏好設定</li>
        </ul>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#ef9a9a" }}>
          <strong>此操作不可復原，請三思後再行動。</strong>
        </p>
      </div>

      <button
        type="submit"
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px solid #c62828",
          background: "#c62828",
          color: "white",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        🗑️ 確認重置所有資料
      </button>
    </form>
  );
}
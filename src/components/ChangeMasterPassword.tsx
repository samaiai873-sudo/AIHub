import { useState, useCallback } from "react";
import useApiKeys from "../hooks/useApiKeys";
import { secureStorage, reEncryptAll } from "../utils/secureStorage";
import { isSecureStorageAvailable } from "../utils/secureStorage";

export default function ChangeMasterPassword() {
  const { apiKeys } = useApiKeys();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const hasApiKeys = Object.keys(apiKeys).length > 0;

  // Password strength calculation
  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: "", color: "#555" };
    
    let score = 0;
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { score, label: "弱", color: "#c62828" };
    if (score <= 4) return { score, label: "中等", color: "#f57c00" };
    return { score, label: "強", color: "#2e7d32" };
  };

  const newPasswordStrength = getPasswordStrength(newPassword);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setMessage("");

    // Validate
    if (!oldPassword) {
      setStatus("error");
      setMessage("請輸入目前的主密碼");
      return;
    }
    if (!newPassword) {
      setStatus("error");
      setMessage("請輸入新的主密碼");
      return;
    }
    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("新密碼長度至少 8 碼");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("兩次輸入的新密碼不一致");
      return;
    }
    if (oldPassword === newPassword) {
      setStatus("error");
      setMessage("新密碼不能與舊密碼相同");
      return;
    }

    // Check if secure storage is available
    if (!isSecureStorageAvailable()) {
      setStatus("error");
      setMessage("當前瀏覽器不支援加密存儲功能");
      return;
    }

    setStatus("loading");
    setMessage("正在重新加密 API Keys...");

    try {
      // Attempt to re-encrypt with new password
      // First verify old password works by trying to decrypt
      const testKey = Object.keys(apiKeys)[0];
      if (testKey) {
        // Try to access secure storage with old password
        // This will fail if old password is wrong
        const testResult = await secureStorage.getItem("aihub-api-keys", oldPassword);
        if (testResult === null && localStorage.getItem("aihub-api-keys")) {
          throw new Error("舊密碼錯誤，無法解密現有資料");
        }
      }

      // Re-encrypt all data with new password
            await reEncryptAll(oldPassword, newPassword);
      
      setStatus("success");
      setMessage("主密碼修改成功！所有 API Key 已重新加密。");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "修改密碼失敗，請稍後再試"
      );
    }
  }, [oldPassword, newPassword, confirmPassword, apiKeys]);

  if (!hasApiKeys) {
    return (
      <div style={{ padding: 16, textAlign: "center", color: "#888" }}>
        尚未設定任何 API Key，無需設定主密碼。
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
          目前主密碼
        </label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="輸入目前主密碼"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #555",
            background: "#1e1e1e",
            color: "white",
            boxSizing: "border-box",
          }}
          autoComplete="current-password"
        />
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888" }}>
          忘記主密碼？請至 Settings 頁面底部使用「重置所有資料」功能（將永久刪除所有資料）。
        </p>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
          新主密碼
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="輸入新主密碼 (至少 8 碼)"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #555",
            background: "#1e1e1e",
            color: "white",
            boxSizing: "border-box",
          }}
          autoComplete="new-password"
          minLength={8}
        />
        {/* Password Strength Indicator */}
        {newPassword && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
              <span>密碼強度: {newPasswordStrength.label}</span>
              <span style={{ color: newPasswordStrength.color }}>{newPasswordStrength.score}/5</span>
            </div>
            <div style={{ height: 6, background: "#333", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${(newPasswordStrength.score / 5) * 100}%`,
                  height: "100%",
                  background: newPasswordStrength.color,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
          確認新密碼
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="再次輸入新密碼"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #555",
            background: "#1e1e1e",
            color: "white",
            boxSizing: "border-box",
          }}
          autoComplete="new-password"
          minLength={8}
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: status === "loading" ? "#555" : "#2d7ef7",
          color: "white",
          fontWeight: 600,
          fontSize: 14,
          cursor: status === "loading" ? "not-allowed" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
        }}
      >
        {status === "loading" ? "加密中..." : "確認修改"}
      </button>

      {message && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            fontSize: 13,
            background: status === "success" ? "#1a4d2e" : status === "error" ? "#4d1a1a" : "#2d2d2d",
            border: `1px solid ${status === "success" ? "#2e7d32" : status === "error" ? "#c62828" : "#444"}`,
            color: status === "success" ? "#81c784" : status === "error" ? "#ef9a9a" : "#ccc",
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}
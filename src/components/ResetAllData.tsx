import { useState } from "react";

export default function ResetAllData() {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (confirmText !== "RESET ALL DATA") {
      setError("請輸入 \"RESET ALL DATA\" 確認");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Reload the page to reset all state
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset data:", error);
      setError("重置失敗，請重試");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowConfirm(!showConfirm)}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid #e74c3c",
          background: showConfirm ? "#c0392b" : "transparent",
          color: "white",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        {showConfirm ? "取消" : "🗑️ 重置所有資料"}
      </button>

      {showConfirm && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: "#aaa", fontSize: 13, marginBottom: 8 }}>
            輸入 <code style={{ color: "#f87171" }}>RESET ALL DATA</code> 確認刪除所有資料
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setError("");
            }}
            placeholder="輸入 RESET ALL DATA 確認"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "#1a1a1a",
              color: "white",
              fontSize: 14,
              boxSizing: "border-box",
              marginBottom: 12,
              fontFamily: "monospace",
            }}
          />
          <button
            onClick={handleReset}
            disabled={isLoading || confirmText !== "RESET ALL DATA"}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: confirmText === "RESET ALL DATA" && !isLoading ? "#c0392b" : "#444",
              color: "white",
              cursor: confirmText === "RESET ALL DATA" && !isLoading ? "pointer" : "not-allowed",
              fontWeight: 500,
            }}
          >
            {isLoading ? "重置中..." : "確認刪除"}
          </button>
          {error && (
            <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
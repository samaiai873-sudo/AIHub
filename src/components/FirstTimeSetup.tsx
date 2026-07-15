import { useState } from "react";

interface FirstTimeSetupProps {
  onComplete: () => void;
}

export default function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [step, setStep] = useState<"welcome" | "complete">("welcome");

  const handleStart = () => {
    setStep("complete");
  };

  const handleComplete = () => {
    onComplete();
  };

  if (step === "complete") {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ marginBottom: 8 }}>歡迎使用 AIHub！</h2>
        <p style={{ color: "#aaa", marginBottom: 24 }}>
          您的資料將自動綁定此瀏覽器並加密保護，無需設定主密碼
        </p>
        <div style={{ 
          padding: 12, 
          background: "rgba(45, 126, 247, 0.1)", 
          border: "1px solid #2d7ef7",
          borderRadius: 8,
          maxWidth: 320,
          margin: "0 auto"
        }}>
          <p style={{ fontSize: 13, color: "#818cf8" }}>
            💡 API Keys、對話記錄、設定皆會自動加密儲存
          </p>
        </div>
        <button
          onClick={handleComplete}
          style={{
            marginTop: 24,
            width: "100%",
            padding: "14px 24px",
            borderRadius: 8,
            border: "none",
            background: "#2d7ef7",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          開始使用
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 32, 
      maxWidth: 400, 
      margin: "0 auto",
      color: "white"
    }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>歡迎使用 AIHub</h2>
        <p style={{ color: "#aaa", fontSize: 14 }}>
          多 AI 模型聊天工作區 · 本地優先 · 隱私保護
        </p>
      </div>

      <div style={{ 
        background: "#252525", 
        border: "1px solid #333", 
        borderRadius: 12, 
        padding: 24 
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
            AIHub 會自動為您的資料加密，無需記住主密碼。
          </p>
          <p style={{ color: "#888", fontSize: 13 }}>
            您的資料已綁定此瀏覽器，僅能在同一裝置/瀏覽器解密。
          </p>
        </div>

        <button
          onClick={handleStart}
          style={{
            width: "100%",
            padding: "14px 24px",
            borderRadius: 8,
            border: "none",
            background: "#2d7ef7",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          開始使用
        </button>
      </div>
    </div>
  );
}
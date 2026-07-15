import { useState } from "react";
import { secureStorage } from "../utils/secureStorage";

type Step = "welcome" | "set-password" | "confirm-password" | "complete";

interface WelcomeStepProps {
  onNext: () => void;
}

function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#aaa", marginBottom: 16, fontSize: 14 }}>
        AIHub 會自動為您的資料加密，無需記住主密碼。
      </p>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
        您的資料已綁定此瀏覽器，僅能在同一裝置/瀏覽器解密。
      </p>
      <button
        onClick={onNext}
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
        開始設定
      </button>
    </div>
  );
}

interface SetPasswordStepProps {
  password: string;
  onPasswordChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  error: string;
}

function SetPasswordStep({ password, onPasswordChange, onBack, onNext, error }: SetPasswordStepProps) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#ccc" }}>
        設定主密碼 (至少 8 字元)
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => { onPasswordChange(e.target.value); }}
        placeholder="輸入主密碼"
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 8,
          border: "1px solid #444",
          background: "#1a1a1a",
          color: "white",
          fontSize: 15,
          boxSizing: "border-box",
          marginBottom: 16,
        }}
      />
      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 8,
            border: "1px solid #444",
            background: "transparent",
            color: "#ccc",
            cursor: "pointer",
          }}
        >
          返回
        </button>
        <button
          onClick={onNext}
          disabled={password.length < 8}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 8,
            border: "none",
            background: password.length >= 8 ? "#2d7ef7" : "#444",
            color: "white",
            cursor: password.length >= 8 ? "pointer" : "not-allowed",
          }}
        >
          下一步
        </button>
      </div>
    </div>
  );
}

interface ConfirmPasswordStepProps {
  password: string;
  confirmPassword: string;
  onConfirmChange: (value: string) => void;
  onBack: () => void;
  onComplete: () => void;
  error: string;
}

function ConfirmPasswordStep({ password, confirmPassword, onConfirmChange, onBack, onComplete, error }: ConfirmPasswordStepProps) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#ccc" }}>
        確認主密碼
      </label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => { onConfirmChange(e.target.value); }}
        placeholder="再次輸入主密碼"
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 8,
          border: "1px solid #444",
          background: "#1a1a1a",
          color: "white",
          fontSize: 15,
          boxSizing: "border-box",
          marginBottom: 16,
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 8,
            border: "1px solid #444",
            background: "transparent",
            color: "#ccc",
            cursor: "pointer",
          }}
        >
          返回
        </button>
        <button
          onClick={onComplete}
          disabled={confirmPassword !== password}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 8,
            border: "none",
            background: confirmPassword === password ? "#2d7ef7" : "#444",
            color: "white",
            cursor: confirmPassword === password ? "pointer" : "not-allowed",
          }}
        >
          完成設定
        </button>
      </div>
      {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 16 }}>{error}</p>}
    </div>
  );
}

export default function FirstTimeSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSetPasswordNext = () => {
    if (password.length >= 8) {
      setError("");
      setStep("confirm-password");
    } else {
      setError("密碼至少需要 8 個字元");
    }
  };

  const handleConfirmComplete = () => {
    if (confirmPassword === password) {
      setError("");
      setStep("complete");
      secureStorage.setItem("aihub-master-password-set", "true").catch(console.error);
      onComplete();
    } else {
      setError("兩次輸入的密碼不一致");
    }
  };

  const stepOrder = ["welcome", "set-password", "confirm-password", "complete"] as const;
  const stepIdx = stepOrder.indexOf(step);

  if (step === "complete") {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ marginBottom: 8 }}>設定完成！</h2>
        <p style={{ color: "#aaa", marginBottom: 24 }}>
          AIHub 已準備就緒，您的資料將自動加密保護
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
            💡 無需記住主密碼，您的資料已綁定此瀏覽器並自動加密
          </p>
        </div>
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
      <div style={{ 
        marginBottom: 32, 
        display: "flex", 
        gap: 8,
        justifyContent: "center"
      }}>
        {stepOrder.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: 
                stepIdx >= 0 && stepIdx >= i ? "#2d7ef7" : "#333",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      <div style={{ 
        background: "#252525", 
        border: "1px solid #333", 
        borderRadius: 12, 
        padding: 24 
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ marginBottom: 8 }}>歡迎使用 AIHub</h2>
          <p style={{ color: "#aaa", fontSize: 14 }}>
            首次使用需要完成初始設定
          </p>
        </div>

        {step === "welcome" && (
          <WelcomeStep onNext={() => setStep("set-password")} />
        )}
        {step === "set-password" && (
          <SetPasswordStep
            password={password}
            onPasswordChange={(v) => { setPassword(v); setError(""); }}
            onBack={() => { setError(""); setStep("welcome"); }}
            onNext={handleSetPasswordNext}
            error={error}
          />
        )}
        {step === "confirm-password" && (
          <ConfirmPasswordStep
            password={password}
            confirmPassword={confirmPassword}
            onConfirmChange={(v) => { setConfirmPassword(v); setError(""); }}
            onBack={() => { setError(""); setStep("set-password"); }}
            onComplete={handleConfirmComplete}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
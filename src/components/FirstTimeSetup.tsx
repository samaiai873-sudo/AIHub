import { useState, useEffect, useCallback, useMemo } from "react";
import useApiKeys from "../hooks/useApiKeys";
import { secureStorage, isSecureStorageAvailable } from "../utils/secureStorage";

interface FirstTimeSetupProps {
  onComplete: () => void;
}

export default function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const { apiKeys } = useApiKeys();
  const [step, setStep] = useState<"welcome" | "password" | "confirm" | "complete">("welcome");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);

  const hasApiKeys = Object.keys(apiKeys).length > 0;

  const stepLabels = useMemo(
    () => ({
      welcome: "歡迎使用 AIHub",
      password: "設定主密碼",
      confirm: "確認密碼",
      complete: "設定完成",
    }),
    []
  );

  const progress = useMemo(
    () => ({
      welcome: 25,
      password: 50,
      confirm: 75,
      complete: 100,
    }[step]),
    [step]
  );

  useEffect(() => {
    const checkMasterPassword = async () => {
      try {
        const test = await secureStorage.getItem("aihub-master-password-set", "");
        if (test === "true") {
          setHasMasterPassword(true);
        }
      } catch {
        // ignored
      }
    };
    checkMasterPassword();
  }, []);

  useEffect(() => {
    if (hasMasterPassword) {
      onComplete();
    }
  }, [hasMasterPassword, onComplete]);

  const handleNext = useCallback(async () => {
    if (step === "welcome") {
      setStep("password");
    } else if (step === "password") {
      if (!password) {
        setError("請輸入主密碼");
        return;
      }
      if (password.length < 8) {
        setError("密碼長度至少 8 碼");
        return;
      }
      setError("");
      setStep("confirm");
    } else if (step === "confirm") {
      if (confirmPassword !== password) {
        setError("兩次輸入的密碼不一致");
        return;
      }
      if (!password) {
        setError("請輸入密碼");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        await secureStorage.setItem("aihub-master-password-set", "true", password);

        if (hasApiKeys) {
          const test = await secureStorage.getItem("aihub-api-keys", "");
          if (test === null && localStorage.getItem("aihub-api-keys")) {
            await secureStorage.setItem("aihub-api-keys", JSON.stringify({}), password);
          }
        }

        localStorage.setItem("aihub-master-password-set", "true");

        setStep("complete");
        setIsLoading(false);

        setTimeout(() => {
          onComplete();
        }, 1500);
      } catch (error) {
        setIsLoading(false);
        setError("初始化失敗：" + (error instanceof Error ? error.message : "未知錯誤"));
      }
    }
  }, [step, password, confirmPassword, hasApiKeys, onComplete]);

  const handleBack = useCallback(() => {
    if (step === "password") {
      setStep("welcome");
    } else if (step === "confirm") {
      setStep("password");
    }
    setError("");
  }, [step]);

  if (!isSecureStorageAvailable()) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#ef9a9a" }}>
        <h3 style={{ marginTop: 0 }}>⚠️ 瀏覽器不支援加密功能</h3>
        <p style={{ margin: "16px 0", fontSize: 14 }}>
          您的瀏覽器不支援 Web Crypto API，無法使用加密存儲功能。
          請升級至最新版本的 Chrome、Firefox、Safari 或 Edge。
        </p>
      </div>
    );
  }

  if (hasMasterPassword) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 20,
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              height: 4,
              background: "#333",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#2d7ef7",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 12,
              color: "#888",
            }}
          >
            {Object.entries({ welcome: "歡迎", password: "設定密碼", confirm: "確認", complete: "完成" }).map(([key, label]) => (
              <span
                key={key}
                style={{
                  color: step === key ? "#2d7ef7" : "#888",
                  fontWeight: step === key ? 600 : 400,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
          {stepLabels[step]}
        </h2>
        <p style={{ margin: "0 0 24px", color: "#888", fontSize: 14 }}>
          {step === "welcome" &&
            "歡迎使用 AIHub！為了保護您的 API Keys，請先設定一組主密碼。"}
          {step === "password" &&
            "設定一組主密碼來加密保護所有 API Keys。密碼將用於加密所有本地存儲的敏感資料。"}
          {step === "confirm" && "再次輸入密碼以確認。"}
          {step === "complete" && "主密碼設定完成！所有 API Keys 現在受到加密保護。"}
        </p>

        {step === "welcome" && (
          <div>
            <div
              style={{
                padding: 16,
                background: "#252525",
                border: "1px solid #333",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>
                🔒 主密碼保護機制
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#ccc", lineHeight: 1.8 }}>
                <li>所有 API Keys 使用 AES-256-GCM 加密存儲</li>
                <li>主密碼結合裝置指紋衍生加密金鑰</li>
                <li>只有在相同裝置/瀏覽器才能解密</li>
                <li>遺失主密碼將無法恢復資料，請妥善保管</li>
              </ul>
            </div>

            <button
              onClick={() => setStep("password")}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 8,
                border: "none",
                background: "#2d7ef7",
                color: "white",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              開始設定主密碼
            </button>
          </div>
        )}

        {step === "password" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                主密碼
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入主密碼 (至少 8 碼)"
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "12px 44px 12px 12px",
                    borderRadius: 8,
                    border: "1px solid #444",
                    background: "#1e1e1e",
                    color: "white",
                    boxSizing: "border-box",
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888" }}>
                至少 8 碼，建議包含大小寫字母、數字、特殊符號
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "#4d1a1a",
                  border: "1px solid #c62828",
                  color: "#ef9a9a",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 8,
                border: "none",
                background: isLoading ? "#555" : "#2d7ef7",
                color: "white",
                fontWeight: 600,
                fontSize: 15,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "處理中..." : "下一步"}
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                確認主密碼
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次輸入主密碼"
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "12px 44px 12px 12px",
                    borderRadius: 8,
                    border: "1px solid #444",
                    background: "#1e1e1e",
                    color: "white",
                    boxSizing: "border-box",
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888" }}>
                請再次輸入相同的密碼以確認
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "#4d1a1a",
                  border: "1px solid #c62828",
                  color: "#ef9a9a",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 8,
                border: "none",
                background: isLoading ? "#555" : "#2d7ef7",
                color: "white",
                fontWeight: 600,
                fontSize: 15,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "設定中..." : "確認完成"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "transparent",
                color: "#ccc",
                fontWeight: 600,
                fontSize: 14,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              返回修改
            </button>
          </div>
        )}

        {step === "complete" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#1a4d2e",
                border: "2px solid #2e7d32",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 28,
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600 }}>
              設定完成！
            </h3>
            <p style={{ margin: "0 0 24px", color: "#888", fontSize: 14 }}>
              主密碼已設定完成，所有 API Keys 現在受到加密保護。
            </p>
            <button
              onClick={onComplete}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 8,
                border: "none",
                background: "#2d7ef7",
                color: "white",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              進入 AIHub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
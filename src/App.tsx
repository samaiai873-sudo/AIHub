import { useEffect, useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import PromptLibrary from "./components/PromptLibrary";
import ConversationWorkspace from "./components/ConversationWorkspace";
import GlobalSearch from "./components/GlobalSearch";
import ResetAllData from "./components/ResetAllData";
import FirstTimeSetup from "./components/FirstTimeSetup";
import CustomModels from "./components/CustomModels";
import useAppSettings from "./hooks/useAppSettings";
import useApiKeys from "./hooks/useApiKeys";
import { useConversationContext } from "./context/useConversationContext";
import usePrompts from "./hooks/usePrompts";
import {
  getLocalBaseUrl,
  setLocalBaseUrl,
} from "./providers/localProvider";

const QUICK_PRESET_BUTTON_STYLE: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #444",
  background: "#2b2b2b",
  color: "white",
  fontSize: 12,
  cursor: "pointer",
};

export default function App() {
  const [page, setPage] = useState<
    "conversation" | "prompt" | "settings"
  >("conversation");

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(
    !localStorage.getItem("aihub-first-time-setup")
  );

  // 本地推理 Base URL（寫入 localStorage，並用 React state 觸發重 render）
  const [localBaseUrl, setLocalBaseUrlState] = useState(getLocalBaseUrl());
  const updateLocalBaseUrl = (url: string) => {
    setLocalBaseUrl(url);
    setLocalBaseUrlState(url);
  };


  const { conversations } = useConversationContext();
  const { prompts } = usePrompts();

  const { settings, updateSettings } = useAppSettings();
  const { apiKeys, updateApiKey, removeApiKey } = useApiKeys();
  const { createConversation } = useConversationContext();

  const handleFirstTimeSetupComplete = () => {
    localStorage.setItem("aihub-first-time-setup", "true");
    setShowFirstTimeSetup(false);
  };

  // Global Search keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setShowGlobalSearch(true);
      }
      if (event.key === "Escape") {
        setShowGlobalSearch(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleGlobalSearchSelect = (
    type: "conversation" | "prompt" | "project",
    id: string
  ) => {
    setShowGlobalSearch(false);
    if (type === "conversation") {
      // Find the conversation and select it
      const conversation = conversations.find((c) => c.id === id);
      if (conversation) {
        // Switch to conversation page and select the conversation
        setPage("conversation");
        // The ConversationWorkspace will handle selection via context
      }
    } else if (type === "prompt") {
      // Switch to prompt library page
      setPage("prompt");
    } else if (type === "project") {
      // Switch to conversation page and filter by project
      setPage("conversation");
      // The ConversationSidebar will handle project filtering
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#202123",
      }}
    >
      <Sidebar
        activePage={page}
        onOpenConversation={(platform, model) => {
          if (platform && model) {
            createConversation("New Conversation", platform, model);
          }
          setPage("conversation");
        }}
        onOpenPrompt={() =>
          setPage("prompt")
        }
        onOpenSettings={() =>
          setPage("settings")
        }
      />

      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        {page === "conversation" ? (
          <ConversationWorkspace />
        ) : page === "prompt" ? (
          <PromptLibrary />
        ) : (
          <div
            style={{
              color: "white",
              padding: 20,
              maxWidth: 640,
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              ⚙️ Workspace Settings
            </h2>
            <p style={{ color: "#c2c2c2" }}>
              調整你的對話整理與檢視體驗。
            </p>

            <div
              style={{
                background: "#2b2b2b",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <span>顯示搜尋結果預覽</span>
                <input
                  type="checkbox"
                  checked={settings.showSearchPreview}
                  onChange={(event) =>
                    updateSettings({
                      showSearchPreview:
                        event.target.checked,
                    })
                  }
                />
              </label>
            </div>

            <div
              style={{
                background: "#2b2b2b",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <span>依 Project 分組顯示</span>
                <input
                  type="checkbox"
                  checked={settings.groupByProject}
                  onChange={(event) =>
                    updateSettings({
                      groupByProject:
                        event.target.checked,
                    })
                  }
                />
              </label>
            </div>

            <div
              style={{
                background: "#2b2b2b",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                🔐 API Keys
              </h3>
              <p style={{ color: "#c2c2c2", marginTop: 0 }}>
                請為每個 provider 分別輸入 API Key。
              </p>

              {[
                { id: "chatgpt", label: "OpenAI / ChatGPT" },
                { id: "claude", label: "Anthropic / Claude" },
                { id: "gemini", label: "Google / Gemini" },
                { id: "grok", label: "xAI / Grok" },
              ].map((provider) => (
                <div
                  key={provider.id}
                  style={{
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    {provider.label}
                  </div>

                  <input
                    type="password"
                    value={apiKeys[provider.id] ?? ""}
                    onChange={(event) =>
                      updateApiKey(
                        provider.id,
                        event.target.value
                      )
                    }
                    placeholder={`輸入 ${provider.label} API Key`}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #555",
                      boxSizing: "border-box",
                      marginBottom: 6,
                    }}
                  />

                  <button
                    onClick={() =>
                      removeApiKey(provider.id)
                    }
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: "#444",
                      color: "white",
                    }}
                  >
                    清除
                  </button>
                </div>
              ))}

              {/* Local Provider (Ollama / LM Studio 統一介面) */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #333" }}>
                <h4 style={{ marginTop: 0, marginBottom: 12, color: "#8bc98b" }}>
                  💻 本地模型設定 (無需 API Key)
                </h4>
                <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                  本地推理統一走 OpenAI 相容 API。Ollama 與 LM Studio 各自啟用相容端點後擇一切換即可，不必分別設定。
                </p>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 6, fontWeight: 600 }}>
                    本機服務端點 (OpenAI 相容 Base URL)
                  </div>
                  <input
                    type="text"
                    value={localBaseUrl}
                    onChange={(event) => updateLocalBaseUrl(event.target.value.trim())}
                    placeholder="http://localhost:1234/v1"
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #555",
                      boxSizing: "border-box",
                      marginBottom: 6,
                      fontSize: 13,
                      fontFamily: "monospace",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button
                      onClick={() => updateLocalBaseUrl("http://localhost:1234/v1")}
                      style={QUICK_PRESET_BUTTON_STYLE}
                    >
                      LM Studio (1234)
                    </button>
                    <button
                      onClick={() => updateLocalBaseUrl("http://localhost:11434/v1")}
                      style={QUICK_PRESET_BUTTON_STYLE}
                    >
                      Ollama (11434)
                    </button>
                  </div>
                  <div style={{ color: "#888", fontSize: 12 }}>
                    啟動方式:
                    <code style={{ color: "#8bc98b", marginLeft: 6 }}>ollama serve</code>
                    {" / "}
                    <code style={{ color: "#8bc98b" }}>LM Studio → Developer → Start Local Server</code>
                  </div>
                </div>
              </div>

              {/* Custom Models */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #333" }}>
                <h4 style={{ marginTop: 0, marginBottom: 12, color: "#87ceeb" }}>
                  ⚙️ 自訂模型
                </h4>
                <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                  手動新增任意模型 (OpenAI 相容 API 格式)
                </p>
                <CustomModels />
              </div>

              {/* Reset All Data Section */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: "1px solid #333",
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: 12 }}>
                  🗑️ 重置所有資料
                </h4>
                <p style={{ color: "#c2c2c2", marginTop: 0, marginBottom: 16, fontSize: 13 }}>
                  永久刪除所有 API Keys、對話記錄、Prompt Library 等所有資料。此操作不可復原。
                </p>
                <ResetAllData />
              </div>
            </div>
          </div>
        )}
      </main>

      {showGlobalSearch && (
        <GlobalSearch
          conversations={conversations}
          prompts={prompts}
          onSelect={handleGlobalSearchSelect}
          onClose={() => setShowGlobalSearch(false)}
        />
      )}

      {showFirstTimeSetup && (
        <FirstTimeSetup onComplete={handleFirstTimeSetupComplete} />
      )}
    </div>
  );
}
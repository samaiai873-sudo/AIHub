import { aiPlatforms } from "../data/aiPlatforms";
import useAppSettings from "../hooks/useAppSettings";

type SidebarProps = {
  activePage: "conversation" | "prompt" | "settings";
  onOpenConversation: (platform?: string, model?: string) => void;
  onOpenPrompt: () => void;
  onOpenSettings: () => void;
};

export default function Sidebar({
  activePage,
  onOpenConversation,
  onOpenPrompt,
  onOpenSettings,
}: SidebarProps) {
  const { settings } = useAppSettings();
  const customModels = settings.customModels ?? [];

  return (
    <aside
      style={{
        width: 240,
        background: "#171717",
        color: "white",
        padding: 20,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h1
        style={{
          marginTop: 0,
          marginBottom: 24,
        }}
      >
        AIHub
      </h1>

      <div
        style={{
          fontSize: 13,
          color: "#9e9e9e",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        🤖 AI Agents
      </div>

      {aiPlatforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => {
            onOpenConversation(
              platform.id,
              platform.models[0]?.id ?? "default"
            );
          }}
          style={{
            display: "block",
            width: "100%",
            padding: 14,
            marginBottom: 10,
            borderRadius: 8,
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            background: "#2b2b2b",
            color: "white",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#3a3a3a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#2b2b2b";
          }}
        >
          {platform.icon} {platform.name}
        </button>
      ))}

      {/* 自訂模型 */}
      {customModels.map((model) => (
        <button
          key={model.id}
          onClick={() => {
            onOpenConversation(`custom:${model.id}`, model.modelId);
          }}
          style={{
            display: "block",
            width: "100%",
            padding: 14,
            marginBottom: 10,
            borderRadius: 8,
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            background: "#2b2b2b",
            color: "white",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#3a3a3a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#2b2b2b";
          }}
        >
          🔧 {model.name}
        </button>
      ))}

      <hr
        style={{
          width: "100%",
          margin: "20px 0",
          borderColor: "#333",
        }}
      />

      <button
        onClick={() => onOpenConversation()}
        style={{
          padding: 14,
          marginBottom: 10,
          borderRadius: 8,
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          background:
            activePage === "conversation"
              ? "#2d7ef7"
              : "#2b2b2b",
          color: "white",
        }}
      >
        💬 Conversations
      </button>

      <button
        onClick={onOpenPrompt}
        style={{
          padding: 14,
          marginBottom: 10,
          borderRadius: 8,
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          background:
            activePage === "prompt"
              ? "#2d7ef7"
              : "#2b2b2b",
          color: "white",
        }}
      >
        📂 Prompt Library
      </button>

      <button
        onClick={onOpenSettings}
        style={{
          padding: 14,
          borderRadius: 8,
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          background:
            activePage === "settings"
              ? "#2d7ef7"
              : "#2b2b2b",
          color: "white",
        }}
      >
        ⚙️ Settings
      </button>
    </aside>
  );
}
import { aiPlatforms } from "../data/aiPlatforms";
import { useAgentContext } from "../context/AgentContext";

type SidebarProps = {
  onOpenPrompt: () => void;
};

export default function Sidebar({
  onOpenPrompt,
}: SidebarProps) {
  const { enabledAgents } = useAgentContext();

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

      {aiPlatforms.map((platform) => {
        const enabled = enabledAgents.includes(platform.id);

        return (
          <button
            key={platform.id}
            style={{
              padding: 14,
              marginBottom: 10,
              borderRadius: 8,
              border: "none",
              textAlign: "left",
              cursor: enabled ? "pointer" : "default",
              background: enabled ? "#f2f2f2" : "#2b2b2b",
              color: enabled ? "#000" : "#777",
              opacity: enabled ? 1 : 0.55,
            }}
          >
            {enabled ? "🟢" : "⚪"}{" "}
            {platform.icon} {platform.name}
          </button>
        );
      })}

      <hr
        style={{
          width: "100%",
          margin: "20px 0",
          borderColor: "#333",
        }}
      />

      <button
        style={{
          padding: 14,
          marginBottom: 10,
          borderRadius: 8,
          border: "none",
          textAlign: "left",
          cursor: "pointer",
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
        }}
      >
        📂 Prompt Library
      </button>

      <button
        style={{
          padding: 14,
          borderRadius: 8,
          border: "none",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        ⚙️ Settings
      </button>
    </aside>
  );
}
import { aiPlatforms } from "../data/aiPlatforms";
import { useAgentContext } from "../context/AgentContext";

export default function AIAgentManager() {
  const {
    isEnabled,
    toggleAgent,
  } = useAgentContext();

  return (
    <div
      style={{
        background: "#242424",
        borderRadius: 12,
        padding: 20,
        marginBottom: 25,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 20,
        }}
      >
        🤖 AI Agent Manager
      </h3>

      {aiPlatforms.map((platform) => (
        <div
          key={platform.id}
          style={{
            border: "1px solid #444",
            borderRadius: 10,
            padding: 15,
            marginBottom: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <input
              type="checkbox"
              checked={isEnabled(platform.id)}
              onChange={() =>
                toggleAgent(platform.id)
              }
            />

            <strong>
              {platform.icon} {platform.name}
            </strong>
          </div>

          <div
            style={{
              marginLeft: 28,
              color: "#bdbdbd",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {platform.models.map((model) => (
              <span key={model.id}>
                • {model.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
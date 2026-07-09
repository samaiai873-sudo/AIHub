import { AI_APPS } from "../data/apps";

type SidebarProps = {
  onOpenPrompt: () => void;
};

export default function Sidebar({ onOpenPrompt }: SidebarProps) {
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
        gap: 10,
      }}
    >
      <h1 style={{ margin: 0 }}>AIHub</h1>

      {AI_APPS.map((app) => (
        <button
          key={app.id}
          onClick={() => window.open(app.url, "_blank")}
          style={{
            padding: 14,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          {app.name}
        </button>
      ))}

      <hr style={{ width: "100%" }} />

      <button
        onClick={onOpenPrompt}
        style={{
          padding: 14,
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        📂 Prompt Library
      </button>
    </aside>
  );
}
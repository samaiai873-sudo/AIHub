import PromptToolbar from "./PromptToolbar";

type AppHeaderProps = {
  onImport: () => void;
  onExport: () => void;
};

export default function AppHeader({
  onImport,
  onExport,
}: AppHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 34,
          }}
        >
          🤖 AIHub
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "#9ca3af",
            fontSize: 15,
          }}
        >
          Your AI Prompt Workspace
        </p>
      </div>

      <PromptToolbar
        onImport={onImport}
        onExport={onExport}
      />
    </div>
  );
}
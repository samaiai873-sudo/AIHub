type PromptToolbarProps = {
  onImport: () => void;
  onExport: () => void;
};

export default function PromptToolbar({
  onImport,
  onExport,
}: PromptToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
      }}
    >
      <button onClick={onImport}>
        📥 Import JSON
      </button>

      <button onClick={onExport}>
        📦 Export JSON
      </button>
    </div>
  );
}
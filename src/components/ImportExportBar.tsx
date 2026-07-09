import { exportPrompts } from "../utils/json";
import type { Prompt } from "../types/prompt";

type ImportExportBarProps = {
  prompts: Prompt[];
};

export default function ImportExportBar({
  prompts,
}: ImportExportBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <button
        onClick={() => exportPrompts(prompts)}
      >
        📦 Export JSON
      </button>
    </div>
  );
}
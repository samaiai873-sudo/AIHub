import type { Prompt } from "../types/prompt";

type PromptCardProps = {
  prompt: Prompt;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

export default function PromptCard({
  prompt,
  onCopy,
  onDelete,
  onToggleFavorite,
}: PromptCardProps) {
  return (
    <div
      style={{
        background: "#2d2d2d",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        color: "white",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 10,
        }}
      >
        {prompt.title}
      </h3>

      <div
        style={{
          whiteSpace: "pre-wrap",
        }}
      >
        {prompt.content}
      </div>

      <div
        style={{
          marginTop: 15,
          display: "flex",
          gap: 10,
        }}
      >
        <button
          onClick={() => onToggleFavorite(prompt.id)}
        >
          {prompt.favorite ? "⭐ 已收藏" : "☆ 收藏"}
        </button>

        <button
          onClick={() => onCopy(prompt.content)}
        >
          📋 複製
        </button>

        <button
          onClick={() => onDelete(prompt.id)}
        >
          🗑️ 刪除
        </button>
      </div>
    </div>
  );
}
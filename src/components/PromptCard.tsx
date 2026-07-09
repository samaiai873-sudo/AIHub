import type { Prompt } from "../types/prompt";

type PromptCardProps = {
  prompt: Prompt;
  onCopy: () => void;
  onDelete: () => void;
};

export default function PromptCard({
  prompt,
  onCopy,
  onDelete,
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
          marginBottom: 8,
        }}
      >
        {prompt.title || "未命名 Prompt"}
      </h3>

      <div
        style={{
          fontSize: 14,
          opacity: 0.8,
          marginBottom: 10,
        }}
      >
        AI：
        {prompt.provider}
      </div>

      <div
        style={{
          whiteSpace: "pre-wrap",
        }}
      >
        {prompt.content}
      </div>

      {prompt.tags.length > 0 && (
        <div
          style={{
            marginTop: 10,
          }}
        >
          標籤：

          {prompt.tags.map((tag) => (
            <span
              key={tag}
              style={{
                marginLeft: 8,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 15,
          display: "flex",
          gap: 10,
        }}
      >
        <button onClick={onCopy}>
          📋 複製
        </button>

        <button onClick={onDelete}>
          🗑️ 刪除
        </button>
      </div>
    </div>
  );
}
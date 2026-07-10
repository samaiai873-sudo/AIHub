import { useState } from "react";
import type { Prompt } from "../types/prompt";

type PromptCardProps = {
  prompt: Prompt;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdate: (
    id: string,
    content: string,
    platform: string,
    model: string
  ) => void;
};

export default function PromptCard({
  prompt,
  onCopy,
  onDelete,
  onToggleFavorite,
  onUpdate,
}: PromptCardProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(prompt.content);

  const save = () => {
    if (!content.trim()) return;

    onUpdate(
      prompt.id,
      content,
      prompt.platform,
      prompt.model
    );

    setEditing(false);
  };

  const cancel = () => {
    setContent(prompt.content);
    setEditing(false);
  };

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

      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          style={{
            width: "100%",
            resize: "vertical",
            marginBottom: 15,
          }}
        />
      ) : (
        <div
          style={{
            whiteSpace: "pre-wrap",
          }}
        >
          {prompt.content}
        </div>
      )}

      <div
        style={{
          marginTop: 15,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onToggleFavorite(prompt.id)}
        >
          {prompt.favorite ? "⭐ 已收藏" : "☆ 收藏"}
        </button>

        {!editing && (
          <button
            onClick={() => onCopy(prompt.content)}
          >
            📋 複製
          </button>
        )}

        {editing ? (
          <>
            <button onClick={save}>
              💾 儲存
            </button>

            <button onClick={cancel}>
              ❌ 取消
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
          >
            ✏️ 編輯
          </button>
        )}

        <button
          onClick={() => onDelete(prompt.id)}
        >
          🗑️ 刪除
        </button>
      </div>
    </div>
  );
}
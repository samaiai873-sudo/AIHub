import { useState } from "react";

type ComposerProps = {
  onSend: (content: string) => void;
};

export default function Composer({
  onSend,
}: ComposerProps) {
  const [value, setValue] = useState("");

  const send = () => {
    const text = value.trim();

    if (!text) return;

    onSend(text);

    setValue("");
  };

  return (
    <div
      style={{
        padding: 20,
        borderTop: "1px solid #333",
        display: "flex",
        gap: 10,
      }}
    >
      <input
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            send();
          }
        }}
        placeholder="輸入 Prompt..."
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 8,
          border: "none",
        }}
      />

      <button
        onClick={send}
        style={{
          padding: "0 24px",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}
type PromptFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export default function PromptForm({
  value,
  onChange,
  onSubmit,
}: PromptFormProps) {
  return (
    <>
      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={5}
        placeholder="輸入你的 Prompt..."
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          resize: "vertical",
        }}
      />

      <button
        onClick={onSubmit}
        style={{
          marginTop: 10,
          padding: "10px 18px",
          cursor: "pointer",
        }}
      >
        ➕ 新增 Prompt
      </button>
    </>
  );
}
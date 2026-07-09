import { providers } from "../data/providers";

type PromptFormProps = {
  value: string;
  provider: string;
  onChange: (value: string) => void;
  onProviderChange: (provider: string) => void;
  onSubmit: () => void;
};

export default function PromptForm({
  value,
  provider,
  onChange,
  onProviderChange,
  onSubmit,
}: PromptFormProps) {
  return (
    <>
      <select
        value={provider}
        onChange={(event) => onProviderChange(event.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 8,
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      >
        {providers.map((item) => (
          <option
            key={item.id}
            value={item.id}
          >
            {item.name}
          </option>
        ))}
      </select>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          boxSizing: "border-box",
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
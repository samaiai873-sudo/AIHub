type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder="🔍 搜尋 Prompt..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: 8,
        border: "1px solid #555",
        marginBottom: 20,
        boxSizing: "border-box",
        fontSize: 16,
      }}
    />
  );
}
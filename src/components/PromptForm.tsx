import { useEffect } from "react";

import { aiPlatforms } from "../data/aiPlatforms";
import { useAgentContext } from "../context/useAgentContext";

type PromptFormProps = {
  value: string;
  platform: string;
  model: string;
  onChange: (value: string) => void;
  onPlatformChange: (platform: string) => void;
  onModelChange: (model: string) => void;
  onSubmit: () => void;
};

export default function PromptForm({
  value,
  platform,
  model,
  onChange,
  onPlatformChange,
  onModelChange,
  onSubmit,
}: PromptFormProps) {
  const { enabledAgents } = useAgentContext();

  const enabledPlatforms = aiPlatforms.filter((item) =>
    enabledAgents.includes(item.id)
  );

  const currentPlatform =
    enabledPlatforms.find((item) => item.id === platform) ??
    enabledPlatforms[0];

  useEffect(() => {
    if (!currentPlatform) return;

    if (platform !== currentPlatform.id) {
      onPlatformChange(currentPlatform.id);
      return;
    }

    const modelExists = currentPlatform.models.some(
      (item) => item.id === model
    );

    if (!modelExists) {
      onModelChange(currentPlatform.models[0].id);
    }
  }, [
    currentPlatform,
    platform,
    model,
    onPlatformChange,
    onModelChange,
  ]);

  if (enabledPlatforms.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: 8,
          background: "#2d2d2d",
          color: "white",
        }}
      >
        ⚠️ 請先到 AI Agent Manager 啟用至少一個 AI Platform。
      </div>
    );
  }

  return (
    <>
      <label>AI Platform</label>

      <select
        value={platform}
        onChange={(event) =>
          onPlatformChange(event.target.value)
        }
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      >
        {enabledPlatforms.map((item) => (
          <option key={item.id} value={item.id}>
            {item.icon} {item.name}
          </option>
        ))}
      </select>

      <label>Model</label>

      <select
        value={model}
        onChange={(event) =>
          onModelChange(event.target.value)
        }
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      >
        {currentPlatform.models.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
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
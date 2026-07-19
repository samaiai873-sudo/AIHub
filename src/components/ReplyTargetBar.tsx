/**
 * ReplyTargetBar — 對話框上方的「4 個 AI 同時回答」目標選擇列
 *
 * 每個欄位可以選：
 *   - N/A（不參與這輪回答）
 *   - 內建 Platform（chatgpt/claude/gemini/grok/local）+ 對應 model
 *   - 自訂模型（custom:<id>）+ 對應 modelId
 *
 * 送出後，所有非 N/A 的 AI 會各自打 API 並把回覆加到對話裡。
 * 限制最多 4 個，避免無腦打 API；至少要 1 個非 N/A。
 *
 * Controlled component — targets state 由父層 ConversationWorkspace 管理，
 * 這樣 handleSend 才會跟 UI 同步看到最新值。
 */
import { useMemo } from "react";
import { aiPlatforms } from "../data/aiPlatforms";
import type { CustomModel } from "../hooks/useAppSettings";

export type ReplyTarget = { platform: string; model: string } | null;
export type ReplyTargets = ReplyTarget[]; // 長度固定 4

export const TARGET_SLOTS = 4;
const NA_VALUE = "__na__";

/** 把所有可選擇項目（內建 + custom）攤平為統一選單格式 */
function buildAllOptions(customModels: CustomModel[]) {
  const builtIn = aiPlatforms.map((p) => ({
    group: "內建",
    label: `${p.icon} ${p.name}`,
    platform: p.id,
    models: p.models.map((m) => m.id),
    defaultModel: p.models[0]?.id ?? "",
  }));
  const custom = customModels.map((cm) => ({
    group: "自訂",
    label: `🛠 ${cm.name}`,
    platform: `custom:${cm.id}`,
    models: [cm.modelId],
    defaultModel: cm.modelId,
  }));
  return [...builtIn, ...custom];
}

export default function ReplyTargetBar({
  targets,
  onTargetsChange,
  customModels,
}: {
  targets: ReplyTargets;
  onTargetsChange: (next: ReplyTargets) => void;
  customModels: CustomModel[];
}) {
  const allOptions = useMemo(
    () => buildAllOptions(customModels),
    [customModels]
  );

  const updateSlotPlatform = (index: number, platformId: string) => {
    if (platformId === NA_VALUE) {
      onTargetsChange(targets.map((t, i) => (i === index ? null : t)));
      return;
    }
    const option = allOptions.find((o) => o.platform === platformId);
    if (!option) return;
    const current = targets[index];
    const currentModel = current?.model;
    const keepModel =
      currentModel && option.models.includes(currentModel)
        ? currentModel
        : option.defaultModel;
    onTargetsChange(
      targets.map((t, i) =>
        i === index ? { platform: platformId, model: keepModel } : t
      )
    );
  };

  const updateSlotModel = (index: number, model: string) => {
    const current = targets[index];
    if (!current) return;
    onTargetsChange(
      targets.map((t, i) => (i === index ? { ...current, model } : t))
    );
  };

  const activeCount = targets.filter(Boolean).length;

  return (
    <div
      style={{
        padding: "10px 16px",
        borderTop: "1px solid #333",
        borderBottom: "1px solid #333",
        background: "#181818",
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#87ceeb",
          fontWeight: 600,
          letterSpacing: 0.5,
          marginRight: 4,
        }}
      >
        🔄 多模型回覆（{activeCount}/{TARGET_SLOTS}）
      </div>

      {targets.map((target, i) => {
        const platformValue = target?.platform ?? NA_VALUE;
        const option = target
          ? allOptions.find((o) => o.platform === target.platform)
          : undefined;
        const modelOptions = option?.models ?? [];
        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 4,
              alignItems: "center",
              background: target ? "#2b2b2b" : "#222",
              border: target ? "1px solid #3a5d8c" : "1px solid #444",
              borderRadius: 6,
              padding: 4,
            }}
          >
            <select
              value={platformValue}
              onChange={(e) => updateSlotPlatform(i, e.target.value)}
              title={`第 ${i + 1} 個 AI`}
              style={selectStyle}
            >
              <option value={NA_VALUE}>N/A</option>
              {allOptions.map((opt) => (
                <option key={opt.platform} value={opt.platform}>
                  {opt.label}
                </option>
              ))}
            </select>

            {target && modelOptions.length > 1 && (
              <select
                value={target.model}
                onChange={(e) => updateSlotModel(i, e.target.value)}
                title="模型"
                style={{ ...selectStyle, minWidth: 100 }}
              >
                {modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}

      {activeCount > 0 && (
        <button
          onClick={() => onTargetsChange(Array(TARGET_SLOTS).fill(null))}
          title="清除全部（設為 N/A）"
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid #555",
            background: "transparent",
            color: "#888",
            cursor: "pointer",
            fontSize: 12,
            marginLeft: "auto",
          }}
        >
          全清 N/A
        </button>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "5px 8px",
  borderRadius: 4,
  border: "1px solid #555",
  background: "#1a1a1a",
  color: "white",
  fontSize: 12,
  cursor: "pointer",
  minWidth: 120,
};

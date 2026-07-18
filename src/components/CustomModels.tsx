import { useState } from "react";
import useAppSettings from "../hooks/useAppSettings";
import type { CustomModel } from "../hooks/useAppSettings";

const EMPTY_FORM = {
  name: "",
  platform: "custom",
  endpoint: "",
  modelId: "",
  apiKey: "",
};

type FormState = typeof EMPTY_FORM;

export default function CustomModels() {
  const { settings, updateSettings } = useAppSettings();
  const [showForm, setShowForm] = useState(false);
  // 編輯模式：正在編輯的 model id（null 代表新增模式）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  const customModels = settings.customModels || [];

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startAdd = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (model: CustomModel) => {
    setFormData({
      name: model.name,
      platform: model.platform,
      endpoint: model.endpoint,
      modelId: model.modelId,
      apiKey: model.apiKey ?? "",
    });
    setEditingId(model.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.endpoint || !formData.modelId) {
      alert("請填寫顯示名稱、API 端點、模型 ID");
      return;
    }

    if (editingId) {
      // 編輯模式：保留原 id
      updateSettings({
        customModels: customModels.map((m) =>
          m.id === editingId ? { ...m, ...formData } : m
        ),
      });
    } else {
      // 新增模式
      updateSettings({
        customModels: [
          ...customModels,
          { ...formData, id: `custom-${Date.now()}` },
        ],
      });
    }

    resetForm();
  };

  const handleRemove = (id: string) => {
    if (!confirm("確認移除這個自訂模型？已使用此模型的對話不會被刪除，但會顯示為無效平台。")) {
      return;
    }
    updateSettings({
      customModels: customModels.filter((m) => m.id !== id),
    });
  };

  // 表單標題與按鈕文字
  const isEditing = editingId !== null;

  return (
    <div>
      {showForm ? (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            background: "#2b2b2b",
            borderRadius: 8,
            border: "1px solid #444",
          }}
        >
          <h5 style={{ marginTop: 0, marginBottom: 12, color: "#87ceeb" }}>
            {isEditing ? "編輯自訂模型" : "新增自訂模型"}
          </h5>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 6,
                color: "#ccc",
              }}
            >
              顯示名稱
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：我的 GPT-4 自架版"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 6,
                color: "#ccc",
              }}
            >
              API 端點
            </label>
            <input
              type="text"
              value={formData.endpoint}
              onChange={(e) =>
                setFormData({ ...formData, endpoint: e.target.value })
              }
              placeholder="https://api.example.com/v1"
              style={inputStyle}
            />
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888" }}>
              OpenAI 相容 API 端點，例如 https://api.openai.com/v1 或
              http://localhost:1234/v1
            </p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 6,
                color: "#ccc",
              }}
            >
              模型 ID
            </label>
            <input
              type="text"
              value={formData.modelId}
              onChange={(e) =>
                setFormData({ ...formData, modelId: e.target.value })
              }
              placeholder="例如 gpt-4, llama3.1, my-custom-model"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 6,
                color: "#ccc",
              }}
            >
              API Key（選用）
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.target.value })
              }
              placeholder="留空則不需認證"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: "none",
                background: "#2d7ef7",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {isEditing ? "儲存變更" : "新增模型"}
            </button>
            <button
              onClick={resetForm}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #555",
                background: "transparent",
                color: "#ccc",
                cursor: "pointer",
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startAdd}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px dashed #555",
            background: "transparent",
            color: "#87ceeb",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          + 新增自訂模型
        </button>
      )}

      {customModels.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 8, fontSize: 13, color: "#888" }}>
            已新增的自訂模型：
          </p>
          {customModels.map((model) => (
            <div
              key={model.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: "#2b2b2b",
                border: "1px solid #444",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "white" }}>
                  {model.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {model.endpoint} / {model.modelId}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                <button
                  onClick={() => startEdit(model)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #555",
                    background: "#3a3a3a",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                  title="修改此自訂模型"
                >
                  修改
                </button>
                <button
                  onClick={() => handleRemove(model.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: "#c62828",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                  title="移除"
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #555",
  background: "#1a1a1a",
  color: "white",
  fontSize: 14,
  boxSizing: "border-box",
};

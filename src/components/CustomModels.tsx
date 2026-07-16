import { useState } from "react";
import useAppSettings from "../hooks/useAppSettings";

interface CustomModel {
  id: string;
  name: string;
  platform: string;
  endpoint: string;
  modelId: string;
}

export default function CustomModels() {
  const { settings, updateSettings } = useAppSettings();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    platform: "custom",
    endpoint: "",
    modelId: "",
  });

  const customModels: CustomModel[] = settings.customModels || [];

  const handleAddModel = () => {
    if (!formData.name || !formData.endpoint || !formData.modelId) {
      alert("請填寫所有欄位");
      return;
    }

    const newModel: CustomModel = {
      id: `custom-${Date.now()}`,
      ...formData,
    };

    updateSettings({
      customModels: [...customModels, newModel],
    });

    setFormData({ name: "", platform: "custom", endpoint: "", modelId: "" });
    setShowForm(false);
  };

  const handleRemoveModel = (id: string) => {
    updateSettings({
      customModels: customModels.filter((m) => m.id !== id),
    });
  };

  return (
    <div>
      {showForm ? (
        <div style={{ marginBottom: 16, padding: 16, background: "#2b2b2b", borderRadius: 8, border: "1px solid #444" }}>
          <h5 style={{ marginTop: 0, marginBottom: 12, color: "#87ceeb" }}>新增自訂模型</h5>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#ccc" }}>
              顯示名稱
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：我的 GPT-4 自架版"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #555",
                background: "#1a1a1a",
                color: "white",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#ccc" }}>
              API 端點
            </label>
            <input
              type="text"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              placeholder="https://api.example.com/v1"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #555",
                background: "#1a1a1a",
                color: "white",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888" }}>
              OpenAI 相容 API 端點，例如：https://api.openai.com/v1 或 http://localhost:1234/v1
            </p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#ccc" }}>
              模型 ID
            </label>
            <input
              type="text"
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              placeholder="例如：gpt-4, llama3.1, my-custom-model"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #555",
                background: "#1a1a1a",
                color: "white",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAddModel}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 8,
                border: "none",
                background: "#2d7ef7",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              新增模型
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({ name: "", platform: "custom", endpoint: "", modelId: "" });
              }}
              style={{
                flex: 1,
                padding: "12px",
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
          onClick={() => setShowForm(true)}
          style={{
            width: "100%",
            padding: "12px",
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
          <p style={{ marginBottom: 8, fontSize: 13, color: "#888" }}>已新增的自訂模型：</p>
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
              <div>
                <div style={{ fontWeight: 600, color: "white" }}>{model.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {model.endpoint} / {model.modelId}
                </div>
              </div>
              <button
                onClick={() => handleRemoveModel(model.id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: "#c62828",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
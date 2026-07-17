import { useEffect, useMemo, useState } from "react";

import type { Conversation } from "../types/conversation";

type ProjectManagerProps = {
  conversations: Conversation[];
  onRenameProject: (oldName: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onClose: () => void;
};

export default function ProjectManager({
  conversations,
  onRenameProject,
  onDeleteProject,
  onClose,
}: ProjectManagerProps) {
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [renameValue, setRenameValue] = useState("");

  // Extract unique projects from conversations
  const projects = useMemo(() => {
    const projectMap = new Map<string, { count: number; lastUpdated: string }>();

    conversations.forEach((conv) => {
      const projectId = conv.projectId ?? "Uncategorized";
      const existing = projectMap.get(projectId);
      const updatedAt = conv.updatedAt;

      if (existing) {
        existing.count += 1;
        if (updatedAt > existing.lastUpdated) {
          existing.lastUpdated = updatedAt;
        }
      } else {
        projectMap.set(projectId, { count: 1, lastUpdated: updatedAt });
      }
    });

    return Array.from(projectMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) =>
        Date.parse(b.lastUpdated) - Date.parse(a.lastUpdated)
      );
  }, [conversations]);

  const handleCreateProject = () => {
    // 專案透過 ConversationSidebar 的「Move to Project」建立，
    // 此處僅清空輸入欄（無對應的 context API）
    if (!newProjectName.trim()) return;
    setNewProjectName("");
  };

  const handleRenameProject = (oldName: string) => {
    if (!renameValue.trim() || renameValue === oldName) {
      setEditingProject(null);
      setRenameValue("");
      return;
    }
    onRenameProject(oldName, renameValue.trim());
    setEditingProject(null);
    setRenameValue("");
  };

  const handleDeleteProject = (projectName: string) => {
    if (projectName === "Uncategorized") return;

    const confirmed = window.confirm(
      `確定要刪除專案「${projectName}」嗎？此專案下的對話將會被移至「Uncategorized」。`
    );

    if (confirmed) {
      onDeleteProject(projectName);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(500px, 90vw)",
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #333",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>📁 Project Manager</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              fontSize: 20,
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Create New Project */}
        <div style={{ padding: 16, borderBottom: "1px solid #333" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
              }}
              placeholder="新增專案名稱..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#2b2b2b",
                color: "white",
                fontSize: 14,
              }}
            />
            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: newProjectName.trim() ? "#2d7ef7" : "#444",
                color: "white",
                cursor: newProjectName.trim() ? "pointer" : "not-allowed",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              新增
            </button>
          </div>
        </div>

        {/* Project List */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {projects.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              尚無專案，點擊上方新增
            </div>
          ) : (
            projects.map((project) => {
              const isUncategorized = project.name === "Uncategorized";
              const isEditing = editingProject === project.name;

              return (
                <div
                  key={project.name}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #2a2a2a",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 18 }}>📁</span>

                  {isEditing ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameProject(project.name);
                        if (e.key === "Escape") {
                          setEditingProject(null);
                          setRenameValue("");
                        }
                      }}
                      onBlur={() => handleRenameProject(project.name)}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #555",
                        background: "#2b2b2b",
                        color: "white",
                        fontSize: 14,
                      }}
                    />
                  ) : (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {project.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        {project.count} 個對話 • 最後更新：{new Date(
                          project.lastUpdated
                        ).toLocaleString("zh-TW", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          setEditingProject(project.name);
                          setRenameValue(project.name);
                        }}
                        disabled={isUncategorized}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: isUncategorized ? "#333" : "#3a3a3a",
                          color: isUncategorized ? "#666" : "white",
                          cursor: isUncategorized ? "not-allowed" : "pointer",
                          fontSize: 12,
                        }}
                      >
                        ✏️
                      </button>

                      {!isUncategorized && (
                        <button
                          onClick={() => handleDeleteProject(project.name)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "none",
                            background: "#3a3a3a",
                            color: "#ff6b6b",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #333",
            background: "#1a1a1a",
          }}
        >
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#666" }}>
            <span>Esc 關閉</span>
            <span>Enter 確認</span>
          </div>
        </div>
      </div>
    </div>
  );
}
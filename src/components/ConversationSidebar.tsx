import { useEffect, useMemo, useState } from "react";

import useConversationSearch from "../hooks/useConversationSearch";
import { UNCATEGORIZED_PROJECT_DISPLAY } from "../constants/projects";
import { runOpenInBrowserWorkflow } from "../utils/browserWorkflow";
import type { Conversation } from "../types/conversation";
import ProjectManager from "./ProjectManager";

type ConversationSidebarProps = {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (
    id: string,
    title: string
  ) => void;
  onToggleFavorite: (id: string) => void;
  onMoveConversationToProject: (
    id: string,
    projectId: string | null
  ) => void;
  onDeleteConversation: (
    id: string
  ) => void;
  onDuplicateConversation: (conversation: Conversation) => void;
  onRenameProject: (oldProjectId: string, newProjectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  showSearchPreview: boolean;
  groupByProject: boolean;
};

export default function ConversationSidebar({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onRenameConversation,
  onToggleFavorite,
  onMoveConversationToProject,
  onDeleteConversation,
  onDuplicateConversation,
  onRenameProject,
  onDeleteProject,
  showSearchPreview,
  groupByProject,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [showProjectManager, setShowProjectManager] = useState(false);

  const [contextMenu, setContextMenu] =
    useState<{
      id: string | null;
      x: number;
      y: number;
    }>({
      id: null,
      x: 0,
      y: 0,
    });

  const searchResults = useConversationSearch({
    conversations,
    keyword: searchText,
  });

  const filteredConversations = useMemo(
    () =>
      searchResults.map((result) => result.conversation),
    [searchResults]
  );

  const groupedConversations = useMemo(() => {
    const favorites = filteredConversations
      .filter((conversation) => conversation.favorite)
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
      );

    const rest = filteredConversations
      .filter((conversation) => !conversation.favorite)
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
      );

    // 按 projectId 分組（null 表示未分類）
    const groups = new Map<
      string | null,
      Conversation[]
    >();

    rest.forEach((conversation) => {
      const projectId = conversation.projectId ?? null;
      const existingGroup = groups.get(projectId);

      if (existingGroup) {
        existingGroup.push(conversation);
      } else {
        groups.set(projectId, [conversation]);
      }
    });

    const sections = [] as Array<{
      key: string;
      title: string;
      conversations: Conversation[];
    }>;

    if (favorites.length > 0) {
      sections.push({
        key: "favorites",
        title: "⭐ Favorites",
        conversations: favorites,
      });
    }

    if (groupByProject) {
      groups.forEach((conversations, projectId) => {
        const displayName =
          projectId === null
            ? UNCATEGORIZED_PROJECT_DISPLAY
            : `📁 ${projectId}`;

        sections.push({
          key: projectId ?? "uncategorized",
          title: displayName,
          conversations,
        });
      });
    } else {
      sections.push({
        key: "all",
        title: "🗂️ All Conversations",
        conversations: rest,
      });
    }

    return sections;
  }, [filteredConversations, groupByProject]);

  const searchPreviewMap = useMemo(() => {
    return new Map(
      searchResults.map((result) => [
        result.conversation.id,
        result,
      ])
    );
  }, [searchResults]);

  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu({
        id: null,
        x: 0,
        y: 0,
      });
    };

    window.addEventListener("click", handleCloseMenu);

    return () => {
      window.removeEventListener("click", handleCloseMenu);
    };
  }, []);

  const handleRenameRequest = (
    conversationId: string,
    title: string
  ) => {
    setEditingId(conversationId);
    setEditingTitle(title);
    setContextMenu({
      id: null,
      x: 0,
      y: 0,
    });
  };

  // Get the target conversation for context menu
  const targetConversation = contextMenu.id
    ? conversations.find((c) => c.id === contextMenu.id)
    : null;

  return (
    <div
      style={{
        width: 260,
        borderRight: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        background: "#1b1b1b",
      }}
    >
      <button
        onClick={onNewConversation}
        style={{
          margin: 15,
          padding: 12,
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
          background: "#2d7ef7",
          color: "white",
        }}
      >
        ＋ New Conversation
      </button>

      <button
        onClick={() => setShowProjectManager(true)}
        style={{
          margin: "0 15px 15px",
          padding: 10,
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontWeight: 500,
          background: "#2b2b2b",
          color: "white",
          textAlign: "left",
        }}
      >
        📁 Project Manager
      </button>

      <div
        style={{
          padding: "0 15px 15px",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search..."
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #444",
            background: "#2b2b2b",
            color: "white",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 10px 10px",
        }}
      >
        {filteredConversations.length === 0 ? (
          <div
            style={{
              color: "#888",
              padding: 10,
            }}
          >
            沒有符合的 Conversation
          </div>
        ) : (
          groupedConversations.map((group) => (
            <div
              key={group.key}
              style={{
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#8f8f8f",
                  margin: "8px 4px 6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {group.title}
              </div>

              {group.conversations.map((conversation) => {
                const active =
                  conversation.id ===
                  currentConversationId;

                return (
                  <div
                    key={conversation.id}
                    style={{
                      marginBottom: 8,
                    }}
                  >
                    {editingId ===
                    conversation.id ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(
                            event.target.value
                          )
                        }
                        onBlur={() => {
                          onRenameConversation(
                            conversation.id,
                            editingTitle
                          );
                          setEditingId(null);
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            onRenameConversation(
                              conversation.id,
                              editingTitle
                            );
                            setEditingId(null);
                          }

                          if (
                            event.key ===
                            "Escape"
                          ) {
                            setEditingId(null);
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 8,
                          border: "none",
                          boxSizing:
                            "border-box",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() =>
                            onSelectConversation(
                              conversation.id
                            )
                          }
                          onContextMenu={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setContextMenu({
                              id: conversation.id,
                              x: event.clientX,
                              y: event.clientY,
                            });
                          }}
                          style={{
                            flex: 1,
                            textAlign: "left",
                            padding: 12,
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            background: active
                              ? "#2d7ef7"
                              : "#2b2b2b",
                            color: "white",
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            💬 {conversation.title}
                          </div>

                          {searchText.trim() &&
                          showSearchPreview && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 11,
                                color: "#a0e7e5",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {searchPreviewMap.get(
                                conversation.id
                              )?.preview
                                ? `↳ ${searchPreviewMap.get(
                                    conversation.id
                                  )?.preview}`
                                : searchPreviewMap.get(
                                    conversation.id
                                  )?.matchedFields
                                ? `↳ 相符：${searchPreviewMap
                                    .get(conversation.id)
                                    ?.matchedFields.join(
                                      ", "
                                    )}`
                                : "↳ matched"}
                            </div>
                          )}
                        </button>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleFavorite(
                              conversation.id
                            );
                          }}
                          style={{
                            width: 40,
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            background: "#3a3a3a",
                            color: conversation.favorite
                              ? "#ffd166"
                              : "#c7c7c7",
                          }}
                        >
                          {conversation.favorite
                            ? "★"
                            : "☆"}
                        </button>

                        <button
                          onClick={() => {
                            const confirmed =
                              window.confirm(
                                `確定要刪除「${conversation.title}」嗎？`
                              );

                            if (confirmed) {
                              onDeleteConversation(
                                conversation.id
                              );
                            }
                          }}
                          style={{
                            width: 40,
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            background: "#3a3a3a",
                            color: "white",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {contextMenu.id && targetConversation && (
        <div
          role="menu"
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            background: "#2b2b2b",
            border: "1px solid #555",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            minWidth: 140,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              handleRenameRequest(
                targetConversation.id,
                targetConversation.title
              );
            }}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "white",
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            ✏️ Rename
          </button>

          <button
            onClick={() => {
              onToggleFavorite(targetConversation.id);
              setContextMenu({
                id: null,
                x: 0,
                y: 0,
              });
            }}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "white",
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            {targetConversation.favorite
              ? "⭐ Remove from Favorites"
              : "⭐ Add to Favorites"}
          </button>

          <button
            onClick={() => {
              const now = new Date().toISOString();
              const duplicatedConversation = {
                ...targetConversation,
                id: crypto.randomUUID(),
                title: `${targetConversation.title} (Copy)`,
                createdAt: now,
                updatedAt: now,
              };
              onDuplicateConversation(
                duplicatedConversation
              );
              setContextMenu({
                id: null,
                x: 0,
                y: 0,
              });
            }}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "white",
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            📋 Duplicate
          </button>

          <button
            onClick={() => {
              const projectName = window.prompt(
                "請輸入 Project 名稱（留空表示未分類）："
              );

              if (projectName !== null) {
                // 如果輸入為空或全空格，設置為 null（未分類）
                const projectId =
                  projectName.trim() === ""
                    ? null
                    : projectName.trim();

                onMoveConversationToProject(
                  targetConversation.id,
                  projectId
                );
              }

              setContextMenu({
                id: null,
                x: 0,
                y: 0,
              });
            }}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "white",
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            📁 Move to Project
          </button>

          <div
            style={{
              height: 1,
              background: "#444",
              margin: "4px 0",
            }}
          />

          <button
            onClick={async () => {
              const lastUserMessage = [
                ...targetConversation.messages,
              ]
                .reverse()
                .find(
                  (message) =>
                    message.role === "user"
                );

              await runOpenInBrowserWorkflow(
                targetConversation.platform,
                lastUserMessage?.content ?? ""
              );

              setContextMenu({
                id: null,
                x: 0,
                y: 0,
              });
            }}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#87ceeb",
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            🌐 Open in Browser
          </button>
        </div>
      )}

      {showProjectManager && (
        <ProjectManager
          conversations={conversations}
          onRenameProject={onRenameProject}
          onDeleteProject={onDeleteProject}
          onClose={() => setShowProjectManager(false)}
        />
      )}
    </div>
  );
}
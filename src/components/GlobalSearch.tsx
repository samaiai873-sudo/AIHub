import { useEffect, useMemo, useRef, useState } from "react";

import useGlobalSearch from "../hooks/useGlobalSearch";
import type { GlobalSearchResult } from "../hooks/useGlobalSearch";
import type { Conversation } from "../types/conversation";
import type { Prompt } from "../types/prompt";

type GlobalSearchProps = {
  conversations: Conversation[];
  prompts: Prompt[];
  onSelect: (type: "conversation" | "prompt" | "project", id: string) => void;
  onClose: () => void;
};

export default function GlobalSearch({
  conversations,
  prompts,
  onSelect,
  onClose,
}: GlobalSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Extract unique projects from conversations
  const projects = useMemo(() => {
    const projectSet = new Set<string>();
    conversations.forEach((conv) => {
      if (conv.projectId) {
        projectSet.add(conv.projectId);
      }
    });
    return Array.from(projectSet);
  }, [conversations]);

  const results = useGlobalSearch({
    conversations,
    prompts,
    projects,
    keyword,
  });

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelect = (result: GlobalSearchResult) => {
    onSelect(result.type, result.id);
    onClose();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [results, selectedIndex, onClose, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const getTypeIcon = (type: GlobalSearchResult["type"]) => {
    switch (type) {
      case "conversation":
        return "💬";
      case "prompt":
        return "📝";
      case "project":
        return "📁";
    }
  };

  const getTypeColor = (type: GlobalSearchResult["type"]) => {
    switch (type) {
      case "conversation":
        return "#2d7ef7";
      case "prompt":
        return "#8b5cf6";
      case "project":
        return "#f59e0b";
    }
  };

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
        paddingTop: "10vh",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(720px, 90vw)",
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #333",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#888", fontSize: 18 }}>⌘</span>
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="搜尋 Conversation、Prompt、Project... (Cmd/Ctrl+K 開啟)"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: 16,
                outline: "none",
                width: "100%",
              }}
            />
            <span style={{ color: "#666", fontSize: 12 }}>
              {results.length} 結果
            </span>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: 500,
            overflowY: "auto",
          }}
        >
          {results.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#888",
              }}
            >
              {keyword
                ? `找不到包含「${keyword}」的結果`
                : "輸入關鍵字開始搜尋"}
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                data-index={index}
                onClick={() => handleSelect(result)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "none",
                  background:
                    index === selectedIndex ? "#2d2d2d" : "transparent",
                  color: "white",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "background-color 0.1s",
                  borderBottom:
                    index < results.length - 1 ? "1px solid #2a2a2a" : "none",
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 18,
                      marginTop: 1,
                    }}
                  >
                    {getTypeIcon(result.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {result.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: getTypeColor(result.type),
                          color: "white",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {result.type}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#aaa",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {result.subtitle}
                    </div>
                    {result.preview && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: "#888",
                          fontStyle: "italic",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        ↳ {result.preview}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Shortcuts Hint */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid #333",
            background: "#1a1a1a",
          }}
        >
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#666" }}>
            <span>↑↓ 選擇</span>
            <span>Enter 開啟</span>
            <span>Esc 關閉</span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";

import useAppSettings from "../hooks/useAppSettings";
import useApiKeys from "../hooks/useApiKeys";
import { useConversationContext } from "../context/ConversationContext";
import { generateAssistantReply } from "../providers";
import { aiPlatforms } from "../data/aiPlatforms";
import { runOpenInBrowserWorkflow } from "../utils/browserWorkflow";
import {
  exportToMarkdown,
  exportToJSON,
  downloadFile,
  generateConversationFilename,
} from "../utils/conversationExport";

import ConversationSidebar from "./ConversationSidebar";
import MessageList from "./MessageList";
import Composer from "./Composer";

export default function ConversationWorkspace() {
  const [showExportMenu, setShowExportMenu] =
    useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const {
    conversations,
    currentConversation,
    createConversation,
    renameConversation,
    addMessage,
    updateMessage,
    toggleFavorite,
    moveConversationToProject,
    changeConversationPlatform,
    duplicateConversation,
    deleteConversation,
    selectConversation,
    renameProject,
    deleteProject,
  } = useConversationContext();

  const { settings, setLastUsedPlatform } = useAppSettings();
  const { apiKeys } = useApiKeys();

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleNewConversation = () => {
    // Sprint 8：記住最後使用的 AI Platform，新 Conversation 直接沿用
    createConversation(
      "New Conversation",
      settings.lastUsedPlatform ?? undefined
    );
  };

  const handleSend = async (content: string) => {
    if (!currentConversation) return;

    const platform = currentConversation.platform;
    const model = currentConversation.model;
    const selectedApiKey = apiKeys[platform];

    setLastUsedPlatform(platform);

    addMessage(currentConversation.id, {
      role: "user",
      platform: "user",
      model: "",
      content,
    });

    // 分支 2：Provider 未設定 API Key → 新增一則 System Message，不嘗試打 API
    if (!selectedApiKey) {
      const platformLabel =
        aiPlatforms.find((item) => item.id === platform)?.name ?? platform;
      const isGemini = platform === "gemini";

      addMessage(currentConversation.id, {
        role: "system",
        platform,
        model,
        content: [
          `${platformLabel} 尚未設定 API Key，沒辦法直接在這裡顯示回覆。`,
          "",
          "你可以：",
          '1. 到 Settings 貼上 API Key，之後這裡就能直接顯示真實回覆' +
            (isGemini
              ? '（Google AI Studio 可以免費申請 Gemini API Key，不用綁信用卡）'
              : "（這個平台目前沒有永久免費的方案）"),
          '2. 點下面的「🌐 Open in Browser」，把 Prompt 複製過去，在官網上手動貼上對話（完全免費、不用設定）',
        ].join("\n"),
      });

      return;
    }

    // 分支 1 / 3：Provider 已設定，實際打 API。
    // 成功 → 更新成 assistant 訊息；失敗 → 更新成 error 訊息。
    const assistantMessageId = addMessage(currentConversation.id, {
      role: "assistant",
      platform,
      model,
      content: "",
    });

    const reply = await generateAssistantReply({
      platform,
      model,
      prompt: content,
      apiKey: selectedApiKey,
      onChunk: (chunk) => {
        updateMessage(
          currentConversation.id,
          assistantMessageId,
          chunk
        );
      },
    });

    const isError = reply.usedFallback || Boolean(reply.error);

    updateMessage(
      currentConversation.id,
      assistantMessageId,
      reply.content,
      isError ? "error" : "assistant"
    );
  };

  const handleOpenInBrowser = async (content: string) => {
    if (!currentConversation) return;

    const platform = currentConversation.platform;

    // 先把 Prompt 記錄成一則 user message，即使沒有走 API 也留下歷史紀錄
    addMessage(currentConversation.id, {
      role: "user",
      platform: "user",
      model: "",
      content,
    });

    setLastUsedPlatform(platform);

    const { copied, opened } = await runOpenInBrowserWorkflow(
      platform,
      content
    );

    if (!opened) {
      showToast("⚠️ 找不到這個平台的官網網址");
    } else if (copied) {
      showToast("✅ Prompt 已複製到剪貼簿，貼上即可送出");
    } else {
      showToast("已開啟官網，但複製剪貼簿失敗，請手動複製 Prompt");
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        background: "#202020",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={
          currentConversation?.id ?? null
        }
        onNewConversation={handleNewConversation}
        onSelectConversation={selectConversation}
        onRenameConversation={renameConversation}
        onToggleFavorite={toggleFavorite}
        onMoveConversationToProject={moveConversationToProject}
        onDeleteConversation={deleteConversation}
        onDuplicateConversation={duplicateConversation}
        onRenameProject={renameProject}
        onDeleteProject={deleteProject}
        showSearchPreview={settings.showSearchPreview}
        groupByProject={settings.groupByProject}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #333",
            fontWeight: "bold",
            fontSize: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {currentConversation
              ? `💬 ${currentConversation.title}`
              : "💬 請建立一個 Conversation"}
          </div>

          {currentConversation && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <select
                value={currentConversation.platform}
                onChange={(event) => {
                  const nextPlatform = event.target.value;
                  const nextPlatformInfo = aiPlatforms.find(
                    (item) => item.id === nextPlatform
                  );

                  changeConversationPlatform(
                    currentConversation.id,
                    nextPlatform,
                    nextPlatformInfo?.models[0]?.id
                  );
                }}
                title="切換這個 Conversation 使用的 AI Platform"
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #555",
                  background: "#2b2b2b",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {aiPlatforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.icon} {platform.name}
                  </option>
                ))}
              </select>

              {(() => {
                const currentPlatformInfo = aiPlatforms.find(
                  (item) => item.id === currentConversation.platform
                );

                if (!currentPlatformInfo || currentPlatformInfo.models.length <= 1) {
                  return null;
                }

                return (
                  <select
                    value={currentConversation.model}
                    onChange={(event) => {
                      changeConversationPlatform(
                        currentConversation.id,
                        currentConversation.platform,
                        event.target.value
                      );
                    }}
                    title="切換 Model"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #555",
                      background: "#2b2b2b",
                      color: "white",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    {currentPlatformInfo.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                );
              })()}

              <div style={{ position: "relative" }}>
              <button
                onClick={() =>
                  setShowExportMenu(!showExportMenu)
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #555",
                  background: "#2b2b2b",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                📥 Export
              </button>

              {showExportMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 8,
                    background: "#2b2b2b",
                    border: "1px solid #555",
                    borderRadius: 6,
                    boxShadow:
                      "0 4px 12px rgba(0, 0, 0, 0.3)",
                    zIndex: 100,
                    minWidth: 160,
                  }}
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <button
                    onClick={() => {
                      const markdown = exportToMarkdown(
                        currentConversation
                      );
                      const filename =
                        generateConversationFilename(
                          currentConversation,
                          "md"
                        );
                      downloadFile(markdown, filename);
                      setShowExportMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "none",
                      background: "transparent",
                      color: "white",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "6px 6px 0 0",
                    }}
                  >
                    📄 Markdown
                  </button>

                  <button
                    onClick={() => {
                      const json = exportToJSON(
                        currentConversation
                      );
                      const filename =
                        generateConversationFilename(
                          currentConversation,
                          "json"
                        );
                      downloadFile(
                        json,
                        filename,
                        "application/json"
                      );
                      setShowExportMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "none",
                      background: "transparent",
                      color: "white",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "0 0 6px 6px",
                    }}
                  >
                    📋 JSON
                  </button>
                </div>
              )}
              </div>
            </div>
          )}
        </div>

        {showExportMenu && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
            onClick={() => setShowExportMenu(false)}
          />
        )}

        <MessageList
          messages={
            currentConversation?.messages ?? []
          }
        />

        {currentConversation ? (
          <Composer
            onSend={handleSend}
            onOpenInBrowser={handleOpenInBrowser}
            isFreeMode={!apiKeys[currentConversation.platform]}
          />
        ) : (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "#888",
              borderTop: "1px solid #333",
            }}
          >
            點擊左側「＋ New Conversation」開始聊天。
          </div>
        )}

        {toast && (
          <div
            style={{
              position: "absolute",
              bottom: 90,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#2b2b2b",
              border: "1px solid #555",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 14,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              zIndex: 200,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
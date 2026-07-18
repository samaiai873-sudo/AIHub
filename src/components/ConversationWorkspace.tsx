import { useState, useCallback } from "react";

import useAppSettings from "../hooks/useAppSettings";
import useApiKeys from "../hooks/useApiKeys";
import { useConversationContext } from "../context/useConversationContext";
import { generateAssistantReply } from "../providers";
import { aiPlatforms } from "../data/aiPlatforms";
import {
  exportToMarkdown,
  exportToJSON,
  downloadFile,
  generateConversationFilename,
} from "../utils/conversationExport";
import { isPlatform, type Platform } from "../constants/platforms";
import { matchRoutingRule, stripRoutingPrefix } from "../constants/routing";
import { getDefaultModel } from "../constants/models";

import ConversationSidebar from "./ConversationSidebar";
import MessageList from "./MessageList";
import Composer from "./Composer";
import CompareView from "./CompareView";

export default function ConversationWorkspace() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Sprint 10: Compare Responses
  const [showCompareView, setShowCompareView] = useState(false);
  const [comparePrompt, setComparePrompt] = useState("");
  const [compareModels, setCompareModels] = useState<{ platform: string; model: string }[]>([]);

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

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const handleComparePickWinner = useCallback((platform: string, model: string, content: string) => {
    // 將選中的回覆加入當前對話
    if (currentConversation) {
      addMessage(currentConversation.id, {
        role: "assistant",
        platform,
        model,
        content,
      });
      setShowCompareView(false);
      showToast(`✅ 已採用 ${platform} (${model}) 的回覆`);
    }
  }, [currentConversation, addMessage, showToast]);

  const handleNewConversation = () => {
    // Sprint 8：記住最後使用的 AI Platform，新 Conversation 直接沿用
    createConversation(
      "New Conversation",
      settings.lastUsedPlatform ?? undefined
    );
  };

  const handleSend = async (content: string, platform?: string, model?: string) => {
    if (!currentConversation) return;

    // Sprint 9: Conversation Routing — 優先匹配路由規則，可覆蓋 Composer 選擇與對話預設值
    const routingRule = matchRoutingRule(content, settings.routingRules);
    let targetPlatform: Platform;
    let targetModel: string;

    if (routingRule) {
      // 路由規則命中：使用規則指定的平台/模型，並移除前綴
      targetPlatform = routingRule.targetPlatform;
      targetModel = routingRule.targetModel ?? getDefaultModel(targetPlatform);
      content = stripRoutingPrefix(content, routingRule);
      setLastUsedPlatform(targetPlatform);
    } else {
      // 無路由規則：優先使用 Composer 選擇的 platform/model，否則 fallback 到對話預設值
      const platformParam = platform || "";
      targetPlatform = isPlatform(platformParam) ? platformParam : currentConversation.platform;
      targetModel = model || currentConversation.model;
      setLastUsedPlatform(targetPlatform);
    }

    const selectedApiKey = apiKeys[targetPlatform];

    addMessage(currentConversation.id, {
      role: "user",
      platform: "user",
      model: "",
      content,
    });

    // 分支 2：Provider 未設定 API Key → 新增一則 System Message，不嘗試打 API
    if (!selectedApiKey) {
      const platformLabel =
        aiPlatforms.find((item) => item.id === targetPlatform)?.name ?? targetPlatform;
      const isGemini = targetPlatform === "gemini";

      addMessage(currentConversation.id, {
        role: "system",
        platform: targetPlatform,
        model: targetModel,
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
      platform: targetPlatform,
      model: targetModel,
      content: "",
    });

    const reply = await generateAssistantReply({
      platform: targetPlatform,
      model: targetModel,
      prompt: content,
      apiKey: selectedApiKey,
      onChunk: (chunk) => {
        updateMessage(
          currentConversation.id,
          assistantMessageId,
          chunk
        );
      },
      customModels: settings.customModels ?? [],
    });

    const isError = reply.usedFallback || Boolean(reply.error);

    updateMessage(
      currentConversation.id,
      assistantMessageId,
      reply.content,
      isError ? "error" : "assistant"
    );
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
              {/* Compare Button */}
              <button
                onClick={() => {
                  // 開啟 Compare View，預設比較當前對話平台 + 另外兩個平台
                  const currentPlatform = currentConversation.platform;
                  const currentModel = currentConversation.model;
                  const otherPlatforms = aiPlatforms
                    .filter((p) => p.id !== currentPlatform)
                    .slice(0, 2); // 取前兩個其他平台
                  setComparePrompt(""); // 空 prompt 讓使用者輸入，或可預填最後一條 user message
                  setCompareModels([
                    { platform: currentPlatform, model: currentModel },
                    ...otherPlatforms.map((p) => ({
                      platform: p.id,
                      model: p.models[0]?.id || "",
                    })),
                  ]);
                  setShowCompareView(true);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #555",
                  background: "#2b2b2b",
                  color: "#2d7ef7",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                📊 Compare
              </button>

              <select
                value={currentConversation.platform}
                onChange={(event) => {
                  const nextPlatform = event.target.value;

                  // 自訂模型：platform 格式為 "custom:<id>"
                  if (nextPlatform.startsWith("custom:")) {
                    const customId = nextPlatform.slice("custom:".length);
                    const customModel = settings.customModels.find(
                      (m) => m.id === customId
                    );
                    changeConversationPlatform(
                      currentConversation.id,
                      nextPlatform,
                      customModel?.modelId
                    );
                    return;
                  }

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
                {settings.customModels.length > 0 && (
                  <optgroup label="自訂模型">
                    {settings.customModels.map((custom) => (
                      <option
                        key={`custom:${custom.id}`}
                        value={`custom:${custom.id}`}
                      >
                        🛠 {custom.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {(() => {
                // 自訂模型：顯示單一模型選項（讓使用者知道目前綁定的 modelId）
                if (currentConversation.platform.startsWith("custom:")) {
                  const customId = currentConversation.platform.slice("custom:".length);
                  const customModel = settings.customModels.find(
                    (m) => m.id === customId
                  );
                  if (!customModel) return null;
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
                      title="自訂模型 ID（可在 Settings 修改）"
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
                      <option value={customModel.modelId}>
                        {customModel.modelId}
                      </option>
                    </select>
                  );
                }

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

        <MessageList
          messages={
            currentConversation?.messages ?? []
          }
        />

        {currentConversation ? (
          <Composer
            onSend={handleSend}
            isFreeMode={
              currentConversation.platform.startsWith("custom:")
                ? (() => {
                    const cm = settings.customModels.find(
                      (m) =>
                        m.id ===
                        currentConversation.platform.slice("custom:".length)
                    );
                    return !cm?.apiKey;
                  })()
                : !apiKeys[currentConversation.platform]
            }
            defaultPlatform={currentConversation.platform}
            defaultModel={currentConversation.model}
            customModels={settings.customModels}
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
      </div>

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

      {/* Compare View Modal */}
      {showCompareView && (
        <CompareView
          prompt={comparePrompt}
          selectedModels={compareModels}
          onClose={() => setShowCompareView(false)}
          onPickWinner={handleComparePickWinner}
        />
      )}
    </div>
  );
}
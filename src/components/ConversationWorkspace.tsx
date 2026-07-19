import { useState, useCallback, useEffect } from "react";

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
import { isCustomPlatformId, isValidPlatformId, type Platform } from "../constants/platforms";
import { matchRoutingRule, stripRoutingPrefix } from "../constants/routing";
import { getDefaultModel } from "../constants/models";

import ConversationSidebar from "./ConversationSidebar";
import MessageList from "./MessageList";
import Composer from "./Composer";
import CompareView from "./CompareView";
import ReplyTargetBar, {
  type ReplyTargets,
  TARGET_SLOTS,
} from "./ReplyTargetBar";

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

  // Sprint 16: 多模型同時回答 — 上方 4 欄 AI 選擇，每個可 N/A
  const [replyTargets, setReplyTargets] = useState<ReplyTargets>(() => {
    try {
      const saved = localStorage.getItem("aihub-reply-targets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === TARGET_SLOTS) {
          return parsed;
        }
      }
    } catch {
      // ignore parse error
    }
    return Array(TARGET_SLOTS).fill(null);
  });

  // 持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem("aihub-reply-targets", JSON.stringify(replyTargets));
    } catch {
      // ignore
    }
  }, [replyTargets]);

  const activeTargets = replyTargets.filter(
    (t): t is { platform: string; model: string } => t !== null
  );
  const hasActiveTarget = activeTargets.length > 0;

  /**
   * 對單一 target 跑一次 AI 回覆，把 streaming 寫入指定 message id。
   */
  const runReplyForTarget = async (
    convId: string,
    msgId: string,
    targetPlatform: string,
    targetModel: string,
    prompt: string
  ) => {
    // 取得 API Key：內建走 apiKeys，custom 走 customModels 設定
    let apiKey: string | undefined;
    if (isCustomPlatformId(targetPlatform)) {
      const customId = targetPlatform.slice("custom:".length);
      apiKey = settings.customModels?.find((m) => m.id === customId)?.apiKey;
    } else {
      apiKey = apiKeys[targetPlatform as Platform];
    }

    if (!apiKey) {
      const label =
        aiPlatforms.find((item) => item.id === targetPlatform)?.name ??
        targetPlatform;
      updateMessage(
        convId,
        msgId,
        `⚠️ ${label} 尚未設定 API Key，請至 Settings 設定。`,
        "error"
      );
      return;
    }

    const reply = await generateAssistantReply({
      platform: targetPlatform,
      model: targetModel,
      prompt,
      apiKey,
      onChunk: (chunk) => updateMessage(convId, msgId, chunk),
      customModels: settings.customModels ?? [],
    });

    const isError = reply.usedFallback || Boolean(reply.error);
    updateMessage(convId, msgId, reply.content, isError ? "error" : "assistant");
  };

  const handleSend = async (content: string, platform?: string, model?: string) => {
    if (!currentConversation) return;
    const convId = currentConversation.id;

    // Sprint 9: Conversation Routing — 路由命中時會覆蓋掉多模型回覆（路由是更明確的指令）
    const routingRule = matchRoutingRule(content, settings.routingRules);
    if (routingRule) {
      content = stripRoutingPrefix(content, routingRule);
    }

    addMessage(convId, {
      role: "user",
      platform: "user",
      model: "",
      content,
    });

    // 分支 A：多模型同時回答（有非 N/A target 且沒被路由覆蓋）
    if (!routingRule && hasActiveTarget) {
      const assistantMessages = activeTargets.map((t) => ({
        target: t,
        msgId: addMessage(convId, {
          role: "assistant",
          platform: t.platform,
          model: t.model,
          content: "",
        }),
      }));

      // 並行打 API（每個 streaming 寫到各自的 message）
      await Promise.all(
        assistantMessages.map(({ target, msgId }) =>
          runReplyForTarget(convId, msgId, target.platform, target.model, content)
        )
      );
      return;
    }

    // 分支 B：原本單一回覆邏輯
    let targetPlatform: string;
    let targetModel: string;

    if (routingRule) {
      targetPlatform = routingRule.targetPlatform;
      const routedPlatform = isValidPlatformId(targetPlatform)
        ? targetPlatform
        : (targetPlatform as Platform);
      targetModel = routingRule.targetModel ?? getDefaultModel(routedPlatform);
    } else {
      const platformParam = platform || "";
      targetPlatform = isValidPlatformId(platformParam)
        ? platformParam
        : currentConversation.platform;
      targetModel = model || currentConversation.model;
    }

    if (!isCustomPlatformId(targetPlatform)) {
      setLastUsedPlatform(targetPlatform as Platform);
    }

    let selectedApiKey: string | undefined;
    if (isCustomPlatformId(targetPlatform)) {
      const customId = targetPlatform.slice("custom:".length);
      selectedApiKey = settings.customModels?.find((m) => m.id === customId)?.apiKey;
    } else {
      selectedApiKey = apiKeys[targetPlatform as Platform];
    }

    if (!selectedApiKey) {
      const platformLabel =
        aiPlatforms.find((item) => item.id === targetPlatform)?.name ?? targetPlatform;
      const isGemini = targetPlatform === "gemini";

      addMessage(convId, {
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

    const assistantMessageId = addMessage(convId, {
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
        updateMessage(convId, assistantMessageId, chunk);
      },
      customModels: settings.customModels ?? [],
    });

    const isError = reply.usedFallback || Boolean(reply.error);
    updateMessage(
      convId,
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

        {currentConversation && (
          <ReplyTargetBar
            targets={replyTargets}
            onTargetsChange={setReplyTargets}
            customModels={settings.customModels ?? []}
          />
        )}

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
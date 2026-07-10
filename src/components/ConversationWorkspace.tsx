import useConversations from "../hooks/useConversations";

import ConversationSidebar from "./ConversationSidebar";
import MessageList from "./MessageList";
import Composer from "./Composer";

export default function ConversationWorkspace() {
  const {
    conversations,
    currentConversation,
    createConversation,
    addMessage,
    selectConversation,
  } = useConversations();

  const handleNewConversation = () => {
    createConversation();
  };

  const handleSend = (content: string) => {
    if (!currentConversation) return;

    addMessage(currentConversation.id, {
      role: "user",
      platform: "user",
      model: "",
      content,
    });

    addMessage(currentConversation.id, {
      role: "assistant",
      platform: "ChatGPT",
      model: "GPT-5",
      content:
        "🤖 這是一則測試回覆。\n\n下一步我們會接上真正的 AI API。",
    });
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
        onSelectConversation={
          selectConversation
        }
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 20,
            borderBottom: "1px solid #333",
            fontWeight: "bold",
            fontSize: 20,
          }}
        >
          {currentConversation
            ? `💬 ${currentConversation.title}`
            : "💬 請建立一個 Conversation"}
        </div>

        <MessageList
          messages={
            currentConversation?.messages ?? []
          }
        />

        {currentConversation ? (
          <Composer
            onSend={handleSend}
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
    </div>
  );
}
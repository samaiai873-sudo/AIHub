import type { Conversation } from "../types/conversation";

type ConversationSidebarProps = {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
};

export default function ConversationSidebar({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
}: ConversationSidebarProps) {
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
        }}
      >
        ＋ New Conversation
      </button>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 10px 10px",
        }}
      >
        {conversations.length === 0 ? (
          <div
            style={{
              color: "#888",
              padding: 10,
            }}
          >
            尚無 Conversation
          </div>
        ) : (
          conversations.map((conversation) => {
            const active =
              conversation.id === currentConversationId;

            return (
              <button
                key={conversation.id}
                onClick={() =>
                  onSelectConversation(
                    conversation.id
                  )
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  marginBottom: 8,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: active
                    ? "#2d7ef7"
                    : "#2b2b2b",
                  color: "white",
                }}
              >
                💬 {conversation.title}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
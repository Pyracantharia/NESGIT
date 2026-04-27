import MessageComposer from "./MessageComposer.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

export default function ChatWindow({
  activeRoom,
  messages,
  loadingMessages,
  typingText,
  onSend,
  onTypingChange,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}) {
  const reactionOrder = ["LIKE", "LOVE", "LAUGH", "DISLIKE"];
  const reactionLabelByType = {
    LIKE: "👍 Like",
    LOVE: "❤️ Love",
    LAUGH: "😂 Laugh",
    DISLIKE: "👎 Dislike",
  };

  function formatTime(value) {
    if (!value) return "";
    try {
      return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white">
        <h2 className="h6 mb-0">
          {activeRoom ? activeRoom.name || `Room ${activeRoom.id}` : "Select a room"}
        </h2>
      </div>
      <div className="card-body chat-window-body">
        {activeRoom ? (
          loadingMessages ? (
            <div className="text-muted">Loading messages...</div>
          ) : messages.length > 0 ? (
            <div className="d-flex flex-column gap-2">
              {messages.map((message) => (
                <div key={message.id} className="p-2 rounded border">
                  <div className="small text-muted mb-1 d-flex justify-content-between">
                    <span style={{ color: message.user?.color || "#94a3b8" }}>
                      {message.user?.username || message.user?.email || message.userId}
                    </span>
                    <span>{formatTime(message.createdAt)}</span>
                  </div>
                  <div>{message.content}</div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {reactionOrder.map((reactionType) => {
                      const reactions = (message.reactions || []).filter(
                        (reaction) => reaction.type === reactionType,
                      );
                      const hasReacted = reactions.some(
                        (reaction) => reaction.userId === currentUserId,
                      );
                      const names = reactions
                        .map(
                          (reaction) =>
                            reaction.user?.username || reaction.user?.id || reaction.userId,
                        )
                        .join(", ");
                      const count = reactions.length;
                      const title = names || `No ${reactionLabelByType[reactionType].toLowerCase()} yet`;

                      return (
                        <button
                          key={`${message.id}_${reactionType}`}
                          type="button"
                          className={`btn btn-sm ${hasReacted ? "btn-primary" : "btn-outline-secondary"}`}
                          title={title}
                          onClick={() =>
                            hasReacted
                              ? onRemoveReaction?.(message.id, reactionType)
                              : onAddReaction?.(message.id, reactionType)
                          }
                        >
                          {reactionLabelByType[reactionType]} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted">No messages yet in this room.</div>
          )
        ) : (
          <div className="text-muted">Use the left panel to create or join a room.</div>
        )}
      </div>
      <TypingIndicator text={typingText} />
      <MessageComposer disabled={!activeRoom} onSend={onSend} onTypingChange={onTypingChange} />
    </div>
  );
}

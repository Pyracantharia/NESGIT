import MessageComposer from "./MessageComposer.jsx";

export default function ChatWindow({ activeRoom, messages, loadingMessages, onSend }) {
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
      <MessageComposer disabled={!activeRoom} onSend={onSend} />
    </div>
  );
}

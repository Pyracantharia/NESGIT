import { useState } from "react";

export default function MessageComposer({ disabled, onSend, onTypingChange }) {
  const [draft, setDraft] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !onSend) {
      return;
    }
    if (onTypingChange) {
      onTypingChange(false);
    }
    await onSend(content);
    setDraft("");
  }

  return (
    <form className="border-top p-3" onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          className="form-control"
          placeholder={disabled ? "Join a room to write" : "Write a message"}
          value={draft}
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            if (onTypingChange) {
              onTypingChange(Boolean(value.trim()));
            }
          }}
          disabled={disabled}
        />
        <button className="btn btn-primary" type="submit" disabled={disabled}>
          Send
        </button>
      </div>
    </form>
  );
}

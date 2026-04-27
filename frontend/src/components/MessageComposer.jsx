import { useState } from "react";

export default function MessageComposer({ disabled, onSend }) {
  const [draft, setDraft] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !onSend) {
      return;
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
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled}
        />
        <button className="btn btn-primary" type="submit" disabled={disabled}>
          Send
        </button>
      </div>
    </form>
  );
}

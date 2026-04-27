export default function TypingIndicator({ text }) {
  return (
    <div className="px-3 py-2 border-top">
      <div className={`small ${text ? "text-muted" : "typing-placeholder"}`}>
        {text || "placeholder"}
      </div>
    </div>
  );
}

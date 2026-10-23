// The chat column: transcript + composer.
import { useEffect, useRef, useState } from "react";
import type { useDeskChat } from "./useDeskChat";
import { MessageView } from "./MessageView";

const STARTERS = [
  "Build a triage dashboard on the canvas with filters by status and priority",
  "Add a pie chart of tickets by priority next to the existing charts",
  "Make the dock show the selected ticket with a comment form",
  "Add an auto-refreshing activity feed to the rail",
  "Show me only the urgent open tickets in the canvas table",
];

export function ChatPanel({ chat }: { chat: ReturnType<typeof useDeskChat> }) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  // Block body on purpose: newer browsers make scrollIntoView() return a
  // Promise, and an effect must return nothing or a cleanup function.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [chat.messages]);

  const send = (value: string) => {
    if (!value.trim() || chat.streaming) return;
    chat.sendText(value.trim());
    setText("");
  };

  return (
    <section className="chat" aria-label="Chat">
      <div className="chat__log">
        {chat.messages.length === 0 ? (
          <div className="chat__starters">
            <p>Ask the agent to build or change any surface:</p>
            {STARTERS.map((s) => (
              <button key={s} className="ou-btn ou-btn--ghost" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
        {chat.messages.map((m, i) => (
          <MessageView key={m.id} message={m} streaming={chat.streaming && i === chat.messages.length - 1} />
        ))}
        {chat.error ? <p className="chat__error">⚠ {chat.error.message}</p> : null}
        <div ref={end} />
      </div>
      <form
        className="chat__composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <textarea
          value={text}
          placeholder="Ask, or describe a change to a surface…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
        />
        {chat.streaming ? (
          <button type="button" className="ou-btn ou-btn--secondary" onClick={() => chat.stop()}>
            Stop
          </button>
        ) : (
          <button type="submit" className="ou-btn ou-btn--primary">
            Send
          </button>
        )}
      </form>
    </section>
  );
}

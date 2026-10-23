// ─────────────────────────────────────────────────────────────────────────────
// OBSERVABILITY (feature #19). @openuidev/observability is a tiny event bus
// shared by the whole app. Every <Renderer> publishes to it by default
// (`publishObservability` defaults to true): "OpenUI Lang is streaming",
// "settled", "settled with N errors" (with the parse metadata and errors).
// The OpenUI DevTools drawer (mounted in main.tsx) reads the same bus.
//
// Here we (1) listen to everything — the hook point for Sentry/Datadog — and
// (2) publish our OWN events (workspace loaded, patch applied…, see
// ./app-events.ts), which then also show up in DevTools.
// ─────────────────────────────────────────────────────────────────────────────
import { observability } from "@openuidev/observability";
import { useEffect, useState } from "react";

interface Row {
  at: string;
  level: string;
  text: string;
}

export function EventLog() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(
    () =>
      observability.listenAll((event) => {
        const detail = event.detail as { kind?: string; message?: string };
        const row = { at: new Date().toLocaleTimeString(), level: event.level, text: `${detail.kind ?? "event"} — ${detail.message ?? ""}` };
        setRows((prev) => [row, ...prev].slice(0, 80));
      }),
    [],
  );
  return (
    <div className="event-log">
      {rows.length === 0 ? <p className="surface__empty">No events yet. Interact with a surface or chat.</p> : null}
      {rows.map((r, i) => (
        <div key={i} className={`event-log__row event-log__row--${r.level}`}>
          <time>{r.at}</time> <b>{r.level}</b> {r.text}
        </div>
      ))}
    </div>
  );
}

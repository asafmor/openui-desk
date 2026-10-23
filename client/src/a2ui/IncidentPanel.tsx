// ─────────────────────────────────────────────────────────────────────────────
// A2UI (feature #18) — the RENDERER side. Fully isolated from the rest of the
// app: different protocol, different library (incidentLibrary), no chat.
//
//   server ──SSE──► client.process(envelope)  → surface store (statements + data model)
//   <A2UIRenderer> subscribes to the surface and renders its OpenUI Lang
//   click @Acknowledge("you") ──► client emits an `action` envelope via
//   onMessage ──POST /a2ui/action──► server pushes new envelopes back
//
// A new A2UI client per connection keeps React StrictMode (double effects)
// and reconnects from colliding with an already-created surface.
// ─────────────────────────────────────────────────────────────────────────────
import { createA2UIClient, type A2UIClient } from "@openuidev/a2ui";
import { A2UIRenderer } from "@openuidev/a2ui/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SERVER_URL } from "../config";
import { incidentLibrary } from "./incident-library";

function postAction(message: unknown) {
  void fetch(`${SERVER_URL}/a2ui/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}

function useIncidentClient(): A2UIClient | null {
  const [client, setClient] = useState<A2UIClient | null>(null);
  useEffect(() => {
    const c = createA2UIClient({
      schema: incidentLibrary.toJSONSchema(),
      rootName: incidentLibrary.root,
      // Everything the renderer sends to the agent arrives here (actions AND
      // protocol errors); only actions go to the server.
      onMessage: (msg) => {
        if ("action" in msg) postAction(msg);
        else console.warn("A2UI renderer message", msg);
      },
    });
    const source = new EventSource(`${SERVER_URL}/a2ui/stream`);
    source.onmessage = (e) => void c.process(JSON.parse(e.data));
    setClient(c);
    return () => {
      source.close();
      c.dispose();
    };
  }, []);
  return client;
}

function IncidentSurface({ client }: { client: A2UIClient }) {
  // The server picks the surface id (it changes on Restart), so read it from the store.
  // (Wrap client.subscribe: it is a class method and needs its `this`.)
  const surfaceId = useSyncExternalStore(
    (onChange) => client.subscribe(onChange),
    () => client.getSurfaces()[0]?.surfaceId ?? null,
  );
  if (!surfaceId) return <p className="surface__empty">Connecting to the incident feed…</p>;
  return <A2UIRenderer client={client} surfaceId={surfaceId} library={incidentLibrary} />;
}

export function IncidentPanel() {
  const client = useIncidentClient();
  return client ? <IncidentSurface client={client} /> : null;
}

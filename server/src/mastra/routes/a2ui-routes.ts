// ─────────────────────────────────────────────────────────────────────────────
// A2UI transport: Server-Sent Events down, plain POST up.
//
//   GET  /a2ui/stream  → text/event-stream, one A2UI envelope per `data:` line
//   POST /a2ui/action  → an `action` envelope from the browser's A2UI client
//
// Envelopes are validated with the package's strict Zod schemas
// (`actionMessageSchema`) — the browser is untrusted.
// ─────────────────────────────────────────────────────────────────────────────
import { registerApiRoute } from "@mastra/core/server";
import { actionMessageSchema } from "@openuidev/a2ui";
import { IncidentSession } from "../../a2ui/incident-session";

/** Live sessions by their CURRENT surface id. */
const sessions = new Map<string, IncidentSession>();

export const a2uiStreamRoute = registerApiRoute("/a2ui/stream", {
  method: "GET",
  handler: async () => {
    const encoder = new TextEncoder();
    let session: IncidentSession;
    const body = new ReadableStream({
      start(controller) {
        session = new IncidentSession((msg) => {
          // Keep the lookup table in sync when Restart swaps the surface id.
          if ("createSurface" in msg) sessions.set(msg.createSurface.surfaceId, session);
          if ("deleteSurface" in msg) sessions.delete(msg.deleteSurface.surfaceId);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        });
        session.start();
      },
      cancel() {
        session.stop();
        sessions.delete(session.surfaceId);
      },
    });
    return new Response(body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  },
});

export const a2uiActionRoute = registerApiRoute("/a2ui/action", {
  method: "POST",
  handler: async (c) => {
    const parsed = actionMessageSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ issues: parsed.error.issues }, 400);
    const { surfaceId, name, context } = parsed.data.action;
    const session = sessions.get(surfaceId);
    if (!session) return c.json({ error: `No live surface ${surfaceId}` }, 404);
    session.handleAction(name, context as Record<string, unknown> | undefined);
    return c.json({ ok: true });
  },
});

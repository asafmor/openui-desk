// ─────────────────────────────────────────────────────────────────────────────
// Per-request workspace data inside Mastra's RequestContext.
//
// How it gets here: the browser's chat transport sends
//     { messages, requestContext: { surfaces: SurfaceSnapshot[] } }
// (client/src/chat/chat-transport.ts). Mastra's server turns the body's
// `requestContext` object into a RequestContext, and chatRoute passes that
// SAME instance to:
//   • the agent's `instructions` function  → ./prompt/surface-context.ts
//   • every tool's execute(input, context) → ./tools/update-surface.ts
// The instance lives for one request, so the update_surface tool can record
// accepted patches and a second call in the same turn sees the new program.
// ─────────────────────────────────────────────────────────────────────────────
import type { SurfaceSnapshot } from "@demo/shared/protocol/chat-request";
import type { RequestContext } from "@mastra/core/request-context";

const KEY = "surfaces";

export function getSurfaces(ctx: RequestContext | undefined): SurfaceSnapshot[] {
  const value = ctx?.get(KEY);
  return Array.isArray(value) ? (value as SurfaceSnapshot[]) : [];
}

export function setSurfaceProgram(ctx: RequestContext | undefined, id: string, program: string) {
  if (!ctx) return;
  const next = getSurfaces(ctx).map((s) => (s.id === id ? { ...s, program, errors: [] } : s));
  ctx.set(KEY, next);
}

/** set_surface_state accepted → later tool calls in this turn see the new $state. */
export function setSurfaceStateValues(ctx: RequestContext | undefined, ids: string[], values: Record<string, unknown>) {
  if (!ctx) return;
  const next = getSurfaces(ctx).map((s) => (ids.includes(s.id) ? { ...s, state: { ...s.state, ...values } } : s));
  ctx.set(KEY, next);
}

// ─────────────────────────────────────────────────────────────────────────────
// Extra data the browser sends with EVERY chat request, next to `messages`.
//
// Why: the model can only edit surfaces it can see. In edit mode (feature #8)
// it writes patches against "the current program", so each request carries
// the current program of every surface, its live $state, and any render
// errors (feature #13: "send the structured error list in the next request").
//
// Client: client/src/chat/chat-transport.ts puts it into the request body.
// Server: Mastra's chatRoute (server/src/mastra/index.ts) turns body.requestContext
//         into the agent's RequestContext, where the prompt and the tools use it
//         (server/src/mastra/request-context.ts).
// ─────────────────────────────────────────────────────────────────────────────
import type { SurfaceId } from "../surfaces";

/** A trimmed OpenUIError: just what the model needs to fix its program. */
export interface SurfaceError {
  code: string;
  statementId?: string;
  message: string;
  hint?: string;
}

export interface SurfaceSnapshot {
  id: SurfaceId;
  /** Current OpenUI Lang program ("" when the surface is still empty). */
  program: string;
  /** Renderer state: { $var: value, formName: { field: { value, componentType } } }. */
  state: Record<string, unknown>;
  errors: SurfaceError[];
}

export interface ChatRequestExtras {
  surfaces: SurfaceSnapshot[];
}

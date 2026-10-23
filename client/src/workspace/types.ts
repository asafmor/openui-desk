// ─────────────────────────────────────────────────────────────────────────────
// THE WORKSPACE — everything needed to resume exactly where the user left off.
//
// This answers "can a long-lived OpenUI interface be serialized and mounted
// again later?" — yes, because an OpenUI interface is just DATA:
//
//   program  (OpenUI Lang text)          → what to render     (the model wrote it)
//   state    (Renderer state snapshot)   → what the user did  ($filters, form inputs, open modal…)
//
// Re-mounting = <Renderer response={program} initialState={state}>; queries
// then re-fetch live data. Nothing else is required.
//
// Saved as JSON by ./serialize.ts (surfaces written in OpenUI's stored-message
// format), autosaved to localStorage and exportable/importable as a file
// (./storage.ts).
// ─────────────────────────────────────────────────────────────────────────────
import type { SurfaceError } from "@demo/shared/protocol/chat-request";
import type { SurfaceId } from "@demo/shared/surfaces";
import type { UIMessage } from "ai";

export interface SurfaceVersion {
  program: string;
  summary: string;
  at: string;
}

export interface SurfaceRecord {
  program: string;
  /** Raw snapshot from <Renderer onStateUpdate>: { $var: value, formName: {...} }. */
  state: Record<string, unknown>;
  /** Previous programs, newest last — powers Undo ("malleable" UI with history). */
  history: SurfaceVersion[];
}

export interface Artifact {
  id: string;
  title: string;
  program: string;
  version: number;
  at: string;
}

export interface Note {
  id: string;
  text: string;
  at: string;
}

export interface Workspace {
  id: string;
  name: string;
  surfaces: Record<SurfaceId, SurfaceRecord>;
  /** The AI SDK chat transcript, including tool calls and their results. */
  chat: UIMessage[];
  /** Renderer state of inline UIs inside chat messages, keyed "messageId:segment". */
  inlineState: Record<string, Record<string, unknown>>;
  artifacts: Artifact[];
  /** Backing store of the browser-only tools list_notes / add_note. */
  notes: Note[];
  /** update_surface / publish_artifact tool calls already applied (idempotency). */
  appliedToolCalls: string[];
}

/** Runtime-only data, NOT serialized: render errors are recomputed on mount. */
export type SurfaceErrors = Partial<Record<SurfaceId, SurfaceError[]>>;

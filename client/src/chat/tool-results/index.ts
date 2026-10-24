// ─────────────────────────────────────────────────────────────────────────────
// TOOL RESULT REGISTRY: agent tool name → applier, one file per tool.
//
// Adding client-side handling for a new agent tool:
//   1. write ./<tool-name>.ts exporting a ToolResultApplier (pure function:
//      tool output → workspace actions; testable without React)
//   2. add it below
// Tools not listed here (e.g. the read-only list_tickets) change nothing on
// the client; they still show in the chat (../ToolCallView.tsx).
// ─────────────────────────────────────────────────────────────────────────────
import { applyPublishArtifact } from "./publish-artifact";
import { applySetSurfaceState } from "./set-surface-state";
import type { ToolResultApplier } from "./types";
import { applyUpdateSurface } from "./update-surface";

export const TOOL_RESULT_APPLIERS: Record<string, ToolResultApplier> = {
  update_surface: applyUpdateSurface,
  set_surface_state: applySetSurfaceState,
  publish_artifact: applyPublishArtifact,
};

// ─────────────────────────────────────────────────────────────────────────────
// INCREMENTAL EDITING (feature #8) — the one merge function used everywhere.
//
// mergeStatements(current, patch) from @openuidev/lang-core:
//   • same statement name  → the patch's definition replaces the old one
//   • new name             → appended
//   • `name = null`        → statement deleted
//   • statements root can no longer reach are dropped ($state is always kept)
//   • markdown fences around the patch are stripped
//   • with an empty `current` it simply normalizes the patch (first program)
//
// The server (update_surface tool) and the browser (applying the tool result)
// both call this, so their copies of a surface never drift apart.
// Merge only AFTER the patch finished streaming: a half-written `root` would
// make everything else look unreachable and get dropped.
// ─────────────────────────────────────────────────────────────────────────────
import { mergeStatements } from "@openuidev/lang-core";

export function applyPatch(current: string, patch: string): string {
  return mergeStatements(current, patch);
}

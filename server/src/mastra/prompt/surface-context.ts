// ─────────────────────────────────────────────────────────────────────────────
// The DYNAMIC part of the system prompt: what the workspace looks like NOW.
//
// Edit mode only works if the model sees the program it is patching, so
// every request appends each surface's current program, its live $state
// (what the user filtered/typed) and its render errors (OpenUI's spec says
// the host SHOULD send structured errors back in the next request).
// ─────────────────────────────────────────────────────────────────────────────
import type { SurfaceSnapshot } from "@demo/shared/protocol/chat-request";
import { SURFACES } from "@demo/shared/surfaces";

function describeSurface(s: SurfaceSnapshot): string {
  const meta = SURFACES[s.id];
  const program = s.program.trim() ? "```openui-lang\n" + s.program.trim() + "\n```" : "(empty — needs a full program)";
  // Only $variables are useful to the model; form internals are noise.
  const bindings = Object.fromEntries(Object.entries(s.state).filter(([k]) => k.startsWith("$")));
  const errors = s.errors.length
    ? s.errors.map((e) => `- [${e.code}] ${e.statementId ?? ""} ${e.message}${e.hint ? ` (hint: ${e.hint})` : ""}`).join("\n")
    : "none";
  return [
    `### surface "${s.id}" — ${meta.title}`,
    `Purpose: ${meta.purpose}`,
    `Program:\n${program}`,
    `Live $state: ${JSON.stringify(bindings)}`,
    `Render errors: ${errors}`,
  ].join("\n");
}

export function surfaceContext(surfaces: SurfaceSnapshot[]): string {
  if (surfaces.length === 0) return "";
  return `\n\n## CURRENT WORKSPACE\n\n${surfaces.map(describeSurface).join("\n\n")}`;
}

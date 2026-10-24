// ─────────────────────────────────────────────────────────────────────────────
// update_surface — how the agent changes a long-lived surface's PROGRAM.
// (To change what it currently SHOWS — filters, tab — see ./set-surface-state.ts.)
//
// Flow of one call (features #8 incremental editing + #13 self-correction):
//
//   model ──patch──► execute()
//                     1. current = the surface program the browser sent
//                     2. merged  = applyPatch(current, patch)  (mergeStatements)
//                     3. issues  = validateProgram(merged)   (same parser as the Renderer)
//                     4a. issues  → { ok:false, errors }  → the model reads the
//                         hints and calls update_surface again, IN THE SAME TURN
//                     4b. clean   → remember merged in RequestContext (so a 2nd
//                         patch this turn builds on it) and return { ok:true, patch }
//
//   browser: watches the streamed tool part; when output.ok is true it applies
//            applyPatch(currentProgram, patch) itself (shared/src/program/apply-patch.ts)
//            (client/src/chat/tool-results/update-surface.ts). Server and browser run
//            the same deterministic merge, so they stay in sync.
//
// While the model is still writing `patch`, the AI SDK streams the partial
// tool input to the browser (state "input-streaming"); the surface shows it
// live (client/src/surfaces/SurfaceView.tsx).
// ─────────────────────────────────────────────────────────────────────────────
import { applyPatch } from "@demo/shared/program/apply-patch";
import { validateProgram } from "@demo/shared/program/validate-program";
import { SURFACE_IDS } from "@demo/shared/surfaces";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getSurfaces, setSurfaceProgram } from "../request-context";

export const updateSurface = createTool({
  id: "update_surface",
  description:
    "Create or change one surface. `patch` is OpenUI Lang: for an empty surface a full program starting with root = Stack(...); otherwise only the changed/new statements (edit mode). Returns ok:false with errors to fix.",
  inputSchema: z.object({
    surfaceId: z.enum(SURFACE_IDS),
    patch: z.string().describe("OpenUI Lang statements, no markdown fences"),
    summary: z.string().describe("One short sentence describing the change, shown in the surface history"),
  }),
  execute: async ({ surfaceId, patch, summary }, context) => {
    const current = getSurfaces(context?.requestContext).find((s) => s.id === surfaceId)?.program ?? "";
    const merged = applyPatch(current, patch);
    const errors = validateProgram(merged);
    if (errors.length > 0) {
      return { ok: false, surfaceId, errors, note: "Nothing was applied. Fix the errors and call update_surface again." };
    }
    setSurfaceProgram(context?.requestContext, surfaceId, merged);
    return { ok: true, surfaceId, patch, summary };
  },
});

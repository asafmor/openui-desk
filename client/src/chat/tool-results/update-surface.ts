// update_surface ok:true → merge the patch (feature #8). Server side:
// server/src/mastra/tools/update-surface.ts (same applyPatch, already validated).
import { isSurfaceId } from "@demo/shared/surfaces";
import type { UpdateSurfaceOutput } from "../tool-parts";
import type { ToolResultApplier } from "./types";

export const applyUpdateSurface: ToolResultApplier = (output) => {
  const out = output as UpdateSurfaceOutput | undefined;
  if (!out?.ok || !isSurfaceId(out.surfaceId) || !out.patch) return [];
  return [{ type: "applyPatch", surfaceId: out.surfaceId, patch: out.patch, summary: out.summary ?? "agent edit" }];
};

// set_surface_state ok:true → write the agent's $values into live state
// (feature #20). Server side: server/src/mastra/tools/set-surface-state.ts.
import { isSurfaceId } from "@demo/shared/surfaces";
import type { SetSurfaceStateOutput } from "../tool-parts";
import type { ToolResultApplier } from "./types";

export const applySetSurfaceState: ToolResultApplier = (output) => {
  const out = output as SetSurfaceStateOutput | undefined;
  if (!out?.ok || !out.values) return [];
  return [{ type: "setStateValues", surfaceIds: (out.surfaceIds ?? []).filter(isSurfaceId), values: out.values }];
};

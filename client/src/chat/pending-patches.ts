// Live update_surface patches that are still being written by the model.
//
// The AI SDK streams tool arguments as they are generated: while the model
// types `patch`, the part is in state "input-streaming" and `input.patch` is
// the text so far. SurfaceView uses this to stream a brand-new surface live
// and to show "agent editing…" on existing ones.
import { isSurfaceId } from "@demo/shared/surfaces";
import type { UIMessage } from "ai";
import type { PendingPatches } from "../surfaces/PendingPatchesContext";
import { toolParts, type UpdateSurfaceInput } from "./tool-parts";

export function pendingPatches(messages: UIMessage[], streaming: boolean): PendingPatches {
  const last = messages.at(-1);
  if (!streaming || last?.role !== "assistant") return {};
  const pending: PendingPatches = {};
  for (const part of toolParts(last, "update_surface")) {
    if (part.state !== "input-streaming" && part.state !== "input-available") continue;
    const input = (part.input ?? {}) as UpdateSurfaceInput;
    if (isSurfaceId(input.surfaceId)) pending[input.surfaceId] = input.patch ?? "";
  }
  return pending;
}

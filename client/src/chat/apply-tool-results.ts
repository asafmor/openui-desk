// ─────────────────────────────────────────────────────────────────────────────
// Turns finished agent tool calls into workspace changes.
//
//   update_surface  ok:true  → applyPatch  (feature #8, merged with the same
//                               applyPatch the server validated with)
//   publish_artifact ok:true → addArtifact (feature #17)
//   set_surface_state ok:true → setStateValues (agent drives live $state, feature #20)
//
// Runs on every message update but is idempotent: the reducer remembers
// applied toolCallIds (also persisted, so an imported chat is not re-applied).
// ─────────────────────────────────────────────────────────────────────────────
import { isSurfaceId } from "@demo/shared/surfaces";
import type { UIMessage } from "ai";
import { useEffect } from "react";
import { useWorkspace } from "../workspace/WorkspaceContext";
import { toolParts, type PublishArtifactOutput, type SetSurfaceStateOutput, type UpdateSurfaceOutput } from "./tool-parts";

export function useApplyToolResults(messages: UIMessage[]) {
  const { dispatch } = useWorkspace();

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of toolParts(message, "update_surface")) {
        if (part.state !== "output-available") continue;
        const out = part.output as UpdateSurfaceOutput;
        if (!out?.ok || !isSurfaceId(out.surfaceId) || !out.patch) continue;
        dispatch({ type: "applyPatch", toolCallId: part.toolCallId, surfaceId: out.surfaceId, patch: out.patch, summary: out.summary ?? "agent edit" });
      }
      for (const part of toolParts(message, "set_surface_state")) {
        if (part.state !== "output-available") continue;
        const out = part.output as SetSurfaceStateOutput;
        if (!out?.ok || !out.values) continue;
        dispatch({ type: "setStateValues", toolCallId: part.toolCallId, surfaceIds: (out.surfaceIds ?? []).filter(isSurfaceId), values: out.values });
      }
      for (const part of toolParts(message, "publish_artifact")) {
        if (part.state !== "output-available") continue;
        const out = part.output as PublishArtifactOutput;
        if (!out?.ok) continue;
        dispatch({ type: "addArtifact", toolCallId: part.toolCallId, artifact: { id: out.id, title: out.title, program: out.program } });
      }
    }
  }, [messages, dispatch]);
}

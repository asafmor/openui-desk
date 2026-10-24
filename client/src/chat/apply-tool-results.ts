// ─────────────────────────────────────────────────────────────────────────────
// Turns finished agent tool calls into workspace changes.
//
// This hook only ROUTES: for each finished tool part it looks the tool up in
// ./tool-results/index.ts and dispatches the applier's actions wrapped in a
// "toolCall" envelope. What each tool does lives in ./tool-results/<tool>.ts.
//
// Runs on every message update, so it must be idempotent. The reducer's
// "toolCall" case does that for every tool at once: it remembers applied
// toolCallIds (persisted too, so an imported chat is not re-applied).
// ─────────────────────────────────────────────────────────────────────────────
import { getToolName, type UIMessage } from "ai";
import { useEffect } from "react";
import { useWorkspace } from "../workspace/WorkspaceContext";
import { TOOL_RESULT_APPLIERS } from "./tool-results";
import { toolParts } from "./tool-parts";

export function useApplyToolResults(messages: UIMessage[]) {
  const { dispatch } = useWorkspace();

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of toolParts(message)) {
        if (part.state !== "output-available") continue;
        const apply = TOOL_RESULT_APPLIERS[getToolName(part)];
        const actions = apply?.(part.output) ?? [];
        if (actions.length > 0) dispatch({ type: "toolCall", toolCallId: part.toolCallId, actions });
      }
    }
  }, [messages, dispatch]);
}

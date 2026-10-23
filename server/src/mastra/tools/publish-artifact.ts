// ─────────────────────────────────────────────────────────────────────────────
// publish_artifact — ARTIFACTS (feature #17), without OpenUI's AgentInterface.
//
// An artifact is "a tool result + a renderer the app supplies". The tool's
// RESULT travels in the AI SDK UIMessage stream (unlike Chat Completions
// streams, which never carry tool results), so the browser can render:
//   • an inline preview card in the chat         (client/src/artifacts/ArtifactCard.tsx)
//   • a full view in a side panel when opened     (client/src/artifacts/ArtifactPanel.tsx)
// and store it in the workspace so it survives export/import.
//
// Passing an existing `id` publishes a new VERSION of that artifact.
// ─────────────────────────────────────────────────────────────────────────────
import { validateProgram } from "@demo/shared/program/validate-program";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const publishArtifact = createTool({
  id: "publish_artifact",
  description:
    "Publish a standalone report the user can open in a side panel and keep. program is a complete OpenUI Lang program (root = Stack(...)); it may use Query() for live data. Pass the id of an existing artifact to publish a new version of it.",
  inputSchema: z.object({
    title: z.string(),
    program: z.string().describe("Complete OpenUI Lang program, no markdown fences"),
    id: z.string().optional().describe("Existing artifact id to revise"),
  }),
  execute: async ({ title, program, id }) => {
    const errors = validateProgram(program);
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, id: id ?? `art-${crypto.randomUUID().slice(0, 8)}`, title, program };
  },
});

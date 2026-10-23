// ─────────────────────────────────────────────────────────────────────────────
// The Mastra agent behind the chat.
//
// instructions is a FUNCTION of the RequestContext: Mastra calls it at the
// start of every run, so the prompt = static OpenUI prompt + the live
// workspace the browser just sent (see ../request-context.ts).
//
// No `memory` is configured on purpose: the browser owns the conversation
// (it is part of the exported workspace) and sends the full history with
// every request.
// ─────────────────────────────────────────────────────────────────────────────
import { Agent } from "@mastra/core/agent";
import { BASE_SYSTEM_PROMPT } from "../prompt/system-prompt";
import { surfaceContext } from "../prompt/surface-context";
import { getSurfaces } from "../request-context";
import { agentDataTools } from "../tools/agent-data-tools";
import { publishArtifact } from "../tools/publish-artifact";
import { updateSurface } from "../tools/update-surface";

export const DESK_AGENT_ID = "desk-agent";

export const deskAgent = new Agent({
  id: DESK_AGENT_ID,
  name: "Desk",
  // Mastra model-router id: "provider/model". Override with DESK_MODEL.
  model: process.env.DESK_MODEL ?? "openai/gpt-6.1-sol",
  instructions: ({ requestContext }) => BASE_SYSTEM_PROMPT + surfaceContext(getSurfaces(requestContext)),
  tools: { ...agentDataTools, update_surface: updateSurface, publish_artifact: publishArtifact },
  // Room for: inspect data → patch 2-4 surfaces → fix a failed patch → answer.
  defaultOptions: { maxSteps: 14 },
});

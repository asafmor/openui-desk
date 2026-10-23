// ─────────────────────────────────────────────────────────────────────────────
// AGENT-SIDE data tools — the "same function, two callers" idea (docs:
// "Tools: agent-side vs. UI-side").
//
// Every contract marked `agentSide: true` becomes a Mastra tool here, so the
// model can look at real data DURING its turn (e.g. find the ticket the user
// means, learn field names for Query defaults). The browser calls the very
// same handlers later through Query()/Mutation() (../routes/ui-tools-route.ts).
//
// Only read-only tools are given to the agent: writes stay behind a human
// click on a generated Button.
// ─────────────────────────────────────────────────────────────────────────────
import { SERVER_UI_TOOLS } from "@demo/shared/ui-tools/contracts";
import { createTool } from "@mastra/core/tools";
import { runUiTool } from "../../ui-tools/run-ui-tool";

export const agentDataTools = Object.fromEntries(
  SERVER_UI_TOOLS.filter((c) => c.agentSide).map((c) => [
    c.name,
    createTool({
      id: c.name,
      description: c.description,
      inputSchema: c.input,
      execute: async (input) => runUiTool(c.name, input),
    }),
  ]),
);

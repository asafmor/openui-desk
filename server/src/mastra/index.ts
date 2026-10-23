// ─────────────────────────────────────────────────────────────────────────────
// Mastra entry point (`mastra dev` serves this on http://localhost:4111,
// with Mastra Studio at the same address for inspecting the agent).
//
// Routes:
//   POST /chat               AI SDK v7 UIMessage stream (chatRoute from @mastra/ai-sdk)
//   POST /ui-tools/:name     REST backend for Query()/Mutation()      (UI-side tools)
//   *    /api/mcp/desk-ui/mcp same tools over MCP                       (UI-side tools)
//   GET  /a2ui/stream        A2UI envelopes over SSE
//   POST /a2ui/action        A2UI actions from the browser
// ─────────────────────────────────────────────────────────────────────────────
import { chatRoute } from "@mastra/ai-sdk";
import { Mastra } from "@mastra/core/mastra";
import { DESK_AGENT_ID, deskAgent } from "./agents/desk-agent";
import { DESK_MCP_ID, deskMcpServer } from "./mcp/desk-mcp-server";
import { a2uiActionRoute, a2uiStreamRoute } from "./routes/a2ui-routes";
import { uiToolsRoute } from "./routes/ui-tools-route";

export const mastra = new Mastra({
  agents: { [DESK_AGENT_ID]: deskAgent },
  mcpServers: { [DESK_MCP_ID]: deskMcpServer },
  server: {
    port: 4111,
    // CORS defaults to origin "*", so the Vite app on :5173 can call us.
    // The MCP v2 client sends extra headers that must be allowed explicitly.
    cors: {
      allowHeaders: ["mcp-protocol-version", "mcp-method", "mcp-name", "mcp-session-id"],
      exposeHeaders: ["mcp-session-id"],
    },
    apiRoutes: [
      // The browser sends { messages, requestContext: { surfaces } }. Mastra
      // turns body.requestContext into the RequestContext that the agent's
      // instructions and tools receive (see ./request-context.ts).
      // version "v7" must match the browser's `ai` package major version.
      chatRoute({ path: "/chat", agent: DESK_AGENT_ID, version: "v7" }),
      uiToolsRoute,
      a2uiStreamRoute,
      a2uiActionRoute,
    ],
  },
});

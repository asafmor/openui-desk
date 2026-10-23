// ─────────────────────────────────────────────────────────────────────────────
// The same UI tools, exposed over MCP (feature #3: "toolProvider can be an
// MCP client").
//
// OpenUI's Renderer accepts, as `toolProvider`, any object with
// `callTool({ name, arguments })` — i.e. an MCP client. The browser can switch
// between REST and MCP at runtime (client/src/openui/tool-provider/*); the
// programs do not change at all.
//
// Mastra serves registered MCP servers at /api/mcp/<server id>/mcp
// (Streamable HTTP). @mastra/mcp 2.x speaks MCP revision 2026-07-28, so the
// browser must use @modelcontextprotocol/client 2.x.
// ─────────────────────────────────────────────────────────────────────────────
import { SERVER_UI_TOOLS, type UiToolContract } from "@demo/shared/ui-tools/contracts";
import { createTool } from "@mastra/core/tools";
import { MCPServer } from "@mastra/mcp";
import type { z } from "zod";
import { runUiTool } from "../../ui-tools/run-ui-tool";

function toMcpTool<C extends UiToolContract>(c: C) {
  return createTool({
    id: c.name,
    description: c.description,
    inputSchema: c.input,
    // With an outputSchema the result is sent as MCP `structuredContent`,
    // which OpenUI prefers over parsing text (lang-core extractToolResult).
    outputSchema: c.output,
    mcp: { annotations: { readOnlyHint: c.kind === "query", destructiveHint: c.kind === "mutation" } },
    execute: async (input) => runUiTool(c.name, input) as z.infer<C["output"]>,
  });
}

const tools = Object.fromEntries(SERVER_UI_TOOLS.map((c) => [c.name, toMcpTool(c)]));

export const DESK_MCP_ID = "desk-ui";

export const deskMcpServer = new MCPServer({
  id: DESK_MCP_ID,
  name: "Support desk UI tools",
  version: "1.0.0",
  tools,
});

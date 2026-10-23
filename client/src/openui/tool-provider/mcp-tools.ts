// ─────────────────────────────────────────────────────────────────────────────
// toolProvider, flavor 2: an MCP CLIENT (feature #3).
//
// OpenUI accepts any object shaped like `McpClientLike`:
//     { callTool({ name, arguments }) → Promise<{ content, structuredContent?, isError? }> }
// The Renderer then unwraps results with extractToolResult (prefers
// `structuredContent`, falls back to JSON in text content).
//
// The server is Mastra's MCPServer at /api/mcp/desk-ui/mcp
// (server/src/mastra/mcp/desk-mcp-server.ts). It speaks MCP revision
// 2026-07-28 only, so the v2 client must PIN that revision — its default
// "legacy" negotiation would be rejected.
//
// Because McpClientLike is just an interface, we wrap the real client to
// also serve our browser-only tools: one provider, two backends.
// ─────────────────────────────────────────────────────────────────────────────
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { McpClientLike } from "@openuidev/react-lang";
import { SERVER_URL } from "../../config";
import type { ToolFn } from "./rest-tools";

export async function connectMcp(): Promise<Client> {
  const client = new Client(
    { name: "openui-desk-browser", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
  await client.connect(new StreamableHTTPClientTransport(new URL(`${SERVER_URL}/api/mcp/desk-ui/mcp`)));
  return client;
}

export function createMcpProvider(client: Client, localTools: Record<string, ToolFn>): McpClientLike {
  return {
    async callTool({ name, arguments: args = {} }) {
      const local = localTools[name];
      if (local) return { content: [], structuredContent: await local(args) };
      return (await client.callTool({ name, arguments: args })) as Awaited<ReturnType<McpClientLike["callTool"]>>;
    },
  };
}

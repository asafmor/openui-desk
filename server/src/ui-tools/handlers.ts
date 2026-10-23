// ─────────────────────────────────────────────────────────────────────────────
// UI tool name → implementation. One line per tool, typed by its contract:
// `handle(contract, fn)` makes TypeScript check fn's input/output against the
// contract's Zod schemas.
//
// The same handlers serve THREE callers:
//   • POST /ui-tools/:name     — the browser's REST toolProvider  (../mastra/routes/ui-tools-route.ts)
//   • MCP server "desk-ui"     — the browser's MCP toolProvider   (../mastra/mcp/desk-mcp-server.ts)
//   • agent tools              — the model, during its turn       (../mastra/tools/agent-data-tools.ts)
// ─────────────────────────────────────────────────────────────────────────────
import * as c from "@demo/shared/ui-tools/contracts";
import type { z } from "zod";
import * as db from "../db/desk-db";

type AnyHandler = (input: unknown) => unknown;

function handle<C extends c.UiToolContract>(
  contract: C,
  fn: (input: z.infer<C["input"]>) => z.infer<C["output"]>,
): [string, AnyHandler] {
  return [contract.name, fn as AnyHandler];
}

export const UI_TOOL_HANDLERS: Record<string, AnyHandler> = Object.fromEntries([
  handle(c.listTickets, (i) => db.listTickets(i)),
  handle(c.getTicket, (i) => db.getTicket(i.id)),
  handle(c.ticketStats, (i) => db.ticketStats(Number(i.days ?? "14") || 14)),
  handle(c.listAgents, () => db.listAgents()),
  handle(c.recentActivity, (i) => db.recentActivity(i.limit)),
  handle(c.systemHealth, () => db.systemHealth()),
  handle(c.createTicket, (i) => db.createTicket(i)),
  handle(c.updateTicket, (i) => db.updateTicket(i)),
  handle(c.escalateTicket, (i) => db.escalateTicket(i.id, i.reason)),
  handle(c.addComment, (i) => db.addComment(i.id, i.text)),
]);

// ─────────────────────────────────────────────────────────────────────────────
// Contracts → OpenUI `ToolSpec`s for the system prompt.
//
// OpenUI's prompt generator prints each tool as a signature plus a
// "default value" hint, e.g.
//     - list_tickets(status?: ..., priority?: ...) → {rows: Ticket[], total}
// It reads plain JSON Schema (MCP-style), so we convert our Zod contracts with
// Zod 4's built-in `z.toJSONSchema`. The `annotations` tell the model which
// tools are read-only (→ Query) and which are destructive (→ Mutation).
//
// Used by: server/src/mastra/prompt/system-prompt.ts (promptOptions.tools)
// ─────────────────────────────────────────────────────────────────────────────
import type { ToolSpec } from "@openuidev/lang-core";
import { z } from "zod";
import type { UiToolContract } from "./contracts";

export function toToolSpec(contract: UiToolContract): ToolSpec {
  return {
    name: contract.name,
    description: `[${contract.kind === "query" ? "Query" : "Mutation"}] ${contract.description}`,
    inputSchema: z.toJSONSchema(contract.input) as Record<string, unknown>,
    outputSchema: z.toJSONSchema(contract.output) as Record<string, unknown>,
    annotations: {
      readOnlyHint: contract.kind === "query",
      destructiveHint: contract.kind === "mutation",
    },
  };
}

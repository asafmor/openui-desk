// ─────────────────────────────────────────────────────────────────────────────
// toolProvider, flavor 1: a FUNCTION MAP (feature #3).
//
//   <Renderer toolProvider={{ list_tickets: async (args) => …, … }} />
//
// The Renderer looks a tool up by the exact name written in
// Query("list_tickets", …). A missing name fails with `tool-not-found`;
// a throw becomes a `tool-error` (the Query keeps its defaults, a Mutation's
// `.status` becomes "error" and its `.error` holds the message).
// ─────────────────────────────────────────────────────────────────────────────
import { SERVER_UI_TOOLS } from "@demo/shared/ui-tools/contracts";
import { SERVER_URL } from "../../config";

export type ToolFn = (args: Record<string, unknown>) => Promise<unknown>;

async function postTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${SERVER_URL}/ui-tools/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args ?? {}),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `${name} failed (${res.status})`);
  return body;
}

export function createRestTools(): Record<string, ToolFn> {
  return Object.fromEntries(SERVER_UI_TOOLS.map((t) => [t.name, (args: Record<string, unknown>) => postTool(t.name, args)]));
}

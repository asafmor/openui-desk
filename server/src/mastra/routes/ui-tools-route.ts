// ─────────────────────────────────────────────────────────────────────────────
// POST /ui-tools/:name — the REST backend of the browser's toolProvider.
//
// When a surface program runs `Query("list_tickets", {status: $status}, …)`,
// the Renderer calls toolProvider.list_tickets({status: "open"}); our client
// provider (client/src/openui/tool-provider/rest-tools.ts) POSTs the args
// here. Results go straight back to the browser and NEVER enter the
// conversation — the model only sees programs, not the data they load.
//
// Mastra custom routes are mounted exactly at the given path (no /api prefix).
// ─────────────────────────────────────────────────────────────────────────────
import { registerApiRoute } from "@mastra/core/server";
import { runUiTool, UiToolError } from "../../ui-tools/run-ui-tool";

export const uiToolsRoute = registerApiRoute("/ui-tools/:name", {
  method: "POST",
  handler: async (c) => {
    const name = c.req.param("name");
    const input = await c.req.json().catch(() => ({}));
    try {
      return c.json(runUiTool(name, input));
    } catch (err) {
      const status = err instanceof UiToolError ? err.status : 500;
      return c.json({ error: err instanceof Error ? err.message : String(err) }, status as 400 | 404 | 500);
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// A2UI (feature #18) — the AGENT side of one live incident surface.
//
// A2UI is a stateful, bidirectional protocol: the agent pushes envelopes
// (createSurface, updateComponents, updateDataModel, deleteSurface) and the
// renderer sends back `action` envelopes. @openuidev/a2ui keeps every A2UI
// envelope as-is, except that component payloads are OpenUI Lang statements.
//
// One session = one SSE connection = one surface with a unique id, so React
// StrictMode or reconnects never collide with an existing surface.
//
//   connect ──► createSurface + updateComponents (INITIAL_STATEMENTS)
//   every 1s ─► updateDataModel /elapsed           (no statements resent)
//   @Acknowledge(by) ► updateDataModel /status,/by + updateComponents (patch)
//   @Resolve()       ► stop the clock, patch the UI
//   @Restart()       ► deleteSurface, then start a fresh surface
// ─────────────────────────────────────────────────────────────────────────────
import type { AgentToRendererMessage } from "@openuidev/a2ui";
import { ACKNOWLEDGED_STATEMENTS, INITIAL_STATEMENTS, RESOLVED_STATEMENTS } from "./incident-program";

type Send = (msg: AgentToRendererMessage) => void;
const V = "v1.0" as const;

export class IncidentSession {
  surfaceId = `incident-${crypto.randomUUID().slice(0, 8)}`;
  private timer?: ReturnType<typeof setInterval>;
  private elapsed = 0;

  constructor(private send: Send) {}

  start() {
    this.elapsed = 0;
    this.send({
      version: V,
      createSurface: {
        surfaceId: this.surfaceId,
        dataModel: { title: "Checkout API error rate above 5%", status: "open", elapsed: 0, by: "", summary: "Detected by synthetic monitor in eu-west." },
      },
    });
    this.send({ version: V, updateComponents: { surfaceId: this.surfaceId, components: INITIAL_STATEMENTS } });
    this.timer = setInterval(() => this.set("/elapsed", ++this.elapsed), 1000);
  }

  stop() {
    clearInterval(this.timer);
  }

  /** Handle an `action` envelope the browser POSTed back. */
  handleAction(name: string, context: Record<string, unknown> | undefined) {
    if (name === "Acknowledge") {
      this.set("/status", "acknowledged");
      this.set("/by", String(context?.by ?? "someone"));
      this.patch(ACKNOWLEDGED_STATEMENTS);
    } else if (name === "Resolve") {
      this.stop();
      this.set("/status", "resolved");
      this.patch(RESOLVED_STATEMENTS);
    } else if (name === "Restart") {
      this.stop();
      this.send({ version: V, deleteSurface: { surfaceId: this.surfaceId } });
      this.surfaceId = `incident-${crypto.randomUUID().slice(0, 8)}`;
      this.start();
    }
  }

  private set(path: string, value: unknown) {
    this.send({ version: V, updateDataModel: { surfaceId: this.surfaceId, path, value: value as never } });
  }

  private patch(components: string[]) {
    this.send({ version: V, updateComponents: { surfaceId: this.surfaceId, components } });
  }
}

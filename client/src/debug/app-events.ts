// App-level events published on the OpenUI observability bus, so they appear
// in the DevTools drawer next to the Renderer's own stream events.
import { observability } from "@openuidev/observability";

export const appEvent = (kind: string, message: string, extra: Record<string, unknown> = {}) =>
  observability.info({ kind: `desk:${kind}`, message, ...extra });

// ─────────────────────────────────────────────────────────────────────────────
// <Renderer onAction> — where generated UI talks to the HOST (features #4, #6).
//
// This file only DISPATCHES: it looks the event's type up in the registry
// (./handlers/index.ts) and calls that handler with { origin, host }.
// What each action does lives in its own file under ./handlers/.
// ─────────────────────────────────────────────────────────────────────────────
import { ACTION_HANDLERS } from "./handlers";
import type { ActionContext, AppActionEvent } from "./handlers/types";

export type { ActionHost } from "./handlers/types";

type AnyHandler = (event: AppActionEvent, ctx: ActionContext) => void;

/** `origin` names where the click happened ("canvas", "chat", "artifact:…"). */
export function handleAction(event: AppActionEvent, origin: string, host: ActionContext["host"]): void {
  // The registry is typed per key; TypeScript cannot relate `event.type` to
  // the matching handler's parameter, so the lookup is widened once, here.
  const handler = (ACTION_HANDLERS as Record<string, AnyHandler | undefined>)[event.type];
  if (!handler) {
    console.warn(`No host handler for action "${event.type}"`);
    return;
  }
  handler(event, { origin, host });
}

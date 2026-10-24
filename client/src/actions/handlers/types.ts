// Types shared by every host action handler (see ./index.ts).
import type { ActionTurn } from "@demo/shared/protocol/action-message";
import type { LibraryActionEvent } from "@openuidev/react-lang";
import type { AppLibrary } from "../../openui/library";

/** onAction's event: a union discriminated on `type`, derived from the library's actions. */
export type AppActionEvent = LibraryActionEvent<AppLibrary>;

/** App services a handler may use. Built once in App.tsx. */
export interface ActionHost {
  sendActionTurn: (turn: ActionTurn) => void;
  broadcast: (key: string, value: unknown) => void;
}

export interface ActionContext {
  /** Where the click happened: "canvas", "chat", "artifact:…". */
  origin: string;
  host: ActionHost;
}

// One handler per event type, each receiving its own narrowed event.
// `as E["type"]` remaps the union into keys:
//   { continue_conversation: (e: BuiltinEvent, ctx) => void,
//     Notify: (e: { params: { message, tone? } … }, ctx) => void, … }
// "custom" (an @Action the library doesn't declare) is left out on purpose.
type AllHandlers = { [E in AppActionEvent as E["type"]]: (event: E, ctx: ActionContext) => void };
export type ActionHandlers = Omit<AllHandlers, "custom">;
export type ActionHandler<T extends keyof ActionHandlers> = ActionHandlers[T];

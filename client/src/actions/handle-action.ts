// ─────────────────────────────────────────────────────────────────────────────
// <Renderer onAction> — where generated UI talks to the HOST (features #4, #6).
//
// Only these reach onAction; @Run / @Set / @Reset are executed inside the
// Renderer and never arrive here:
//
//   type                     from                         we do
//   ───────────────────────  ───────────────────────────  ─────────────────────────────
//   continue_conversation    @ToAssistant(msg, context)    send a chat turn (with form state)
//                            or a Button with no action
//   open_url                 @OpenUrl(url)                 window.open
//   CopyToClipboard          custom action                 navigator.clipboard
//   Broadcast                custom action                 set $key in every surface
//   Notify                   custom action                 toast
//
// The event type is a typed union derived from the library's custom actions
// (LibraryActionEvent<typeof library>), so `event.params` is narrowed per case.
// ─────────────────────────────────────────────────────────────────────────────
import type { ActionTurn } from "@demo/shared/protocol/action-message";
import { BuiltinActionType, type LibraryActionEvent } from "@openuidev/react-lang";
import type { AppLibrary } from "../openui/library";
import { showToast } from "./toasts";

export interface ActionHost {
  sendActionTurn: (turn: ActionTurn) => void;
  broadcast: (key: string, value: unknown) => void;
}

/** `origin` names where the click happened ("canvas", "chat", "artifact:…"). */
export function handleAction(event: LibraryActionEvent<AppLibrary>, origin: string, host: ActionHost): void {
  switch (event.type) {
    case BuiltinActionType.ContinueConversation: {
      // The host may enrich the context; we add which surface was clicked.
      const ctx = event.params?.context;
      const context = ctx && typeof ctx === "object" && !Array.isArray(ctx) ? { ...ctx, surface: origin } : { value: ctx, surface: origin };
      host.sendActionTurn({ message: event.humanFriendlyMessage, formState: event.formState, context });
      return;
    }
    case BuiltinActionType.OpenUrl:
      window.open(String(event.params?.url), "_blank", "noopener,noreferrer");
      return;
    case "CopyToClipboard":
      void navigator.clipboard.writeText(event.params.text).then(() => showToast(`Copied "${event.params.text}"`));
      return;
    case "Broadcast":
      host.broadcast(event.params.key, event.params.value);
      return;
    case "Notify":
      showToast(event.params.message, event.params.tone ?? "info");
      return;
  }
}

// @ToAssistant(msg, context) or a Button with no action → a chat turn.
// The host may enrich the context; we add which surface was clicked.
import type { ActionHandler } from "./types";

export const handleContinueConversation: ActionHandler<"continue_conversation"> = (event, { origin, host }) => {
  const ctx = event.params?.context;
  const context = ctx && typeof ctx === "object" && !Array.isArray(ctx) ? { ...ctx, surface: origin } : { value: ctx, surface: origin };
  host.sendActionTurn({ message: event.humanFriendlyMessage, formState: event.formState, context });
};

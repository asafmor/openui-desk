// ─────────────────────────────────────────────────────────────────────────────
// HOST ACTION REGISTRY: action type → handler, one file per handler.
//
// Adding a custom action:
//   1. defineAction in ../../openui/actions/<name>.ts and list it in their index.ts
//   2. write ./<name>.ts exporting `handle<Name>: ActionHandler<"<Name>">`
//   3. add it below. Forgetting this step is a COMPILE error: `ActionHandlers`
//      is derived from the library, so every declared action needs a key here.
//
// Only these events reach the host; @Run / @Set / @Reset run inside the
// Renderer and never arrive here.
// ─────────────────────────────────────────────────────────────────────────────
import { handleBroadcast } from "./broadcast";
import { handleContinueConversation } from "./continue-conversation";
import { handleCopyToClipboard } from "./copy-to-clipboard";
import { handleNotify } from "./notify";
import { handleOpenUrl } from "./open-url";
import { handleToggleTheme } from "./toggle-theme";
import type { ActionHandlers } from "./types";

export const ACTION_HANDLERS: ActionHandlers = {
  // built-in (BuiltinActionType values)
  continue_conversation: handleContinueConversation,
  open_url: handleOpenUrl,
  // custom (../../openui/actions)
  CopyToClipboard: handleCopyToClipboard,
  Broadcast: handleBroadcast,
  Notify: handleNotify,
  ToggleTheme: handleToggleTheme,
};

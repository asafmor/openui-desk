// @OpenUrl(url) → new tab, without giving it a handle back to this window.
import type { ActionHandler } from "./types";

export const handleOpenUrl: ActionHandler<"open_url"> = (event) => {
  window.open(String(event.params?.url), "_blank", "noopener,noreferrer");
};

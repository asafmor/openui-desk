// @CopyToClipboard(text) — definition: ../../openui/actions/copy-to-clipboard.ts
import { showToast } from "../toasts";
import type { ActionHandler } from "./types";

export const handleCopyToClipboard: ActionHandler<"CopyToClipboard"> = (event) => {
  void navigator.clipboard.writeText(event.params.text).then(() => showToast(`Copied "${event.params.text}"`));
};

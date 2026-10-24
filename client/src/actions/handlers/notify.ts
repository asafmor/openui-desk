// @Notify(message, tone) — definition: ../../openui/actions/notify.ts
import { showToast } from "../toasts";
import type { ActionHandler } from "./types";

export const handleNotify: ActionHandler<"Notify"> = (event) => {
  showToast(event.params.message, event.params.tone ?? "info");
};

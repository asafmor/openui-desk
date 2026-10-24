// @Broadcast(key, value) — definition and mechanism: ../../openui/actions/broadcast.ts
import type { ActionHandler } from "./types";

export const handleBroadcast: ActionHandler<"Broadcast"> = (event, { host }) => {
  host.broadcast(event.params.key, event.params.value);
};

// Live, not-yet-applied update_surface patches, keyed by surface id.
// Computed from the streaming chat message (client/src/chat/pending-patches.ts)
// and read by SurfaceView to show the agent's edit while it is being written.
import type { SurfaceId } from "@demo/shared/surfaces";
import { createContext, useContext } from "react";

export type PendingPatches = Partial<Record<SurfaceId, string>>;

export const PendingPatchesContext = createContext<PendingPatches>({});
export const usePendingPatch = (id: SurfaceId) => useContext(PendingPatchesContext)[id];

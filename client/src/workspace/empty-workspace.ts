import { SURFACE_IDS } from "@demo/shared/surfaces";
import type { SurfaceRecord, Workspace } from "./types";

export const emptySurface = (): SurfaceRecord => ({ program: "", state: {}, history: [] });

export function createWorkspace(name: string, programs: Partial<Record<string, string>> = {}): Workspace {
  return {
    id: crypto.randomUUID(),
    name,
    surfaces: Object.fromEntries(
      SURFACE_IDS.map((id) => [id, { ...emptySurface(), program: programs[id] ?? "" }]),
    ) as Workspace["surfaces"],
    chat: [],
    inlineState: {},
    artifacts: [],
    notes: [],
    appliedToolCalls: [],
  };
}

// React glue: one useReducer for the whole workspace + debounced autosave.
import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { saveAutosave } from "./storage";
import type { Workspace } from "./types";
import { workspaceReducer, type WorkspaceAction, type WorkspaceState } from "./workspace-reducer";

const Ctx = createContext<{ state: WorkspaceState; dispatch: Dispatch<WorkspaceAction> } | null>(null);

export function WorkspaceProvider({ initial, children }: { initial: Workspace; children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, { workspace: initial, errors: {} });

  // Autosave 400ms after the last change (typing in a filter fires many updates).
  useEffect(() => {
    const t = setTimeout(() => saveAutosave(state.workspace), 400);
    return () => clearTimeout(t);
  }, [state.workspace]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

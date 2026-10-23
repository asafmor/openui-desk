// Where workspaces live outside memory:
//  • localStorage — autosave of the CURRENT workspace (reload = same spot)
//  • .json files  — export / import, to keep several workspaces and switch
// Every localStorage access is wrapped: it can throw (private mode, quota).
import { deserializeWorkspace, serializeWorkspace } from "./serialize";
import type { Workspace } from "./types";

const KEY = "openui-desk:workspace";

export function loadAutosave(): Workspace | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? deserializeWorkspace(JSON.parse(raw)).workspace : null;
  } catch (err) {
    console.warn("Ignoring unreadable autosave", err);
    return null;
  }
}

export function saveAutosave(ws: Workspace): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(serializeWorkspace(ws)));
  } catch (err) {
    console.warn("Autosave failed", err);
  }
}

export function downloadWorkspace(ws: Workspace): void {
  const blob = new Blob([JSON.stringify(serializeWorkspace(ws), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${ws.name.replace(/[^\w-]+/g, "-").toLowerCase() || "workspace"}.workspace.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function readWorkspaceFile(file: File) {
  return deserializeWorkspace(JSON.parse(await file.text()));
}

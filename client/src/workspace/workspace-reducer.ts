// ─────────────────────────────────────────────────────────────────────────────
// Every change to the workspace goes through this pure reducer. Reading the
// action list is the quickest way to see what can happen to a surface.
// ─────────────────────────────────────────────────────────────────────────────
import { applyPatch } from "@demo/shared/program/apply-patch";
import type { SurfaceError } from "@demo/shared/protocol/chat-request";
import { SURFACE_IDS, type SurfaceId } from "@demo/shared/surfaces";
import type { UIMessage } from "ai";
import { emptySurface } from "./empty-workspace";
import type { Artifact, Note, SurfaceErrors, Workspace } from "./types";

export interface WorkspaceState {
  workspace: Workspace;
  errors: SurfaceErrors;
}

export type BaseWorkspaceAction =
  // The agent's update_surface tool succeeded → merge its patch (feature #8)
  | { type: "applyPatch"; surfaceId: SurfaceId; patch: string; summary: string }
  // <Renderer onStateUpdate> → remember $state + form values (feature #15)
  | { type: "setSurfaceState"; surfaceId: SurfaceId; state: Record<string, unknown> }
  // <Renderer onError> → shown in the UI and sent with the next request (feature #13)
  | { type: "setSurfaceErrors"; surfaceId: SurfaceId; errors: SurfaceError[] }
  // custom action @Broadcast(key, value) → write $key into every surface
  | { type: "broadcast"; key: string; value: unknown }
  // the agent's set_surface_state tool succeeded → write its $values (same path as broadcast)
  | { type: "setStateValues"; surfaceIds: SurfaceId[]; values: Record<string, unknown> }
  | { type: "undo"; surfaceId: SurfaceId }
  | { type: "clearSurface"; surfaceId: SurfaceId }
  | { type: "setInlineState"; key: string; state: Record<string, unknown> }
  | { type: "addArtifact"; artifact: Omit<Artifact, "version" | "at"> }
  | { type: "addNote"; note: Note }
  | { type: "setChat"; chat: UIMessage[] }
  | { type: "rename"; name: string }
  | { type: "replace"; workspace: Workspace };

export type WorkspaceAction =
  | BaseWorkspaceAction
  // An agent tool call finished → apply its actions ONCE per toolCallId
  // (client/src/chat/apply-tool-results.ts). The id is persisted, so replaying
  // the chat after a reload or import does not apply anything twice.
  | { type: "toolCall"; toolCallId: string; actions: BaseWorkspaceAction[] };

const MAX_HISTORY = 30;

function withSurface(ws: Workspace, id: SurfaceId, patch: Partial<Workspace["surfaces"][SurfaceId]>): Workspace {
  return { ...ws, surfaces: { ...ws.surfaces, [id]: { ...ws.surfaces[id], ...patch } } };
}

/** Merge values into the saved state of some surfaces. Each SurfaceView passes
 *  that state as <Renderer initialState>, which re-applies changed values live. */
function writeState(ws: Workspace, ids: readonly SurfaceId[], values: Record<string, unknown>): Workspace {
  let next = ws;
  for (const id of ids) next = withSurface(next, id, { state: { ...next.surfaces[id].state, ...values } });
  return next;
}

function reduceWorkspace(ws: Workspace, action: WorkspaceAction): Workspace {
  switch (action.type) {
    case "toolCall": {
      if (ws.appliedToolCalls.includes(action.toolCallId)) return ws; // already applied (e.g. after import)
      const next = action.actions.reduce(reduceWorkspace, ws);
      return { ...next, appliedToolCalls: [...next.appliedToolCalls, action.toolCallId] };
    }
    case "applyPatch": {
      const surface = ws.surfaces[action.surfaceId];
      const history = [...surface.history, { program: surface.program, summary: action.summary, at: new Date().toISOString() }];
      return withSurface(ws, action.surfaceId, {
        program: applyPatch(surface.program, action.patch),
        history: history.slice(-MAX_HISTORY),
      });
    }
    case "setSurfaceState":
      return withSurface(ws, action.surfaceId, { state: action.state });
    case "broadcast":
      // `$` prefix = a reactive binding in Renderer state (initialState contract).
      return writeState(ws, SURFACE_IDS, { [`$${action.key}`]: action.value });
    case "setStateValues":
      return writeState(ws, action.surfaceIds, action.values);
    case "undo": {
      const surface = ws.surfaces[action.surfaceId];
      const previous = surface.history.at(-1);
      if (!previous) return ws;
      return withSurface(ws, action.surfaceId, { program: previous.program, history: surface.history.slice(0, -1) });
    }
    case "clearSurface":
      return withSurface(ws, action.surfaceId, emptySurface());
    case "setInlineState":
      return { ...ws, inlineState: { ...ws.inlineState, [action.key]: action.state } };
    case "addArtifact": {
      const versions = ws.artifacts.filter((a) => a.id === action.artifact.id).length;
      const artifact = { ...action.artifact, version: versions + 1, at: new Date().toISOString() };
      return { ...ws, artifacts: [...ws.artifacts, artifact] };
    }
    case "addNote":
      return { ...ws, notes: [action.note, ...ws.notes] };
    case "setChat":
      return { ...ws, chat: action.chat };
    case "rename":
      return { ...ws, name: action.name };
    case "replace":
      return action.workspace;
    default:
      return ws;
  }
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  if (action.type === "setSurfaceErrors") {
    return { ...state, errors: { ...state.errors, [action.surfaceId]: action.errors } };
  }
  if (action.type === "replace") return { workspace: action.workspace, errors: {} };
  return { ...state, workspace: reduceWorkspace(state.workspace, action) };
}

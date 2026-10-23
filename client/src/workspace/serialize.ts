// ─────────────────────────────────────────────────────────────────────────────
// Workspace ⇄ JSON (feature #15: persistence + OpenUI's message protocol).
//
// Each surface is written with OpenUI's stored-message format (buildMessage):
//
//   ]]>openui:content?library=support-desk%401&surface=canvas
//   root = Stack([tabs])
//   ...program...
//   ]]>openui:context
//   {"$tab":"tickets","$status":"open","create":{"title":{"value":"…","componentType":"input"}}}
//   ]]>openui:end
//
//  • content  = the program; the attributes record WHICH library (and version)
//               it was written for — useful when the library evolves
//  • context  = host JSON; we store the Renderer state snapshot there
//  • end      = the program was complete (not a stream cut mid-way)
//
// <Renderer response={…}> accepts this text directly (it renders `content`
// and ignores the rest), and parseMessage() reads it back.
//
// KEEPING OLD WORKSPACES RENDERING: programs are POSITIONAL. When a component
// changes, only APPEND new optional props; never reorder or remove props,
// or saved programs will put values in the wrong place.
// ─────────────────────────────────────────────────────────────────────────────
import { buildMessage, parseMessage } from "@openuidev/react-lang";
import { SURFACE_IDS } from "@demo/shared/surfaces";
import { LIBRARY_ID, LIBRARY_VERSION } from "../openui/library";
import type { SurfaceRecord, Workspace } from "./types";

const FORMAT = "openui-desk-workspace";
const FORMAT_VERSION = 1;

interface StoredSurface {
  message: string;
  history: SurfaceRecord["history"];
}

export interface WorkspaceFile extends Omit<Workspace, "surfaces"> {
  format: typeof FORMAT;
  formatVersion: number;
  savedAt: string;
  surfaces: Record<string, StoredSurface>;
}

function encodeSurface(id: string, s: SurfaceRecord): StoredSurface {
  const message = buildMessage({
    content: s.program,
    context: s.state,
    attributes: { library: `${LIBRARY_ID}@${LIBRARY_VERSION}`, surface: id },
    end: true,
  });
  return { message, history: s.history };
}

function decodeSurface(stored: StoredSurface | undefined): { record: SurfaceRecord; library?: string } {
  if (!stored) return { record: { program: "", state: {}, history: [] } };
  const parsed = parseMessage(stored.message);
  const state = parsed.context && typeof parsed.context === "object" ? (parsed.context as Record<string, unknown>) : {};
  return {
    record: { program: parsed.content.trim(), state, history: stored.history ?? [] },
    library: parsed.attributes.library,
  };
}

export function serializeWorkspace(ws: Workspace): WorkspaceFile {
  return {
    ...ws,
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    surfaces: Object.fromEntries(SURFACE_IDS.map((id) => [id, encodeSurface(id, ws.surfaces[id])])),
  };
}

/** Returns the workspace plus warnings (e.g. written for another library version). */
export function deserializeWorkspace(data: unknown): { workspace: Workspace; warnings: string[] } {
  const file = data as Partial<WorkspaceFile>;
  if (file?.format !== FORMAT) throw new Error("Not an OpenUI desk workspace file.");
  if ((file.formatVersion ?? 0) > FORMAT_VERSION) throw new Error("Workspace file is from a newer app version.");

  const warnings: string[] = [];
  const surfaces = {} as Workspace["surfaces"];
  for (const id of SURFACE_IDS) {
    const { record, library } = decodeSurface(file.surfaces?.[id]);
    if (library && library !== `${LIBRARY_ID}@${LIBRARY_VERSION}`) {
      warnings.push(`Surface "${id}" was saved with library ${library}; current is ${LIBRARY_ID}@${LIBRARY_VERSION}.`);
    }
    surfaces[id] = record;
  }
  return {
    workspace: {
      id: file.id ?? crypto.randomUUID(),
      name: file.name ?? "Imported workspace",
      surfaces,
      chat: file.chat ?? [],
      inlineState: file.inlineState ?? {},
      artifacts: file.artifacts ?? [],
      notes: file.notes ?? [],
      appliedToolCalls: file.appliedToolCalls ?? [],
    },
    warnings,
  };
}

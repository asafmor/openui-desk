// ─────────────────────────────────────────────────────────────────────────────
// Browser-only tools: list_notes / add_note (contracts in
// shared/src/ui-tools/contracts.ts → LOCAL_UI_TOOLS).
//
// A tool is "whatever async function you put in the toolProvider". These read
// and write the workspace itself, so notes are exported/imported with it and
// work offline. The model learns about them from the same prompt `tools` list
// as the server tools — it cannot tell the difference, and does not need to.
// ─────────────────────────────────────────────────────────────────────────────
import type { Note } from "../../workspace/types";
import type { ToolFn } from "./rest-tools";

export function createLocalTools(getNotes: () => Note[], addNote: (note: Note) => void): Record<string, ToolFn> {
  return {
    list_notes: async () => ({ rows: getNotes() }),
    add_note: async (args) => {
      const text = String(args.text ?? "").trim();
      if (!text) throw new Error("Note text is required");
      const note = { id: crypto.randomUUID(), text, at: new Date().toISOString() };
      addNote(note);
      return { note };
    },
  };
}

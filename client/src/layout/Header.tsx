// Workspace controls: name, templates, export/import, tool backend toggle.
import { useRef } from "react";
import { showToast } from "../actions/toasts";
import { appEvent } from "../debug/app-events";
import type { ToolMode } from "../openui/tool-provider/useToolProvider";
import { downloadWorkspace, readWorkspaceFile } from "../workspace/storage";
import { TEMPLATES } from "../workspace/templates";
import type { Workspace } from "../workspace/types";
import { useWorkspace } from "../workspace/WorkspaceContext";

interface Props {
  toolMode: ToolMode;
  setToolMode: (m: ToolMode) => void;
  toolError: string | null;
}

export function Header({ toolMode, setToolMode, toolError }: Props) {
  const { state, dispatch } = useWorkspace();
  const fileInput = useRef<HTMLInputElement>(null);
  const ws = state.workspace;

  // A fresh id per load: the chat (useChat id) and every surface Renderer
  // (keyed by workspace id) remount with the loaded data, nothing stale left.
  const load = (next: Workspace, how: string) => {
    dispatch({ type: "replace", workspace: { ...next, id: crypto.randomUUID() } });
    appEvent("workspace-loaded", `${how}: ${next.name}`);
  };

  return (
    <header className="app-header">
      <strong className="app-header__logo">◧ OpenUI Desk</strong>
      <input className="app-header__name" aria-label="Workspace name" value={ws.name} onChange={(e) => dispatch({ type: "rename", name: e.target.value })} />
      <select
        aria-label="Load template"
        value=""
        onChange={(e) => {
          const t = TEMPLATES.find((x) => x.id === e.target.value);
          if (t && confirm(`Replace the current workspace with "${t.name}"? Export it first if you want to keep it.`)) load(t.create(), "template");
        }}
      >
        <option value="">New from template…</option>
        {TEMPLATES.map((t) => (
          <option key={t.id} value={t.id} title={t.description}>
            {t.name}
          </option>
        ))}
      </select>
      <button className="ou-btn ou-btn--secondary" onClick={() => downloadWorkspace(ws)}>
        Export
      </button>
      <button className="ou-btn ou-btn--secondary" onClick={() => fileInput.current?.click()}>
        Import
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const { workspace, warnings } = await readWorkspaceFile(file);
            load(workspace, "import");
            warnings.forEach((w) => showToast(w, "warning"));
          } catch (err) {
            showToast(`Import failed: ${(err as Error).message}`, "danger");
          }
        }}
      />
      <span className="app-header__spacer" />
      <label className="app-header__toggle" title="Where Query()/Mutation() calls go. Programs are identical either way.">
        Tools via
        <select value={toolMode} onChange={(e) => setToolMode(e.target.value as ToolMode)}>
          <option value="rest">REST function map</option>
          <option value="mcp">MCP client</option>
        </select>
      </label>
      {toolError ? <span className="chat__error" title={toolError}>MCP failed</span> : null}
    </header>
  );
}

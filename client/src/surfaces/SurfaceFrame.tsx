// The chrome around a surface: title, version history (undo), render-error
// badge with "Ask agent to fix", and a Source panel showing the exact
// program + state that will be saved — the best way to learn the language
// is to watch these change while you click and chat.
import { SURFACES, type SurfaceId } from "@demo/shared/surfaces";
import { useContext, useState, type ReactNode } from "react";
import { ActionHostContext } from "../actions/ActionHostContext";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function SurfaceFrame({ id, editing, children }: { id: SurfaceId; editing: boolean; children: ReactNode }) {
  const { state, dispatch } = useWorkspace();
  const host = useContext(ActionHostContext);
  const [showSource, setShowSource] = useState(false);
  const surface = state.workspace.surfaces[id];
  const errors = state.errors[id] ?? [];
  const last = surface.history.at(-1);

  return (
    <section className={`surface surface--${id}`} aria-label={SURFACES[id].title}>
      <header className="surface__bar">
        <strong>{SURFACES[id].title}</strong>
        <span className="surface__meta" title={last?.summary}>
          v{surface.history.length + 1}
        </span>
        {editing ? <span className="surface__editing">agent editing…</span> : null}
        {errors.length ? (
          <button
            className="surface__errors"
            title={errors.map((e) => `[${e.code}] ${e.message}`).join("\n")}
            onClick={() =>
              host?.sendActionTurn({ message: `Please fix the ${errors.length} render error(s) in the ${id} surface.`, context: { surface: id, errors } })
            }
          >
            ⚠ {errors.length} · ask agent to fix
          </button>
        ) : null}
        <span className="surface__spacer" />
        <button className="ou-icon-btn" disabled={!last} title={last ? `Undo: ${last.summary}` : "Nothing to undo"} onClick={() => dispatch({ type: "undo", surfaceId: id })}>
          ↶
        </button>
        <button className="ou-icon-btn" title="Show program & state" aria-pressed={showSource} onClick={() => setShowSource(!showSource)}>
          {"</>"}
        </button>
        <button className="ou-icon-btn" title="Clear surface" onClick={() => dispatch({ type: "clearSurface", surfaceId: id })}>
          ⌫
        </button>
      </header>
      {showSource ? (
        <div className="surface__source">
          <pre>{surface.program || "(empty)"}</pre>
          <pre>{JSON.stringify(surface.state, null, 2)}</pre>
        </div>
      ) : null}
      <div className="surface__body">{children}</div>
    </section>
  );
}

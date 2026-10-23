// ARTIFACTS (feature #17), part 2: the full view in a side panel, with a
// version picker. An artifact is a stored program, so it re-renders (and its
// Queries re-fetch) every time it is opened — even from an imported workspace.
import { Renderer } from "@openuidev/react-lang";
import { useState } from "react";
import { useOnAction } from "../actions/ActionHostContext";
import { library } from "../openui/library";
import { useActiveToolProvider } from "../openui/tool-provider/ToolProviderContext";
import { useWorkspace } from "../workspace/WorkspaceContext";
import { useArtifactViewer } from "./ArtifactViewerContext";

export function ArtifactPanel() {
  const { openId, setOpenId } = useArtifactViewer();
  const versions = useWorkspace().state.workspace.artifacts.filter((a) => a.id === openId);
  const [picked, setPicked] = useState<number | null>(null);
  const toolProvider = useActiveToolProvider();
  const onAction = useOnAction(`artifact:${openId}`);
  if (!openId || versions.length === 0) return null;
  const current = versions.find((v) => v.version === picked) ?? versions.at(-1)!;

  return (
    <aside className="artifact-panel" aria-label={current.title}>
      <header>
        <b>{current.title}</b>
        <select value={current.version} onChange={(e) => setPicked(Number(e.target.value))}>
          {versions.map((v) => (
            <option key={v.version} value={v.version}>
              v{v.version} · {new Date(v.at).toLocaleTimeString()}
            </option>
          ))}
        </select>
        <button className="ou-icon-btn" aria-label="Close" onClick={() => (setPicked(null), setOpenId(null))}>
          ×
        </button>
      </header>
      <div className="artifact-panel__body">
        <Renderer key={`${current.id}@${current.version}`} response={current.program} library={library} toolProvider={toolProvider} onAction={onAction} />
      </div>
    </aside>
  );
}

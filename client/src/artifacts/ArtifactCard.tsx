// ARTIFACTS (feature #17), part 1: the inline PREVIEW in the chat transcript,
// rendered from the publish_artifact tool result (see chat/ToolCallView.tsx).
import { useWorkspace } from "../workspace/WorkspaceContext";
import { useArtifactViewer } from "./ArtifactViewerContext";

export function ArtifactCard({ id, title }: { id: string; title: string }) {
  const { setOpenId } = useArtifactViewer();
  const versions = useWorkspace().state.workspace.artifacts.filter((a) => a.id === id).length;
  return (
    <button className="artifact-card" onClick={() => setOpenId(id)}>
      <span>📄</span>
      <span>
        <b>{title}</b>
        <small>artifact · {versions} version{versions === 1 ? "" : "s"} · click to open</small>
      </span>
    </button>
  );
}

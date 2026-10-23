// ─────────────────────────────────────────────────────────────────────────────
// SurfaceView — one LONG-LIVED <Renderer> per surface.
//
// The props are the whole story of a persistent generative interface:
//   response       the program (from the workspace; changed by patches/undo)
//   initialState   the saved state snapshot → restores filters, inputs, open
//                  modals on reload/import; also how @Broadcast reaches us
//                  (react-lang re-applies changed initialState values live)
//   onStateUpdate  every user change → back into the workspace → autosave
//   toolProvider   runs Query()/Mutation() (REST or MCP, see tool-provider/)
//   onAction       @ToAssistant, @OpenUrl and custom actions → host
//   onError        structured errors → workspace → next chat request
//   isStreaming    true only while an EMPTY surface receives its first program
//
// It uses the Renderer's SLOT API (feature #14) instead of the default view:
//   <Renderer.Root>        shared runtime, renders only its children
//   <Renderer.Content>     the generated UI; stays mounted during query errors
//   <Renderer.QueryError>  shown when a Query/Mutation failed
//   <Renderer.Retry>       re-runs failed queries (useRendererQuery().retry)
// ─────────────────────────────────────────────────────────────────────────────
import type { SurfaceId } from "@demo/shared/surfaces";
import { Renderer } from "@openuidev/react-lang";
import { useCallback } from "react";
import { useOnAction } from "../actions/ActionHostContext";
import { PanelBoundary } from "../layout/PanelBoundary";
import { library } from "../openui/library";
import { useActiveToolProvider } from "../openui/tool-provider/ToolProviderContext";
import { useWorkspace } from "../workspace/WorkspaceContext";
import { usePendingPatch } from "./PendingPatchesContext";
import { SurfaceFrame } from "./SurfaceFrame";
import { useErrorReporter } from "./useErrorReporter";

export function SurfaceView({ id }: { id: SurfaceId }) {
  return (
    <PanelBoundary name={`Surface "${id}"`}>
      <SurfaceRenderer id={id} />
    </PanelBoundary>
  );
}

function SurfaceRenderer({ id }: { id: SurfaceId }) {
  const { state, dispatch } = useWorkspace();
  const surface = state.workspace.surfaces[id];
  const pendingPatch = usePendingPatch(id);
  const toolProvider = useActiveToolProvider();
  const onAction = useOnAction(id);
  const onError = useErrorReporter(id);
  const onStateUpdate = useCallback(
    (s: Record<string, unknown>) => dispatch({ type: "setSurfaceState", surfaceId: id, state: s }),
    [dispatch, id],
  );

  // A brand-new surface streams its first program live (progressive render).
  // An existing surface keeps showing its current program until the patch is
  // complete — merging a half-written patch could drop statements.
  const firstStream = !surface.program && pendingPatch !== undefined;
  const response = firstStream ? pendingPatch : surface.program;

  return (
    <SurfaceFrame id={id} editing={pendingPatch !== undefined && !firstStream}>
      {response ? (
        <Renderer.Root
          response={response}
          library={library}
          isStreaming={firstStream}
          initialState={surface.state}
          onStateUpdate={onStateUpdate}
          onAction={onAction}
          onError={onError}
          toolProvider={toolProvider}
        >
          <Renderer.Content className="surface__content" />
          <Renderer.QueryError>
            <div className="surface__query-error" role="alert">
              Some data failed to load. <Renderer.Retry className="ou-btn ou-btn--secondary">Retry</Renderer.Retry>
            </div>
          </Renderer.QueryError>
        </Renderer.Root>
      ) : (
        <p className="surface__empty">Empty surface. Ask the agent to build something here, or load a template.</p>
      )}
    </SurfaceFrame>
  );
}

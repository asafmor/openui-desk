// An inline UI inside a chat message (default <Renderer> presentation).
// Its state is saved per message, so forms filled inside old answers come
// back after reload/import too.
import { Renderer } from "@openuidev/react-lang";
import { useCallback } from "react";
import { useOnAction } from "../actions/ActionHostContext";
import { library } from "../openui/library";
import { useActiveToolProvider } from "../openui/tool-provider/ToolProviderContext";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function InlineProgram({ stateKey, program, streaming }: { stateKey: string; program: string; streaming: boolean }) {
  const { state, dispatch } = useWorkspace();
  const toolProvider = useActiveToolProvider();
  const onAction = useOnAction("chat");
  const onStateUpdate = useCallback(
    (s: Record<string, unknown>) => dispatch({ type: "setInlineState", key: stateKey, state: s }),
    [dispatch, stateKey],
  );
  return (
    <div className="chat__inline-ui">
      <Renderer
        response={program}
        library={library}
        isStreaming={streaming}
        initialState={state.workspace.inlineState[stateKey]}
        onStateUpdate={onStateUpdate}
        onAction={onAction}
        toolProvider={toolProvider}
      />
    </div>
  );
}

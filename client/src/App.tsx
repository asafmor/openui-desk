// ─────────────────────────────────────────────────────────────────────────────
// App shell: wires the providers and lays out the surfaces around the chat.
//
//   WorkspaceProvider        the long-lived, serializable state (workspace/)
//     ActionHostContext      onAction routing for every Renderer (actions/)
//     ToolProviderContext    Query()/Mutation() backend (openui/tool-provider/)
//     PendingPatchesContext  live agent patches (chat/pending-patches.ts)
//     ArtifactViewerContext  which artifact is open (artifacts/)
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { ActionHostContext } from "./actions/ActionHostContext";
import type { ActionHost } from "./actions/handle-action";
import { Toasts } from "./actions/toasts";
import { ArtifactPanel } from "./artifacts/ArtifactPanel";
import { ArtifactViewerContext } from "./artifacts/ArtifactViewerContext";
import { ChatPanel } from "./chat/ChatPanel";
import { useDeskChat } from "./chat/useDeskChat";
import { appEvent } from "./debug/app-events";
import { DockTabs } from "./layout/DockTabs";
import { Header } from "./layout/Header";
import { ToolProviderContext } from "./openui/tool-provider/ToolProviderContext";
import { useToolProvider, type ToolMode } from "./openui/tool-provider/useToolProvider";
import { PendingPatchesContext } from "./surfaces/PendingPatchesContext";
import { SurfaceView } from "./surfaces/SurfaceView";
import { useWorkspace } from "./workspace/WorkspaceContext";

export function App() {
  const { state, dispatch } = useWorkspace();
  const wsId = state.workspace.id;
  const chat = useDeskChat();
  const [toolMode, setToolMode] = useState<ToolMode>("rest");
  const tools = useToolProvider(toolMode);
  const [openArtifact, setOpenArtifact] = useState<string | null>(null);

  const actionHost = useMemo<ActionHost>(
    () => ({
      sendActionTurn: chat.sendActionTurn,
      broadcast: (key, value) => {
        dispatch({ type: "broadcast", key, value });
        appEvent("broadcast", `$${key} = ${JSON.stringify(value)} → all surfaces`);
      },
    }),
    [chat.sendActionTurn, dispatch],
  );

  return (
    <ActionHostContext.Provider value={actionHost}>
      <ToolProviderContext.Provider value={tools.provider}>
        <PendingPatchesContext.Provider value={chat.pending}>
          <ArtifactViewerContext.Provider value={{ openId: openArtifact, setOpenId: setOpenArtifact }}>
            <div className="app">
              <Header toolMode={toolMode} setToolMode={setToolMode} toolError={tools.error} />
              {/* key = workspace id: loading a workspace remounts every Renderer */}
              <div className="area-top">
                <SurfaceView key={wsId} id="top" />
              </div>
              <div className="area-rail">
                <SurfaceView key={wsId} id="rail" />
              </div>
              <div className="area-chat">
                <ChatPanel key={wsId} chat={chat} />
              </div>
              <div className="area-canvas">
                <SurfaceView key={wsId} id="canvas" />
              </div>
              <div className="area-dock">
                <DockTabs workspaceId={wsId} />
              </div>
              <ArtifactPanel />
              <Toasts />
            </div>
          </ArtifactViewerContext.Provider>
        </PendingPatchesContext.Provider>
      </ToolProviderContext.Provider>
    </ActionHostContext.Provider>
  );
}

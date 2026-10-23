// ─────────────────────────────────────────────────────────────────────────────
// useChat from @ai-sdk/react, wired to the workspace.
//
//  • id + messages: the chat is created once per id from the workspace's saved
//    transcript. Loading another workspace gives a new id → a fresh chat.
//  • transport: adds the live surfaces to every request (./chat-transport.ts).
//  • onFinish: copy the finished transcript back into the workspace (autosaved).
//  • sendActionTurn: a click in generated UI becomes a user turn, stored in
//    OpenUI's message format (shared/src/protocol/action-message.ts).
// ─────────────────────────────────────────────────────────────────────────────
import { useChat } from "@ai-sdk/react";
import { encodeActionTurn, type ActionTurn } from "@demo/shared/protocol/action-message";
import type { SurfaceSnapshot } from "@demo/shared/protocol/chat-request";
import { SURFACE_IDS } from "@demo/shared/surfaces";
import { useMemo, useRef } from "react";
import { useWorkspace } from "../workspace/WorkspaceContext";
import { useApplyToolResults } from "./apply-tool-results";
import { createDeskTransport } from "./chat-transport";
import { pendingPatches } from "./pending-patches";

export function useDeskChat() {
  const { state, dispatch } = useWorkspace();
  const ws = state.workspace;

  // The transport reads surfaces through a ref, so it always sends the latest.
  const surfacesRef = useRef<SurfaceSnapshot[]>([]);
  surfacesRef.current = SURFACE_IDS.map((id) => ({
    id,
    program: ws.surfaces[id].program,
    state: ws.surfaces[id].state,
    errors: state.errors[id] ?? [],
  }));
  const transport = useMemo(() => createDeskTransport(() => surfacesRef.current), []);

  const chat = useChat({
    id: ws.id,
    messages: ws.chat,
    transport,
    onFinish: ({ messages }) => dispatch({ type: "setChat", chat: messages }),
  });

  useApplyToolResults(chat.messages);
  const streaming = chat.status === "streaming" || chat.status === "submitted";

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    stop: chat.stop,
    streaming,
    pending: useMemo(() => pendingPatches(chat.messages, streaming), [chat.messages, streaming]),
    sendText: (text: string) => void chat.sendMessage({ text }),
    sendActionTurn: (turn: ActionTurn) => void chat.sendMessage({ text: encodeActionTurn(turn) }),
  };
}

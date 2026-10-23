// Picks the toolProvider for every <Renderer> in the app. The header toggle
// switches REST ⇄ MCP live; surface programs do not change at all.
import type { McpClientLike } from "@openuidev/react-lang";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspace } from "../../workspace/WorkspaceContext";
import { createLocalTools } from "./local-tools";
import { connectMcp, createMcpProvider } from "./mcp-tools";
import { createRestTools, type ToolFn } from "./rest-tools";

export type ToolMode = "rest" | "mcp";
export type ToolProvider = Record<string, ToolFn> | McpClientLike;

export function useToolProvider(mode: ToolMode): { provider: ToolProvider | null; error: string | null } {
  const { state, dispatch } = useWorkspace();
  // A ref keeps local tools reading the LATEST notes without rebuilding the provider.
  const notesRef = useRef(state.workspace.notes);
  notesRef.current = state.workspace.notes;

  const local = useMemo(
    () =>
      createLocalTools(
        () => notesRef.current,
        (note) => {
          // Update the ref NOW: in Action([@Run(addNote), @Run(notes)]) the
          // query re-runs before React re-renders with the dispatched state.
          notesRef.current = [note, ...notesRef.current];
          dispatch({ type: "addNote", note });
        },
      ),
    [dispatch],
  );
  const rest = useMemo(() => ({ ...createRestTools(), ...local }), [local]);

  const [mcp, setMcp] = useState<McpClientLike | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (mode !== "mcp") return;
    let cancelled = false;
    connectMcp()
      .then((client) => !cancelled && setMcp(createMcpProvider(client, local)))
      .catch((err) => !cancelled && setError(String(err)));
    return () => {
      cancelled = true;
    };
  }, [mode, local]);

  if (mode === "mcp") return { provider: mcp, error };
  return { provider: rest, error: null };
}

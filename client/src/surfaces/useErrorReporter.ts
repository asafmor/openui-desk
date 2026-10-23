// <Renderer onError> → workspace errors (feature #13).
//
// onError receives structured, LLM-friendly OpenUIErrors from the parser
// (unknown-component, type-mismatch, …), the runtime (runtime-error from a
// bad expression or custom function, render-error from a component throw)
// and the query system (tool-not-found, tool-error, mcp-error). It is called
// with [] once everything is fixed.
//
// We keep them per surface; the chat transport sends them with the next
// request, and the surface header offers "Ask agent to fix".
// Warnings (severity "warning") still render, so they are not sent.
import type { SurfaceError } from "@demo/shared/protocol/chat-request";
import type { SurfaceId } from "@demo/shared/surfaces";
import type { OpenUIError } from "@openuidev/react-lang";
import { useCallback, useRef } from "react";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function useErrorReporter(surfaceId: SurfaceId) {
  const { dispatch } = useWorkspace();
  const last = useRef("[]");
  return useCallback(
    (errors: OpenUIError[]) => {
      const trimmed: SurfaceError[] = errors
        .filter((e) => e.severity !== "warning")
        .map((e) => ({ code: e.code, statementId: e.statementId, message: e.message, hint: e.hint }));
      const key = JSON.stringify(trimmed);
      if (key === last.current) return; // avoid re-dispatching identical lists
      last.current = key;
      dispatch({ type: "setSurfaceErrors", surfaceId, errors: trimmed });
    },
    [dispatch, surfaceId],
  );
}

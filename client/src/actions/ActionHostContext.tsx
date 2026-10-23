// Gives every Renderer an `onAction(origin)` factory without prop drilling.
import { createContext, useCallback, useContext } from "react";
import type { LibraryActionEvent } from "@openuidev/react-lang";
import type { AppLibrary } from "../openui/library";
import { handleAction, type ActionHost } from "./handle-action";

export const ActionHostContext = createContext<ActionHost | null>(null);

export function useOnAction(origin: string) {
  const host = useContext(ActionHostContext);
  return useCallback(
    (event: LibraryActionEvent<AppLibrary>) => {
      if (host) handleAction(event, origin, host);
    },
    [host, origin],
  );
}

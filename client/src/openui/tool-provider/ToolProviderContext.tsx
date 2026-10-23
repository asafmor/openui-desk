// Shares the active toolProvider with every <Renderer> (surfaces, inline chat
// UIs, artifacts), so they all call the same backend.
import { createContext, useContext } from "react";
import type { ToolProvider } from "./useToolProvider";

export const ToolProviderContext = createContext<ToolProvider | null>(null);
export const useActiveToolProvider = () => useContext(ToolProviderContext);

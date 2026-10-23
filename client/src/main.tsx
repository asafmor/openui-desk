// Entry point.
//
// OPENUI DEVTOOLS (feature #19): @openuidev/react-lang tries to auto-mount the
// DevTools widget when process.env.NODE_ENV === "development". We mount it
// explicitly instead, gated on Vite's import.meta.env.DEV, so it is obvious
// and configurable. A manually mounted instance wins over the auto-mount.
// It shows every event on the @openuidev/observability bus: each Renderer's
// streaming/settled snapshots, parse/runtime/query errors, and our own
// `desk:*` events (debug/app-events.ts). It renders nothing in production.
import { OpenUIDevtools } from "@openuidev/devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { loadAutosave } from "./workspace/storage";
import { TEMPLATES } from "./workspace/templates";
import { WorkspaceProvider } from "./workspace/WorkspaceContext";

// Resume exactly where we left off; first visit starts with the feature tour.
const initial = loadAutosave() ?? TEMPLATES[0].create();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WorkspaceProvider initial={initial}>
      <App />
    </WorkspaceProvider>
    {import.meta.env.DEV ? <OpenUIDevtools position="bottom-right" maxEvents={200} /> : null}
  </StrictMode>,
);

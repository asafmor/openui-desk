// Starting points for a workspace. Export your own workspaces to files to
// build up a personal library and switch between them with Import.
import { createWorkspace } from "../empty-workspace";
import type { Workspace } from "../types";
import { FEATURE_TOUR } from "./feature-tour";

export const TEMPLATES: { id: string; name: string; description: string; create: () => Workspace }[] = [
  {
    id: "tour",
    name: "Feature tour",
    description: "Hand-written surfaces using every OpenUI feature. Evolve them with the agent.",
    create: () => createWorkspace("Feature tour", FEATURE_TOUR),
  },
  {
    id: "blank",
    name: "Blank",
    description: "Four empty surfaces. Ask the agent to build everything from scratch.",
    create: () => createWorkspace("Blank workspace"),
  },
];

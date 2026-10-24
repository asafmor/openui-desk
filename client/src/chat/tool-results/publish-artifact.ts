// publish_artifact ok:true → store a new artifact version (feature #17).
// Server side: server/src/mastra/tools/publish-artifact.ts.
import type { PublishArtifactOutput } from "../tool-parts";
import type { ToolResultApplier } from "./types";

export const applyPublishArtifact: ToolResultApplier = (output) => {
  const out = output as PublishArtifactOutput | undefined;
  if (!out?.ok) return [];
  return [{ type: "addArtifact", artifact: { id: out.id, title: out.title, program: out.program } }];
};

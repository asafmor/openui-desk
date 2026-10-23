// Shows each agent tool call in the transcript, so you can SEE the agent-side
// tools (data reads), the edit-mode patches it sends to surfaces, failed
// patches it then fixes (self-correction), and published artifacts.
import { getToolName } from "ai";
import { ArtifactCard } from "../artifacts/ArtifactCard";
import type { PublishArtifactOutput, ToolPart, UpdateSurfaceInput, UpdateSurfaceOutput } from "./tool-parts";

function UpdateSurfaceCall({ part }: { part: ToolPart }) {
  const input = (part.input ?? {}) as UpdateSurfaceInput;
  const out = part.state === "output-available" ? (part.output as UpdateSurfaceOutput) : undefined;
  const status = !out ? "writing patch…" : out.ok ? "applied" : `rejected (${out.errors?.length} errors)`;
  return (
    <details className={`tool tool--surface ${out && !out.ok ? "tool--failed" : ""}`}>
      <summary>
        ✎ <b>{input.surfaceId ?? "…"}</b> {input.summary ?? ""} <em>{status}</em>
      </summary>
      <pre>{input.patch}</pre>
      {out && !out.ok ? <pre className="tool__errors">{out.errors?.map((e) => `[${e.code}] ${e.statementId ?? ""} ${e.message}`).join("\n")}</pre> : null}
    </details>
  );
}

export function ToolCallView({ part }: { part: ToolPart }) {
  const name = getToolName(part);
  if (name === "update_surface") return <UpdateSurfaceCall part={part} />;
  if (name === "publish_artifact" && part.state === "output-available") {
    const out = part.output as PublishArtifactOutput;
    if (out.ok) return <ArtifactCard id={out.id} title={out.title} />;
  }
  return (
    <details className="tool">
      <summary>
        ⚙ {name} <em>{part.state}</em>
      </summary>
      <pre>{JSON.stringify(part.input, null, 2)}</pre>
      {part.state === "output-available" ? <pre>{JSON.stringify(part.output, null, 2).slice(0, 2000)}</pre> : null}
      {part.state === "output-error" ? <pre className="tool__errors">{part.errorText}</pre> : null}
    </details>
  );
}

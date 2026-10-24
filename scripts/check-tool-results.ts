// Runnable check for the client's tool-result pipeline (no browser needed):
// applier (pure) → "toolCall" envelope in the reducer → applied exactly once.
import assert from "node:assert/strict";
import { TOOL_RESULT_APPLIERS } from "../client/src/chat/tool-results";
import { createWorkspace } from "../client/src/workspace/empty-workspace";
import { workspaceReducer, type WorkspaceState } from "../client/src/workspace/workspace-reducer";

const call = (tool: string, toolCallId: string, output: unknown) => (s: WorkspaceState) =>
  workspaceReducer(s, { type: "toolCall", toolCallId, actions: TOOL_RESULT_APPLIERS[tool](output) });

let s: WorkspaceState = { workspace: createWorkspace("t"), errors: {} };
s = call("update_surface", "c1", { ok: true, surfaceId: "canvas", patch: 'root = Stack([t])\nt = TextContent("hi")', summary: "x" })(s);
assert.match(s.workspace.surfaces.canvas.program, /TextContent\("hi"\)/);

const replayed = call("update_surface", "c1", { ok: true, surfaceId: "canvas", patch: "t = null", summary: "x" })(s);
assert.equal(replayed.workspace, s.workspace, "same toolCallId must not apply twice");

s = call("set_surface_state", "c2", { ok: true, surfaceIds: ["canvas", "nope"], values: { $tab: "tickets" } })(s);
assert.equal(s.workspace.surfaces.canvas.state.$tab, "tickets");

s = call("publish_artifact", "c3", { ok: true, id: "a", title: "R", program: "root = Stack([])" })(s);
s = call("publish_artifact", "c4", { ok: true, id: "a", title: "R", program: "root = Stack([])" })(s);
assert.deepEqual(s.workspace.artifacts.map((a) => a.version), [1, 2]);

assert.deepEqual(TOOL_RESULT_APPLIERS.update_surface({ ok: false, errors: [] }), [], "ok:false applies nothing");
assert.deepEqual(s.workspace.appliedToolCalls, ["c1", "c2", "c3", "c4"]);
console.log("✓ tool results: applied once, in order, failures ignored");

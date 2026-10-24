import type { BaseWorkspaceAction } from "../../workspace/workspace-reducer";

/**
 * Turns ONE finished tool result into workspace changes. Pure: no dispatch,
 * no React, no idempotency bookkeeping. Return [] to ignore the result
 * (e.g. ok:false — the agent retries in the same turn).
 * `output` is whatever the server tool returned: check it before trusting it.
 */
export type ToolResultApplier = (output: unknown) => BaseWorkspaceAction[];

// Runs a UI tool by name with UNTRUSTED input (it comes from the browser and
// was chosen by the model). This is the trust boundary: validate with the
// contract's Zod schema before touching the database.
//
// In a real app this is also where you would check the user's permissions
// for the specific tool and record an audit log for mutations.
import { SERVER_UI_TOOLS } from "@demo/shared/ui-tools/contracts";
import { UI_TOOL_HANDLERS } from "./handlers";

export class UiToolError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function runUiTool(name: string, rawInput: unknown): unknown {
  const contract = SERVER_UI_TOOLS.find((t) => t.name === name);
  if (!contract) throw new UiToolError(`Unknown tool "${name}"`, 404);

  const parsed = contract.input.safeParse(rawInput ?? {});
  if (!parsed.success) {
    throw new UiToolError(`Invalid input for ${name}: ${parsed.error.issues.map((i) => i.message).join("; ")}`, 400);
  }
  return UI_TOOL_HANDLERS[name](parsed.data);
}

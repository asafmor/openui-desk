// ─────────────────────────────────────────────────────────────────────────────
// Validate an OpenUI Lang program OUTSIDE the browser (feature #13).
//
// createParser(spec.schema, spec.root) is the same parser the Renderer uses,
// built from the JSON Schema inside the generated spec. A program is "clean"
// when, after the stream has ENDED:
//   - it has a root
//   - meta.incomplete is false        (no unclosed string/bracket)
//   - meta.errors is empty            (unknown-component, type-mismatch, …)
//   - meta.unresolved is empty        (references never defined)
//   - meta.orphaned is empty          (defined but unreachable from root)
// While streaming, `incomplete` and `unresolved` are normal — never judge a
// half-streamed program.
//
// Used by: the update_surface agent tool (self-correction loop inside one
// agent turn) and scripts/check-programs.ts (prompt examples & templates).
// ─────────────────────────────────────────────────────────────────────────────
import { createParser, type LibraryJSONSchema } from "@openuidev/lang-core";
import { librarySpec } from "../library-spec";

const parser = createParser(
  (librarySpec as unknown as { schema: LibraryJSONSchema }).schema,
  librarySpec.root,
);

export interface ProgramIssue {
  code: string;
  statementId?: string;
  message: string;
  hint?: string;
}

export function validateProgram(program: string): ProgramIssue[] {
  const result = parser.parse(program);
  // Parser errors already carry a self-explanatory message (expected
  // signature, available components…). Warnings still render, so skip them.
  const issues: ProgramIssue[] = result.meta.errors
    .filter((e) => e.severity !== "warning")
    .map((e) => ({ code: e.code, statementId: e.statementId, message: e.message }));
  if (!result.root) issues.push({ code: "no-root", message: "The program has no root statement." });
  if (result.meta.incomplete) issues.push({ code: "incomplete", message: "Unclosed string or bracket." });
  for (const name of result.meta.unresolved)
    issues.push({ code: "unresolved", statementId: name, message: `"${name}" is referenced but never defined.` });
  for (const name of result.meta.orphaned)
    issues.push({
      code: "orphaned",
      statementId: name,
      message: `"${name}" is defined but not reachable from root, so it will not render.`,
      hint: `Reference ${name} from a parent, or delete it with ${name} = null.`,
    });
  return issues;
}

/**
 * The $variables a program declares, with their defaults: `$status = "open"`
 * → { $status: "open" }. Used by the set_surface_state agent tool to reject
 * keys nothing reads and values of the wrong type.
 */
export function declaredState(program: string): Record<string, unknown> {
  return parser.parse(program).stateDeclarations ?? {};
}

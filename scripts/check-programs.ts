// `pnpm check` — parse every hand-written program (prompt examples + templates)
// against the generated library spec. A wrong example teaches the model a
// wrong pattern, so this runs before `pnpm dev`.
import { TOOL_EXAMPLES } from "../shared/src/prompt/examples";
import { validateProgram } from "../shared/src/program/validate-program";
import { FEATURE_TOUR } from "../client/src/workspace/templates/feature-tour";

const programs: [string, string][] = [
  ...TOOL_EXAMPLES.map((p, i): [string, string] => [`prompt example #${i + 1}`, p]),
  ...Object.entries(FEATURE_TOUR).map(([id, p]): [string, string] => [`feature tour / ${id}`, p]),
];

let failed = 0;
for (const [name, program] of programs) {
  const issues = validateProgram(program);
  console.log(`${issues.length ? "✗" : "✓"} ${name}`);
  for (const i of issues) console.log(`    [${i.code}] ${i.statementId ?? ""} ${i.message}`);
  failed += issues.length ? 1 : 0;
}
if (failed) {
  console.error(`\n${failed} program(s) have issues.`);
  process.exit(1);
}

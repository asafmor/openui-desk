// ─────────────────────────────────────────────────────────────────────────────
// The STATIC part of the system prompt, generated once at startup.
//
// generateSystemPrompt({ library, promptOptions }) — the FULL prompt (no
// `cloud: true`). It contains, in order: our preamble, syntax rules, the
// component signatures (from the generated spec), built-in + custom
// functions, Query/Mutation/tool docs (from promptOptions.tools), hoisting &
// streaming guidance, the Edit Mode and Inline Mode sections, our rules,
// and the examples. Print it with `pnpm prompt` to read what the model reads.
// ─────────────────────────────────────────────────────────────────────────────
import { librarySpec } from "@demo/shared/library-spec";
import { promptOptions } from "@demo/shared/prompt/prompt-options";
import { generateSystemPrompt } from "@openuidev/lang-core";

export const BASE_SYSTEM_PROMPT = generateSystemPrompt({ library: librarySpec, promptOptions });

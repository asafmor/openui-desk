// ─────────────────────────────────────────────────────────────────────────────
// PROMPT OPTIONS — what OpenUI's prompt generator should teach the model.
//
// Server-safe (no React): imported by server/src/mastra/prompt/system-prompt.ts
// and by the check/prompt scripts.
//
// IMPORTANT: everything below is only honored by the FULL prompt,
// `generateSystemPrompt({ library, promptOptions })`. The cloud variant
// (`cloud: true`, for OpenUI Gateway) drops tools/toolCalls/bindings/editMode/
// inlineMode — which would silently remove Query, Mutation, $state and patches.
// ─────────────────────────────────────────────────────────────────────────────
import type { PromptOptions } from "@openuidev/lang-core";
import { toToolSpec } from "../ui-tools/descriptors";
import { ALL_UI_TOOLS } from "../ui-tools/contracts";
import { TOOL_EXAMPLES } from "./examples";
import { PREAMBLE } from "./preamble";
import { RULES } from "./rules";

export const promptOptions: PromptOptions = {
  preamble: PREAMBLE,
  additionalRules: RULES,

  // UI-side tools the model may call from Query()/Mutation() (feature #3).
  tools: ALL_UI_TOOLS.map(toToolSpec),
  toolExamples: TOOL_EXAMPLES,
  // These two default to true once `tools` is set; written out for clarity.
  toolCalls: true, // teaches Query(), Mutation(), @Run
  bindings: true, // teaches $variables, @Set, @Reset, $binding<type> props

  editMode: true, // feature #8: answer with changed statements only (patches)
  inlineMode: true, // feature #9: prose + fenced code, or prose only
};

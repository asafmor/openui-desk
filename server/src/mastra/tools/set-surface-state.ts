// ─────────────────────────────────────────────────────────────────────────────
// set_surface_state — the AGENT drives the live UI without rewriting it.
//
// Two ways for the agent to change a surface:
//   update_surface     changes the PROGRAM  (what exists: components, queries)
//   set_surface_state  changes the STATE    (what it shows now: filters, tab,
//                                            selected ticket, open modal, inputs)
//
// Why a patch can't do this: patching `$status = "pending"` only changes the
// DEFAULT. The Renderer's saved state already holds $status, and lang-core's
// store.initialize lets saved values win over defaults. So the table would
// not move.
//
// Flow of one call:
//   model ──{surfaceId, changes}──► execute()
//     1. check every key is a $variable the target program DECLARES
//        (parser.stateDeclarations) and the value has the default's type
//     2a. problems → { ok:false, errors } → the model fixes it in the same turn
//     2b. clean    → { ok:true, surfaceIds, values }
//   browser: client/src/chat/apply-tool-results.ts → reducer "setStateValues"
//     writes the values into the surfaces' saved state → <Renderer initialState>
//     re-applies them live → bound Selects update, dependent Queries re-fetch.
//     This is the same path as the @Broadcast custom action
//     (client/src/openui/actions/broadcast.ts), just started by the agent.
// ─────────────────────────────────────────────────────────────────────────────
import { declaredState } from "@demo/shared/program/validate-program";
import { SURFACE_IDS } from "@demo/shared/surfaces";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getSurfaces, setSurfaceStateValues } from "../request-context";

const Change = z.object({
  key: z.string().describe('$variable name, e.g. "status" or "$status"'),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const setSurfaceState = createTool({
  id: "set_surface_state",
  description:
    'Change what a surface currently shows (filters, search, tab, selected ticket, open modal, form inputs) by setting $variables its program already declares. Does not change the program. surfaceId "all" sets each key in every surface that declares it.',
  inputSchema: z.object({
    surfaceId: z.enum([...SURFACE_IDS, "all"]),
    // An array of {key, value} instead of a record: strict tool schemas
    // (OpenAI) reject open-ended objects.
    changes: z.array(Change).min(1),
    summary: z.string().describe("One short sentence, shown in the chat"),
  }),
  execute: async ({ surfaceId, changes, summary }, context) => {
    const all = getSurfaces(context?.requestContext);
    const targets = surfaceId === "all" ? all : all.filter((s) => s.id === surfaceId);
    const values: Record<string, unknown> = {};
    const errors: { code: string; message: string; hint?: string }[] = [];

    for (const { key, value } of changes) {
      const name = `$${key.replace(/^\$/, "")}`;
      const declaring = targets.filter((s) => name in declaredState(s.program));
      if (declaring.length === 0) {
        const known = targets.flatMap((s) => Object.keys(declaredState(s.program)));
        errors.push({
          code: "undeclared",
          message: `${name} is not declared in ${surfaceId}.`,
          hint: known.length ? `Declared: ${[...new Set(known)].join(", ")}. Or add it with update_surface first.` : "The surface is empty.",
        });
        continue;
      }
      const expected = typeof declaredState(declaring[0].program)[name];
      if (expected !== "undefined" && expected !== "object" && typeof value !== expected) {
        errors.push({ code: "type-mismatch", message: `${name} holds a ${expected}, got ${typeof value}.` });
        continue;
      }
      values[name] = value;
    }

    if (errors.length > 0) return { ok: false, surfaceId, errors, note: "Nothing was applied. Fix and call again." };
    const surfaceIds = targets.map((s) => s.id);
    setSurfaceStateValues(context?.requestContext, surfaceIds, values);
    return { ok: true, surfaceIds, values, summary };
  },
});

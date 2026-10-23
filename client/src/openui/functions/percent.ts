// CUSTOM FUNCTION (feature #5): @Percent(part, total) → "42%"
//
// defineFunction adds a pure, synchronous helper the model can call anywhere
// an expression is allowed, exactly like the built-ins (@Count, @Sum, …):
//
//     Kpi("Breached", stats.breached, @Percent(stats.breached, stats.open) + " of open")
//
//  • params: a Zod object; its KEY ORDER is the positional argument order.
//  • returns: printed in the prompt signature and checked at runtime.
//  • fn: runs in the BROWSER during evaluation. Only the signature and the
//    description are sent to the model.
//  • Must be pure: OpenUI may cache results and call it any number of times.
//    Bad arguments, a throw or a wrong return type → the call evaluates to
//    null and a `runtime-error` is reported (see onError, feature #13).
import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod";

export const percent = defineFunction({
  name: "Percent",
  description: 'part / total as a whole percentage string, e.g. "42%". Returns "0%" when total is 0.',
  params: z.object({ part: z.number(), total: z.number() }),
  returns: z.string(),
  fn: ({ part, total }) => (total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`),
});

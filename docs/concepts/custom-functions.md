# Custom functions

!!! abstract
    Add small, pure helpers the model can call in any expression, like `@Percent(part, total)` or `@Duration(hours)`. They run in the browser while a program evaluates.

**Adopt alone?** Yes · **Effort** S · **Touches** client, prompt (through the spec)

## The problem

Models are bad at formatting and arithmetic inside markup. Without helpers they write `stats.breached / stats.open * 100 + "%"`, forget rounding and divide by zero. They also can't map your domain to visuals ("urgent" should look red) unless you spell it out in every prompt. A named function fixes both. The model writes `@PriorityTone(t.priority)`, and the logic lives in code you test.

## How the demo does it

Each function is one file under [`client/src/openui/functions`](https://github.com/asafmor/openui-desk/tree/main/client/src/openui/functions):

```ts title="client/src/openui/functions/percent.ts"
export const percent = defineFunction({
  name: "Percent",
  description: 'part / total as a whole percentage string, e.g. "42%". Returns "0%" when total is 0.',
  params: z.object({ part: z.number(), total: z.number() }),
  returns: z.string(),
  fn: ({ part, total }) => (total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`),
});
```

[Source](https://github.com/asafmor/openui-desk/blob/main/client/src/openui/functions/percent.ts)

| Function | Purpose | Used in |
| --- | --- | --- |
| `@Percent(part, total)` | Safe percentage string | Top strip "SLA breached" KPI |
| `@Duration(hours)` | `28` → `"1d 4h"` | Ticket age column, summary line |
| `@Tone(value, warn, danger)` | Thresholds → `success`/`warning`/`danger` | Queue depth, latency KPIs |
| `@PriorityTone(priority)` | Domain value → tone | Priority badges |
| `@ShortTime(iso)` | ISO timestamp → `"10-23 13:33"` | Activity feed |

They are registered once, in `functions: customFunctions` of `createLibrary` ([`library.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/openui/library.ts)), and used like built-ins:

```text
breached = Kpi("SLA breached", stats.breached, @Percent(stats.breached, stats.open + stats.pending) + " of active", stats.breached > 0 ? "danger" : "success")
Col("Priority", @Each(sorted, "t", Badge(t.priority, @PriorityTone(t.priority))))
```

### What the model sees

Only the signature and description reach the prompt (through the generated spec). The `fn` body never leaves the browser.

- `params` is a Zod object, and **its key order is the positional argument order**.
- `returns` is printed in the signature and checked at runtime.

### Functions vs built-ins vs actions

| | Built-in functions | Custom functions | Custom actions |
| --- | --- | --- | --- |
| Examples | `@Filter`, `@Sort`, `@Count`, `@Avg`, `@Each`, … | `@Percent`, `@Duration` | `@Notify`, `@Broadcast` |
| Where | Any expression | Any expression | Action props only (`Button`, `MenuItem`, …) |
| Runs | During evaluation, in the browser | During evaluation, in the browser | On a click, in your host's `onAction` |
| Side effects | No | **Must not** have any | Yes, that's their purpose |
| Return value | Used in the UI | Used in the UI | None |

## Port it to your app

1. Write the function with `defineFunction({ name, description, params, returns, fn })`. Keep it pure: same input, same output, no clock, no network, no storage.
2. Add it to `functions: [...]` in `createLibrary`.
3. Regenerate the spec so the prompt lists it (see [Prompt generation](prompt.md)).
4. Use it in a hand-written program or a prompt example to check that it parses. The demo's `pnpm check` validates examples and templates.

## Variations

- **No shared client/server package.** Nothing extra. Functions travel inside the spec JSON.
- **You already have your own chat and history.** No change.
- **Values that need the current time.** Compute them on the server and return them from a Query, as the demo does: `ageHours` comes from the server and `@Duration` only formats it.

## Pitfalls

!!! warning "Keep functions pure"
    OpenUI may cache results and call a function any number of times while the program evaluates or streams. A function that reads the clock, random numbers or storage gives values that change between renders.

- A throw, bad arguments or a wrong return type make the call evaluate to `null` and report a `runtime-error` to `onError`. Handle edge cases, like `total === 0`, inside the function.
- Descriptions are prompt text. State the output format with an example (`"42%"`), so the model knows how to combine the result with other strings.
- Renaming a function breaks saved programs that call it. Treat names as a public API, like component props.

## Related

- [Your own component library](component-library.md)
- [Custom actions & the host](custom-actions.md)
- [Data-shaped UI](data-shaped-ui.md)
- [Prompt generation](prompt.md)

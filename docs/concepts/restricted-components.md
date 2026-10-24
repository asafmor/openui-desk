# Restricting components per surface

!!! abstract
    Give a surface, or a whole agent, a smaller set of components. Derive a library with `library.extend({ components: { remove } })` and render with it, then prompt and validate with that library's spec.

**Adopt alone?** Needs: [Your own component library](component-library.md) · **Effort** S (client only) to M (with server validation) · **Touches** client, server, prompt

## The problem

Not every place in an app should accept every component. A read-only KPI strip should not grow a form. A compliance-sensitive panel should never render model-written HTML. If the model *can* use a component somewhere, sooner or later it will. You want a restriction that holds even when the prompt is ignored.

There are three layers, and each one alone is weaker than all three together:

| Layer | What it does | Holds when the model ignores the prompt? |
| --- | --- | --- |
| **Prompt** | The model only sees the allowed components | No |
| **Renderer** | `<Renderer library={subset}>` can't draw what it doesn't know | Yes, the component doesn't render (`unknown-component`) |
| **Server validation** | A parser built from the subset's spec rejects the program before it is saved | Yes, and the error goes back to the model to fix |

## How the demo does it

The demo restricts components in two places.

**1. A protocol surface with its own library.** The A2UI incident panel uses a library derived from the main one. `extend()` returns a **new** library; the base is untouched.

```ts title="client/src/a2ui/incident-library.tsx"
export const incidentLibrary = library.extend({
  components: {
    add: [{ component: IncidentClock, slots: ["Card.children"] }], // only valid inside a Card
    override: [PulseBadge],          // same name "Badge" → every parent now uses this one
    remove: ["HtmlFrame", "Modal"],  // gone from the library, parent unions and groups
  },
  actions: { add: [acknowledge, resolve, restart] },
});
```

[Source](https://github.com/asafmor/openui-desk/blob/main/client/src/a2ui/incident-library.tsx)

**2. A restricted action slot.** Instead of `action()` (any action), `ShareButton`'s prop is a union of two specific action refs. The prompt prints `share: @CopyToClipboard | @OpenUrl`.

```ts title="client/src/openui/components/inputs/ShareButton.tsx"
props: z.object({
  label: z.string(),
  share: z.union([copyToClipboard.ref, steps.OpenUrl.ref]),
}),
```

[Source](https://github.com/asafmor/openui-desk/blob/main/client/src/openui/components/inputs/ShareButton.tsx)

!!! warning "Action slots are prompt-only"
    In `@openuidev/react-lang` 1.0.1 a restricted action slot shapes the prompt and the JSON Schema, but the runtime still accepts any action there. Don't rely on it for security. Enforce sensitive actions in the host handler instead (see [Custom actions & the host](custom-actions.md)).

The four normal surfaces (top, rail, canvas, dock) all share one library in the demo.

## Port it to your app

!!! note "Recipe — not in the demo"
    The steps below restrict a **normal** surface. The APIs are verified against `@openuidev/lang-core` 1.0.1 and `@openuidev/cli`, and the spec and validation steps were tested against this repo's library. The demo itself doesn't wire it into its surfaces.

1. **Derive the subset at module scope**, next to your main library:

    ```ts title="client/src/openui/surface-libraries.ts"
    import { library } from "./library";

    // Read-only strip: KPIs, badges, tables. No forms, charts, HTML or modals.
    export const topLibrary = library.extend({
      components: {
        remove: ["HtmlFrame", "Modal", "BarChart", "LineChart", "PieChart", "Series",
                 "Menu", "MenuItem", "ShareButton", "Form", "FormControl", "Input",
                 "Select", "SelectItem", "Checkbox"],
      },
    });
    ```

    `remove` also drops the names from every parent union and component group. It **throws** if a prop would be left with no type at all. For example, removing `Button` while keeping `Buttons`, whose children are buttons, throws. Remove the parent too, or override it.

2. **Render each surface with its library:**

    ```tsx
    const SURFACE_LIBRARIES = { top: topLibrary, rail: library, canvas: library, dock: library };
    <Renderer response={program} library={SURFACE_LIBRARIES[surfaceId]} /* … */ />
    ```

3. **Generate one spec per library.** The CLI picks a named export with `--export`:

    ```bash
    openui generate src/openui/surface-libraries.ts --spec --export topLibrary \
      --out ../shared/generated/top.spec.json
    ```

    The resulting spec lists only the kept components, and its groups shrink to match. `extend()` doesn't keep the library `id`, so record your own version tag if you store programs (see [Persist & resume](persistence.md)).

4. **Validate per surface on the server.** Build one parser per spec and choose by surface id wherever the agent's program arrives, for example in the `update_surface` tool:

    ```ts
    import { createParser, type LibrarySpec } from "@openuidev/lang-core";

    const SPECS: Record<SurfaceId, LibrarySpec> = { top: topSpec, rail: fullSpec, canvas: fullSpec, dock: fullSpec };
    const PARSERS = Object.fromEntries(
      Object.entries(SPECS).map(([id, s]) => [id, createParser(s.schema!, s.root)]),
    );

    // in update_surface: PARSERS[surfaceId].parse(merged).meta.errors
    ```

    A program that uses a removed component fails with an error the model can act on:

    ```text
    [unknown-component] p: Unknown component "PieChart" — not found in catalog or builtins.
    Available components: Stack, Card, TextContent, Badge, Kpi, Callout, Table, …
    ```

    Return it as `ok: false`, and the agent fixes the patch in the same turn (see [Fixing errors with the agent](self-correction.md)).

5. **Tell the agent which components each surface accepts.** One agent writes for every surface, so prompt it with the **full** library (the superset) and add a rule per restricted surface, generated from the spec so it never drifts:

    ```ts
    const allowed = Object.keys(topSpec.components).join(", ");
    additionalRules.push(`The "top" surface may only use: ${allowed}.`);
    ```

### Other ways to get a spec

| Option | When |
| --- | --- |
| CLI `--export <name>` (above) | The server can't import React code. This is the usual case. |
| `library.toSpec()` + `library.toJSONSchema()` at runtime | The server can import the library module (it compiles JSX/React). `toSpec()` has no `schema`; add `schema: library.toJSONSchema()` for `createParser`. |
| `library.prompt(options)` | One agent per library: get that library's whole prompt in one call. |

## Variations

- **One agent per surface, or a single surface.** Generate that surface's prompt from its own spec with `generateSystemPrompt({ library: topSpec, promptOptions })`. Then you don't need the per-surface rule in step 5.
- **You already have your own chat and history.** No change. Restriction lives in the library, the Renderer and the validator.
- **No shared client/server package.** Ship each `*.spec.json` from the client build to the server, the same way as the main spec. See [No shared client/server package](../porting/no-shared-package.md).
- **Client-only, no server validation.** Steps 1–2 alone already stop rendering. Removed components show as errors on that surface, so pair it with [runtime error reporting](self-correction.md).

## Pitfalls

!!! warning "The built-in prompt sections still show form components"
    With `toolCalls` or `bindings` on, `generateSystemPrompt` includes built-in sections whose examples use `Form`, `FormControl`, `Input` and `Select`, **even if your spec removed them**. In this repo, a spec without forms still produced a prompt with 6 `FormControl(` examples. Either keep those components, add a rule that forbids them, or rely on server validation to reject them.

- `extend()` can only **add** functions and actions (`functions.add`, `actions.add`). There is no `remove` for them. To restrict actions, enforce them in the host handler.
- Create derived libraries at module scope, never inside render. Parsers are memoized by library identity.
- Keep removed lists short and reviewed. A component you forget to remove is allowed.

## Related

- [Your own component library](component-library.md)
- [Prompt generation](prompt.md)
- [Fixing errors with the agent](self-correction.md)
- [Surface modeling](surfaces.md)
- [A2UI](a2ui.md)

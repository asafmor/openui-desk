# OpenUI advanced features tour

A tour of the OpenUI capabilities that go beyond "the model writes a component tree". Everything here runs in your own React app with your own agent; none of it needs OpenUI Cloud, Gateway or Autofix.

Versions checked: `@openuidev/lang-core` and `@openuidev/react-lang` **1.0.1**, `@openuidev/a2ui` **0.5.0**, `@openuidev/devtools` **0.3.0**, `@openuidev/cli` **0.6.0**. Each entry links to the concept page that shows it in the demo.

## 1. Reactive `$variables`

A `$name = default` statement declares state. Inputs bound to it write it; expressions and `Query` arguments that read it re-evaluate when it changes.

```text
$status = "open"
tickets = Query("list_tickets", {status: $status}, {rows: []})
filter = Select("status", [SelectItem("open", "Open"), SelectItem("all", "All")], null, null, $status)
```

Changing the select re-runs the Query with the new argument. **Used in the demo:** every filter, tab and modal. See [Agent drives live state](../concepts/agent-state.md).

## 2. Expressions and built-in functions

Programs compute: ternaries, comparisons, string concatenation, array pluck (`rows.title` gives a column), and built-ins. The installed built-ins are `@Abs @Avg @Ceil @Count @Each @Filter @First @Floor @Last @Max @Min @Round @Sort @Sum`.

```text
visible = $onlyBreached ? @Filter(tickets.rows, "breached", "==", true) : tickets.rows
sorted = @Sort(visible, "ageHours", "desc")
summary = TextContent(@Count(sorted) + " tickets · avg age " + @Avg(sorted.ageHours))
```

**Used in the demo:** the canvas Tickets tab, and the Agents tab that exists only while `stats.open > 15`. See [Data-shaped UI](../concepts/data-shaped-ui.md).

## 3. `Query` / `Mutation` and the `toolProvider`

`Query(tool, args, defaults, refreshSeconds?)` reads data and refetches when its arguments change or on an interval. `Mutation(tool, args)` writes, and runs only through `@Run`. Both call the Renderer's `toolProvider`, which is either a **function map** or an **MCP client** (anything with `callTool({name, arguments})`).

```tsx
<Renderer toolProvider={{ list_tickets: (args) => post("/ui-tools/list_tickets", args) }} … />
// or
<Renderer toolProvider={mcpClient} … />
```

**Used in the demo:** both providers, switchable in the header, plus browser-only tools (notes). See [UI-side tools](../concepts/ui-tools.md).

## 4. Action chains

`Action([...])` runs steps in order: `@Run(queryOrMutation)`, `@Set($x, v)`, `@Reset($a, $b)`, `@ToAssistant(msg, context)`, `@OpenUrl(url)`, plus your custom actions. A failed `@Run(mutation)` stops the chain.

```text
Button("Create", Action([@Run(createTicket), @Run(tickets), @Reset($newTitle), @Set($showCreate, false), @Notify("Ticket created", "success")]))
```

**Used in the demo:** create, edit, escalate, comment, notes. See [Custom actions & the host](../concepts/custom-actions.md).

## 5. Custom functions

`defineFunction({ name, description, params, returns, fn })` adds a pure helper callable as `@Name(...)` in any expression. `fn` runs in the browser; only the signature and description go to the model. The key order of `params` is the argument order.

```text
breached = Kpi("SLA breached", stats.breached, @Percent(stats.breached, stats.open) + " of active")
```

**Used in the demo:** `@Percent @Duration @Tone @PriorityTone @ShortTime`. See [Custom functions](../concepts/custom-functions.md).

## 6. Custom actions and restricted action slots

`defineAction({ name, description, params })` adds an `@Name(...)` step. The Renderer does not run it: it sends `{ type: "Name", params }` to `<Renderer onAction>`, typed per action. A prop typed `z.union([myAction.ref, steps.OpenUrl.ref])` shows the model a narrower set of allowed actions.

```text
Button("Copy id", @CopyToClipboard($ticketId), "ghost")
ShareButton("OpenUI docs", @OpenUrl("https://www.openui.com/docs"))
```

!!! warning "Restricted slots shape the prompt only"
    In 1.0.1 the narrowed union changes the prompt signature (`share: @CopyToClipboard | @OpenUrl`), but any action is still accepted at runtime. Do not rely on it for security; validate in the host.

**Used in the demo:** `@Broadcast @CopyToClipboard @Notify @ToggleTheme`, `ShareButton`. See [Custom actions & the host](../concepts/custom-actions.md).

## 7. Forms and validation

`Form(name, buttons, fields)` groups inputs; each input takes rules such as `{required: true, minLength: 3}`. Built-in rules: `required email url numeric min max minLength maxLength pattern`. A button in the form validates before running its action.

```text
Form("create", Buttons([Button("Create", Action([@Run(createTicket)]))]), [FormControl("Title", Input("newTitle", "What is broken?", "text", {required: true, minLength: 3}, $newTitle))])
```

Components read rules with `useFormValidation` / `useCreateFormValidation` and `parseStructuredRules`. **Used in the demo:** create, edit, comment, notes. See [Your own component library](../concepts/component-library.md).

## 8. Incremental editing (edit mode)

With `promptOptions.editMode: true`, the model answers with **only the changed or new statements**. `mergeStatements(existing, patch)` merges them by name; `name = null` deletes a statement.

```ts
import { mergeStatements } from "@openuidev/lang-core";
const next = mergeStatements(current, 'pie = PieChart(stats.byPriority.priority, stats.byPriority.count)\nrow = Stack([bar, pie], "row")');
```

**Used in the demo:** the `update_surface` tool, merged identically on server and client. See [Agent edits surfaces](../concepts/agent-edits.md).

## 9. Inline mode

With `promptOptions.inlineMode: true`, a reply is prose, optionally with fenced `openui-lang` blocks. The host splits the text and renders each block with a Renderer.

**Used in the demo:** small throw-away answers in chat. See [Inline UI in chat](../concepts/inline-ui.md).

## 10. Bindable custom components: `reactive()` + `useStateField`

Mark a prop `reactive(schema)` and it accepts a `$variable`. Inside the component, `useStateField(name, props.value)` returns `{ value, setValue }`, writing the bound variable or local field state.

```tsx
props: z.object({ items: z.array(TabItem.ref), value: reactive(z.string().optional()) }),
component: ({ props }) => { const field = useStateField("tabs", props.value); … }
```

**Used in the demo:** `Tabs`, `Modal`, every input. See [Your own component library](../concepts/component-library.md).

## 11. Streaming-aware components

`useIsStreaming()` tells a component its program is still arriving; `useIsQueryLoading()` tells it a Query is in flight. Use them to show source or skeletons instead of half-built output.

**Used in the demo:** `HtmlFrame` shows the HTML source while streaming; `Kpi` dims while loading. See [Your own component library](../concepts/component-library.md).

## 12. Library composition

`createLibrary({ components, componentGroups, functions, actions, root })` builds a library; `componentGroups` add usage notes to the prompt. `library.extend({ components: { add, override, remove }, actions: { add } })` derives another library: `add` with `slots: ["Card.children"]` joins parent unions, `remove` drops names everywhere.

```ts
const incidentLibrary = library.extend({
  components: { add: [{ component: IncidentClock, slots: ["Card.children"] }], override: [PulseBadge], remove: ["HtmlFrame", "Modal"] },
  actions: { add: [acknowledge, resolve, restart] },
});
```

**Used in the demo:** the A2UI incident library. See [Restricting components per surface](../concepts/restricted-components.md).

## 13. Structured errors and self-correction

`createParser(schema, root).parse(program)` returns `meta.errors`, `unresolved`, `orphaned` and `incomplete`. The Renderer reports runtime problems through `onError` as `OpenUIError` objects with a code and a hint. Send them back to the model and it can fix its own program.

**Used in the demo:** server-side validation inside `update_surface` (same-turn retry) and client render errors sent with the next request. See [Fixing errors with the agent](../concepts/self-correction.md).

## 14. Renderer slots

Instead of the default view, compose `Renderer.Root` (runtime), `Renderer.Content` (the UI), `Renderer.QueryLoading`, `Renderer.QueryError` and `Renderer.Retry`, or read `useRendererQuery()`. The UI stays mounted while a query error banner is shown.

```tsx
<Renderer.Root response={program} library={library} toolProvider={tp}>
  <Renderer.Content />
  <Renderer.QueryError>Data failed. <Renderer.Retry>Retry</Renderer.Retry></Renderer.QueryError>
</Renderer.Root>
```

**Used in the demo:** every surface. See [Fixing errors with the agent](../concepts/self-correction.md).

## 15. `initialState` / `onStateUpdate` and the stored-message format

`onStateUpdate` gives a snapshot of `$variables` and form fields; `initialState` restores it. Changed `initialState` values are re-applied live, without a remount. `buildMessage` / `parseMessage` read and write OpenUI's stored-message format:

```text
]]>openui:content?library=support-desk%401&surface=canvas
root = Stack([tabs])
]]>openui:context
{"$tab":"tickets","$status":"open"}
]]>openui:end
```

**Used in the demo:** workspace persistence and action turns in chat. See [Persist & resume](../concepts/persistence.md) and [Clicks that talk to the agent](../concepts/action-turns.md).

## 16. `vercelAIAdapter` and the Mastra bridge

OpenUI's chat packages (`@openuidev/react-headless`, `@openuidev/react-ui`) read an AI SDK UI message stream through `vercelAIAdapter()` and `vercelAIMessageFormat`. Mastra's `chatRoute` from `@mastra/ai-sdk` produces that stream from an agent.

**Not used in the demo:** the chat is built on `useChat` from `@ai-sdk/react`, which reads tool parts straight from `UIMessage.parts`, so the adapter is not needed. The Mastra side is used: `chatRoute({ path: "/chat", agent, version: "v7" })`. See [Live UI context for the agent](../concepts/workspace-context.md) and [the decision guide](../guides/decisions.md#chat-hand-built-usechat-or-openuis-agent-interface).

## 17. Artifacts

An artifact is "a tool result plus a renderer the app supplies". OpenUI's Agent Interface offers `defineArtifactRenderer`, a preview slot, a side panel and an artifact browser backed by a `ChatStorage.artifact` you implement. The pattern itself is not tied to Agent Interface.

**Used in the demo:** built by hand: a `publish_artifact` tool, a chat card, a side panel with versions, stored in the workspace. See [Artifacts](../concepts/artifacts.md).

## 18. A2UI

`@openuidev/a2ui` renders server-driven surfaces: the server streams envelopes (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`), the client feeds them to `createA2UIClient(...).process(envelope)`, and `A2UIRenderer` draws them. Clicks go back as action envelopes.

**Used in the demo:** an isolated "live incident" tab fed over SSE. See [A2UI](../concepts/a2ui.md).

## 19. Observability and DevTools

Every Renderer publishes stream snapshots, parse errors, runtime errors and query events on the `@openuidev/observability` bus (`publishObservability` defaults to true). `<OpenUIDevtools />` from `@openuidev/devtools` shows them in the page; your app can publish its own events with `observability.info(...)` and listen with `listenAll`.

**Used in the demo:** the DevTools button (bottom-right, dev only) and the dock's Event log. See [Runtime diagnostics](../concepts/diagnostics.md).

## Prompt generation (ties it together)

`generateSystemPrompt({ library, promptOptions })` writes the prompt from the library spec: components, groups, functions, actions, tools (`tools`, `toolExamples`), `$bindings`, edit mode and inline mode.

!!! warning "Use the full prompt"
    `generateSystemPrompt({ …, cloud: true })` is meant for OpenUI Gateway and drops tools, bindings, edit mode and inline mode. A self-hosted agent that needs `Query`, `$state` or patches must use the full prompt.

See [Prompt generation](../concepts/prompt.md).

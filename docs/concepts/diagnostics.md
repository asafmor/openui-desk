# Runtime diagnostics

!!! abstract "In one line"
    Make generated UI inspectable: what program is on screen, what state it holds, what the parser and queries reported, what the agent did, and what prompt it saw.

**Adopt alone?** Yes; each tool below can be added on its own · **Effort** S · **Touches** client (+ server for Studio/prompt)

## The problem

With generated UI, "it looks wrong" can mean many things: the model wrote a bad program, a patch was merged badly, a `$variable` holds an unexpected value, a Query failed, or the prompt never told the model about a component. You need to see each layer without adding `console.log` everywhere.

## How the demo does it

| Tool | Shows | Where |
|---|---|---|
| OpenUI DevTools widget | Each Renderer's streaming / settled snapshots, parse and runtime errors, plus app events | Floating button, bottom-right (dev only) |
| Event log tab | Every event on the observability bus, as a list | Dock → "Event log" |
| `</>` source view | The exact program and state that will be saved | Each surface header |
| Version + ↶ undo | Which agent patch produced this version | Each surface header |
| Tool cards in chat | Every agent tool call: input, output, patches, rejected attempts | Chat transcript |
| Mastra Studio | Agent runs, steps, tool calls, traces | `http://localhost:4111` |
| `pnpm prompt` | The full system prompt the agent receives | Terminal |

### The observability bus

`@openuidev/observability` is a small shared event bus. Every `<Renderer>` publishes to it by default (`publishObservability` defaults to `true`). The DevTools widget reads the same bus.

The demo adds its own events with a `desk:` prefix, so they appear next to OpenUI's ([`client/src/debug/app-events.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/debug/app-events.ts)):

```ts
import { observability } from "@openuidev/observability";

export const appEvent = (kind: string, message: string, extra: Record<string, unknown> = {}) =>
  observability.info({ kind: `desk:${kind}`, message, ...extra });
```

For example, every `@Broadcast` logs `desk:broadcast — $priority = "urgent" → all surfaces` ([`client/src/App.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/App.tsx)).

The event log subscribes to everything with `listenAll`, which is also where you would forward events to Sentry or Datadog ([`client/src/debug/EventLog.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/debug/EventLog.tsx)):

```ts
useEffect(
  () =>
    observability.listenAll((event) => {
      const detail = event.detail as { kind?: string; message?: string };
      const row = { at: new Date().toLocaleTimeString(), level: event.level, text: `${detail.kind ?? "event"} — ${detail.message ?? ""}` };
      setRows((prev) => [row, ...prev].slice(0, 80));
    }),
  [],
);
```

`listenAll` returns an unsubscribe function, so returning it from the effect cleans up.

### The DevTools widget

The demo mounts it explicitly and only in development ([`client/src/main.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/main.tsx)):

```tsx
{import.meta.env.DEV ? <OpenUIDevtools position="bottom-right" maxEvents={200} /> : null}
```

react-lang also tries to auto-mount it when `process.env.NODE_ENV === "development"`. Mounting it yourself makes it visible in the code and lets you set props; a manually mounted instance wins over the auto-mount.

### The surface frame

Each surface header ([`client/src/surfaces/SurfaceFrame.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/surfaces/SurfaceFrame.tsx)) shows:

- **`v N`**: the number of versions; hovering shows the last agent summary.
- **↶**: undo the last agent patch (history is kept in the workspace).
- **`</>`**: the program and the full saved state as JSON. Watching it while you click is the fastest way to learn how `$variables` and form fields are stored.
- **⚠ N · ask agent to fix**: render errors, from [Fixing errors with the agent](self-correction.md).

### Agent-side views

- **Tool cards** ([`client/src/chat/ToolCallView.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/chat/ToolCallView.tsx)) show each tool call with its input and output, including the patch text and the errors of a rejected attempt.
- **Mastra Studio** (served by `mastra dev` on port 4111) shows each agent run, its steps and traces.
- **`pnpm prompt`** ([`scripts/print-prompt.ts`](https://github.com/asafmor/openui-desk/blob/main/scripts/print-prompt.ts)) prints the generated system prompt plus a sample workspace section. Read it once; most "the model doesn't know X" problems are visible there.

## Port it to your app

Pick what you need; each step is independent.

1. **DevTools:** `pnpm add -D @openuidev/devtools`, then render `<OpenUIDevtools />` behind your dev flag.
2. **Your own events:** call `observability.info({ kind: "app:…", message })` where your host does something interesting (workspace loaded, patch applied, action handled).
3. **Production monitoring:** subscribe with `observability.listenAll(...)` once at startup and forward `warn`/`error` events to your error tracker.
4. **Source view:** show the program text and the state you store for each surface, behind a toggle.
5. **Prompt dump:** add a script that calls the same function your server uses to build the prompt and prints it.

## What to expose where

| | Development | Production |
|---|---|---|
| DevTools widget | Yes | No (it is a dev tool and may show OpenUI Cloud prompts) |
| Observability bus → error tracker | Optional | Yes, for `error` and `warn` |
| Source view (`</>`) | Yes | Maybe, for power users or support staff; it reveals model-written code |
| Tool cards | Full input/output | Summaries; hide raw outputs that may contain data the user shouldn't see |
| Agent traces | Mastra Studio | Your tracing backend |

## Variations

- **You already have your own chat/history.** Tool cards depend on your chat UI; render tool parts the way your UI allows. The rest is unchanged.
- **No shared package.** Unchanged; all of this is client-side or server-side alone.
- **Several Renderers.** All of them publish to the same bus; include a surface id in your own events so you can tell them apart.

## Pitfalls

!!! warning "DevTools Cloud nudge"
    The widget is loaded from a CDN and sometimes shows a "Ready to share your app? … deploy" OpenUI Cloud prompt. There is no prop to turn it off; close it.

- **Don't log full state on every event in production.** State can hold form input and personal data.
- **Disable publishing where you don't want it:** `<Renderer publishObservability={false}>` for Renderers that shouldn't report (for example, previews).

## Related

- [Fixing errors with the agent](self-correction.md)
- [Prompt generation](prompt.md)
- [Gotchas & version notes](../reference/gotchas.md)

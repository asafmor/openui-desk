# Gotchas & version notes

Everything that surprised us while building the demo, in the format **symptom → cause → fix → where**. Most of these will bite any Mastra + OpenUI app, not only this one.

## Versions this was written against

| Package | Version |
| --- | --- |
| `@openuidev/lang-core`, `@openuidev/react-lang` | 1.0.1 |
| `@openuidev/a2ui` | 0.5.0 |
| `@openuidev/devtools` / `@openuidev/observability` / `@openuidev/cli` | 0.3.0 / 0.0.4 / 0.6.0 |
| `@mastra/core` / `mastra` (CLI) | 1.79.0 / 1.35.0 |
| `@mastra/ai-sdk` / `@mastra/mcp` | 1.11.2 / 2.5.0 |
| `ai` / `@ai-sdk/react` | 7.0.148 / 4.0.152 |
| `@modelcontextprotocol/client` | 2.2.0 |
| React / Vite / Zod | 19.3.1 / 8.3.5 / 4.6.7 |

Check the lockfile in your own app before trusting a note: several of these depend on exact versions.

## OpenUI

### The model never writes `Query`, `$state` or patches

- **Symptom:** the agent only produces static component trees, ignores edit mode, never binds inputs.
- **Cause:** `generateSystemPrompt({ library, promptOptions, cloud: true })` builds the prompt for OpenUI Gateway. It drops `tools`, `toolCalls`, `bindings`, `editMode` and `inlineMode`.
- **Fix:** call `generateSystemPrompt({ library: spec, promptOptions })` without `cloud`. Print the result once and read it (`pnpm prompt` in the demo).
- **Where:** [`shared/src/prompt/prompt-options.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/prompt/prompt-options.ts), [`server/src/mastra/prompt/system-prompt.ts`](https://github.com/asafmor/openui-desk/blob/main/server/src/mastra/prompt/system-prompt.ts).

### Built-in prompt sections use reference component names

- **Symptom:** the model writes `Form(...)`, `Input(...)` or `TextContent(...)` even though your library calls them something else, and the parser rejects them.
- **Cause:** the generated prompt's built-in sections (forms, bindings, tool examples) show examples with the reference library's names: `Form`, `FormControl`, `Input`, `Select`, `SelectItem`, `Button`, `TextContent`, `Stack`.
- **Fix:** keep those names and their argument order in your own library, or add your own `toolExamples` and rules that use your names.
- **Where:** [`client/src/openui/components/`](https://github.com/asafmor/openui-desk/tree/main/client/src/openui/components).

### Restricted action slots are not enforced

- **Symptom:** a `ShareButton` typed to accept only `@CopyToClipboard | @OpenUrl` still runs `@Broadcast(...)` if a program passes it.
- **Cause:** `z.union([copyToClipboard.ref, steps.OpenUrl.ref])` only narrows the signature printed in the prompt. The 1.0.1 runtime accepts any action.
- **Fix:** treat it as guidance for the model. Enforce limits in the host's `onAction` handlers.
- **Where:** [`client/src/openui/components/inputs/ShareButton.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/openui/components/inputs/ShareButton.tsx).

### Patching a `$variable` default does not change the live value

- **Symptom:** the agent patches `$status = "pending"`, the patch applies, but the table still shows "open".
- **Cause:** lang-core's `store.initialize(defaults, persisted)` lets persisted values win. A default only applies to a key that was never persisted, and `onStateUpdate` persists every key.
- **Fix:** change live state through the saved state (`initialState`), not the program. The demo's `set_surface_state` tool does that.
- **Where:** [`server/src/mastra/tools/set-surface-state.ts`](https://github.com/asafmor/openui-desk/blob/main/server/src/mastra/tools/set-surface-state.ts). See [Agent drives live state](../concepts/agent-state.md).

### Changing `initialState` updates a mounted Renderer

- **Symptom (useful):** writing a new value into the state you pass as `initialState` changes the UI without a remount.
- **Cause:** react-lang calls `store.initialize` again when `initialState` changes; values that differ overwrite the store. Identical values are ignored by `store.set`.
- **Use:** this is how `@Broadcast` and `set_surface_state` reach a live surface.
- **Where:** [`client/src/workspace/workspace-reducer.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/workspace-reducer.ts) (`writeState`).

### lang-core's postinstall script

- **Symptom:** pnpm warns that `@openuidev/lang-core` wants to run a build script.
- **Cause:** its postinstall only sends install telemetry.
- **Fix:** leave it blocked. In `pnpm-workspace.yaml`: `allowBuilds: { esbuild: true, "@openuidev/lang-core": false }`. Run the CLI with `--no-telemetry`.
- **Where:** [`pnpm-workspace.yaml`](https://github.com/asafmor/openui-desk/blob/main/pnpm-workspace.yaml), the `generate` script in [`package.json`](https://github.com/asafmor/openui-desk/blob/main/package.json).

### The DevTools widget shows a "deploy" nudge

- **Symptom:** "Ready to share your app? … deploy" appears inside the DevTools panel.
- **Cause:** the widget is loaded from a CDN and includes an OpenUI Cloud prompt; `OpenUIDevtools` has no prop to turn it off.
- **Fix:** close it. Mount DevTools explicitly and only in development (`import.meta.env.DEV`).
- **Where:** [`client/src/main.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/main.tsx).

## Mastra

### Per-request data never reaches the agent

- **Symptom:** extra fields in the chat request body (for example `surfaces`) are not visible to tools or `instructions`.
- **Cause:** `chatRoute` only turns `body.requestContext` into the `RequestContext`. Other top-level keys are ignored.
- **Fix:** send `{ messages, requestContext: { surfaces } }` and read `requestContext.get("surfaces")`.
- **Where:** [`client/src/chat/chat-transport.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/chat/chat-transport.ts), [`server/src/mastra/request-context.ts`](https://github.com/asafmor/openui-desk/blob/main/server/src/mastra/request-context.ts).

### `chatRoute` speaks AI SDK v5 by default

- **Symptom:** an AI SDK 7 client mis-parses the stream.
- **Cause:** `chatRoute` defaults to `version: "v5"`.
- **Fix:** `chatRoute({ path: "/chat", agent: "desk-agent", version: "v7" })`.
- **Where:** [`server/src/mastra/index.ts`](https://github.com/asafmor/openui-desk/blob/main/server/src/mastra/index.ts).

### MCP client rejected by Mastra

- **Symptom:** the browser MCP client fails to connect to `/api/mcp/<id>/mcp`, or requests fail CORS.
- **Cause:** `@mastra/mcp` 2.5.0 serves MCP protocol `2026-07-28` only, while `@modelcontextprotocol/client` 2.2.0 negotiates an older default. The browser also needs MCP headers allowed by CORS.
- **Fix:** pin the version on the client, and allow the headers on the server:

    ```ts
    new Client({ name: "openui-desk-browser", version: "1.0.0" }, { versionNegotiation: { mode: { pin: "2026-07-28" } } });
    ```

    ```ts
    server: { cors: { allowHeaders: ["mcp-protocol-version", "mcp-method", "mcp-name", "mcp-session-id"], exposeHeaders: ["mcp-session-id"] } }
    ```

- **Where:** [`client/src/openui/tool-provider/mcp-tools.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/openui/tool-provider/mcp-tools.ts), [`server/src/mastra/index.ts`](https://github.com/asafmor/openui-desk/blob/main/server/src/mastra/index.ts).

### Custom routes have no `/api` prefix

- **Symptom:** `registerApiRoute("/ui-tools/:name", …)` is not found at `/api/ui-tools/...`.
- **Cause:** custom API routes mount at the path you give. Built-in routes (agents, MCP) live under `/api`.
- **Fix:** call `/ui-tools/:name`, `/chat`, `/a2ui/stream` without the prefix.

### `mastra dev` runs once per directory

- **Symptom:** "Another development server instance is already running in this directory". Also seen: the watcher alive but nothing listening on port 4111 after a hot reload.
- **Cause:** `mastra dev` keeps a PID lock per project; a crashed child server leaves the watcher holding it.
- **Fix:** stop the old process (the message prints its PID), then start again.

### Strict tool schemas and open-ended objects

- **Symptom (avoided):** tool inputs shaped as `z.record(...)` can be rejected by providers that require strict JSON Schemas for tool parameters, which disallow open-ended objects.
- **Fix used:** `set_surface_state` takes `changes: [{ key, value }]` instead of `values: Record<string, …>`. This was a precaution; we did not reproduce the failure.
- **Where:** [`server/src/mastra/tools/set-surface-state.ts`](https://github.com/asafmor/openui-desk/blob/main/server/src/mastra/tools/set-surface-state.ts).

## A2UI

### `client.subscribe` loses `this`

- **Symptom:** a crash mentioning `#surfaceListeners` when the panel mounts.
- **Cause:** `useSyncExternalStore(client.subscribe, …)` passes an unbound class method.
- **Fix:** wrap it: `useSyncExternalStore((onChange) => client.subscribe(onChange), …)`. Put each panel in an error boundary so one crash does not blank the app.
- **Where:** [`client/src/a2ui/IncidentPanel.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/a2ui/IncidentPanel.tsx), [`client/src/layout/PanelBoundary.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/layout/PanelBoundary.tsx).

## React & browser

### `useEffect(() => el.scrollIntoView())` blanks the page

- **Symptom:** blank page, "destroy is not a function".
- **Cause:** newer Chromium returns a Promise from `scrollIntoView()`. An arrow with an expression body returns it, and React treats the return value as a cleanup function.
- **Fix:** use a block body: `useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages]);`
- **Where:** [`client/src/chat/ChatPanel.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/chat/ChatPanel.tsx).

## Tooling

### pnpm does not run the `predev` hook

- **Symptom:** `pnpm dev` starts without regenerating the spec.
- **Cause:** pnpm did not run the `predev` lifecycle script in this setup.
- **Fix:** chain it explicitly: `"dev": "pnpm generate && pnpm check && pnpm --parallel … dev"`.
- **Where:** [`package.json`](https://github.com/asafmor/openui-desk/blob/main/package.json).

### Workspace package imports need `.ts` in the exports map

- **Symptom:** `@demo/shared/surfaces` cannot be resolved.
- **Cause:** the package exports TypeScript sources without a build step; the pattern must include the extension.
- **Fix:** `"exports": { "./*": "./src/*.ts" }`.
- **Where:** [`shared/package.json`](https://github.com/asafmor/openui-desk/blob/main/shared/package.json).

### `pass` fails in non-interactive shells

- **Symptom:** `OPENAI_API_KEY="$(pass agents/openai-api-key)" pnpm dev` fails to decrypt from a script or agent shell.
- **Cause:** gpg needs pinentry to ask for the passphrase, and there is no terminal.
- **Fix:** decrypt once in a real terminal (`pass agents/openai-api-key > /dev/null`) so gpg-agent caches the passphrase, then retry.

### Deterministic seed with a constant status

- **Symptom:** every seeded ticket was "open".
- **Cause:** `STATUSES[(i * 5) % 5]` is always index 0.
- **Fix:** `STATUSES[(i * 3) % STATUSES.length]`. With 36 tickets this yields exactly 15 open tickets, which the [data-shaped Agents tab](../concepts/data-shaped-ui.md) uses as its threshold.
- **Where:** [`server/src/db/seed.ts`](https://github.com/asafmor/openui-desk/blob/main/server/src/db/seed.ts).

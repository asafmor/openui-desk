# Decision log

Why the demo looks the way it does. Each entry is a short ADR: **context → options → decision → consequences**. Read it when you want to make a different choice in your app and need to know what you would trade.

!!! note "Scope"
    These decisions were made for a learning demo. Several would change in production; the consequences say where.

## Platform and structure

### 1. Stack: Vite + React client, Mastra server

- **Context:** the goal is to learn OpenUI in a self-hosted React app with a Mastra agent over the AI SDK message protocol. No OpenUI Cloud.
- **Options:** Next.js app with an API route; Vite client + Mastra server; Mastra embedded in another server.
- **Decision:** Vite + React 19 client, `mastra dev` server on port 4111.
- **Consequences:** client and server are separate processes, like most real apps. Mastra Studio comes for free for inspecting agents and traces. CORS must be configured for the browser's MCP client.

### 2. pnpm workspace with a `shared` package

- **Context:** the server needs the same tool contracts, prompt options and program validator as the client.
- **Options:** duplicate code; publish a package; workspace package with TypeScript sources.
- **Decision:** pnpm workspace with `shared/`, `server/`, `client/`; `shared` exports `.ts` sources directly.
- **Consequences:** one source of truth for contracts (Zod), prompt and validation. Apps without a shared package need another way to ship the spec and contracts; see [No shared client/server package](../porting/no-shared-package.md).

### 3. Support-tickets domain

- **Context:** the demo needs data that suits dashboards, tables, forms and writes.
- **Options:** e-commerce orders, CRM, support/ops tickets.
- **Decision:** support desk with tickets, agents, activity and live system health, in an in-memory store with a deterministic seed.
- **Consequences:** every OpenUI feature has a natural use (filters, SLA badges, escalations, refreshing KPIs). Data resets on server restart.

### 4. Plain CSS and hand-drawn SVG charts

- **Context:** the user wanted their own component set, without pre-made UI libraries.
- **Decision:** one stylesheet with tokens; charts drawn as SVG in React components.
- **Consequences:** every component is readable in one file. Charts are basic. Theming is a matter of swapping CSS variables.

## Chat and agent

### 5. Hand-built chat on AI SDK `useChat`

- **Context:** most apps that port these ideas already have a chat. The demo should show what is needed from a chat, not depend on a specific chat UI.
- **Options:** OpenUI `AgentInterface` + `vercelAIAdapter`; `useChat` with own components.
- **Decision:** `useChat` with a custom transport; tool parts are read from `UIMessage.parts`.
- **Consequences:** `vercelAIAdapter`, `useToolActivities` and `AgentInterface` are not demonstrated. Artifacts, inline UI and action turns are built by hand, which shows how they work.

### 6. Full system prompt, not the cloud variant

- **Context:** the agent must write `Query`, `$state` and edit-mode patches.
- **Decision:** `generateSystemPrompt({ library: spec, promptOptions })` with tools, bindings, edit mode and inline mode, plus app rules.
- **Consequences:** a longer prompt that teaches every feature. The `cloud: true` variant would silently drop these. See [Gotchas](gotchas.md#the-model-never-writes-query-state-or-patches).

### 7. No Mastra memory: the browser owns the conversation

- **Context:** the workspace must be exportable as one file, chat included.
- **Decision:** the client sends the full history and the live surfaces with every request; the agent has no memory configured.
- **Consequences:** export/import moves everything. Long chats grow the request. Apps with Mastra memory keep history on the server; see [You already have chat & history](../porting/own-chat.md).

## Surfaces and persistence

### 8. Four fixed surfaces, one tool call per surface

- **Context:** the goal is a chat surrounded by long-lived interfaces in several extension points.
- **Options:** one surface; fixed slots; on-demand surfaces. One program for the screen or one per slot.
- **Decision:** four slots (top strip, left rail, main canvas, bottom dock). The agent targets one with `update_surface({surfaceId, patch, summary})`.
- **Consequences:** errors stay in one surface; `$state` is per surface, so cross-surface control needed `@Broadcast`. See [Surface modeling](../concepts/surfaces.md).

### 9. JSON workspace in localStorage, plus file export/import

- **Context:** users must close the app and continue from the same spot, and switch between workspaces.
- **Options:** localStorage; IndexedDB; server storage.
- **Decision:** autosave the whole workspace to localStorage (debounced), export/import the same JSON. Surfaces are written with OpenUI's `buildMessage` format.
- **Consequences:** no server work, works offline, about 5 MB limit, one device unless exported. See [Persist & resume](../concepts/persistence.md).

### 10. A2UI as one isolated surface

- **Context:** A2UI is a different model (server-driven envelopes), worth showing but not mixing with agent-written programs.
- **Decision:** a separate dock tab fed over SSE, with its own extended library.
- **Consequences:** the two models can be compared side by side. A2UI state is not part of the workspace.

### 11. Artifacts as tool results stored in the workspace

- **Context:** neither Mastra nor OpenUI's core packages have an artifact primitive; OpenUI's artifact support lives in Agent Interface, which the demo does not use.
- **Options:** server artifact store; Mastra memory; workspace array.
- **Decision:** `publish_artifact` validates and returns `{id, title, program}`; the browser stores versions in `workspace.artifacts`.
- **Consequences:** artifacts travel with exports. They are reachable only through their chat card; there is no artifact browser. See [Artifacts](../concepts/artifacts.md).

## Host concerns

### 12. Theme toggle as a custom action

- **Context:** a Feature-tour button should switch light/dark.
- **Options:** a `$theme` variable in a program; a host custom action.
- **Decision:** `@ToggleTheme()` handled by the host, which flips `<html data-theme>` and stores the choice in its own localStorage key.
- **Consequences:** the theme lives outside every Renderer, as it should. It is per browser and not exported with workspaces. The button cannot show the current theme without extra state.

### 13. Typed preferences instead of `SetLocalStorage(key, value)`

- **Context:** should one generic action cover all future settings?
- **Options:** raw `SetLocalStorage`; typed `SetPreference` with an allow-list registry; one action per setting.
- **Decision:** keep `ToggleTheme` while there is one setting. Move to `SetPreference(key, value)` with a registry of `{ schema, apply }` per key when a second one appears. Never a raw storage action.
- **Consequences:** a raw action would let any program (including one shaped by injected text) overwrite the workspace autosave, fill the quota, or set keys other code trusts; the model would also guess key names with nothing to catch mistakes. See [Host-owned preferences](../concepts/preferences.md).

### 14. Agents tab shaped by server data

- **Context:** show that containers can appear and disappear based on live data.
- **Decision:** `Tabs([overviewTab, ticketsTab, stats.open > 15 ? agentsTab : null, labTab], $tab)`; `Tabs` drops null items; Create and Save re-run `stats`.
- **Consequences:** no new component or API needed. The tab updates when `stats` refetches, so mutations re-run it explicitly. See [Data-shaped UI](../concepts/data-shaped-ui.md).

## Agent control of the UI

### 15. `set_surface_state`: how the agent changes live state

- **Context:** a program patch cannot move a live filter, because saved state wins over defaults.
- **Options and choices:**
    - **Where it runs:** server tool whose result the browser applies (chosen) vs an AI SDK client-side tool. Chosen for consistency with `update_surface` and safe replay.
    - **Target:** one surface or `"all"` (chosen; `"all"` behaves like `@Broadcast`) vs one surface only.
    - **Validation:** reject `$variables` the program does not declare, and wrong types, using the parser's `stateDeclarations` (chosen) vs none.
    - **Feedback:** a tool card in the chat (chosen) vs card + undo.
- **Consequences:** the agent can filter, switch tabs, select and open modals in one turn; mistakes come back as `ok:false` with a hint. See [Agent drives live state](../concepts/agent-state.md).

### 16. Proposals instead of agent "clicks"

- **Context:** can the agent press a button?
- **Options:** a `Query` with side effects triggered by `$state` (rejected: Queries re-run on mount, reload, refresh and retry, repeating the side effect); a `press_button` tool via a component registry (possible, but needs labels, row ids, an approval step and adds injection risk); a proposal card: the agent sets `$proposal`, the user clicks "Do it" (chosen).
- **Consequences:** writes stay under user control and need no new code; the agent builds the card with `update_surface` and fills it with `set_surface_state`. A prompt rule would make it the default answer to write requests. See [Proposals](../concepts/proposals.md).

## Code structure

### 17. Host actions: typed registry, one handler per file

- **Context:** `handle-action.ts` was a `switch` that grows with every custom action.
- **Options:**
    1. Typed handler registry derived from the library's actions (chosen).
    2. Handler next to each `defineAction` (rejected: `library.ts` is also loaded by the OpenUI CLI to generate the spec, so browser code would leak into prompt generation, and every host would share one behavior).
    3. Event bus with subscriptions (rejected: invisible wiring, no exhaustiveness).
- **Consequences:** a declared action without a handler, or a handler reading a wrong param, is a compile error. See [Custom actions & the host](../concepts/custom-actions.md).

### 18. Tool results: applier registry + one idempotency envelope

- **Context:** `apply-tool-results.ts` had one loop per tool; the reducer repeated the "already applied?" check three times.
- **Options:**
    1. Registry of pure appliers (output → workspace actions) + a `toolCall` reducer envelope that applies once per `toolCallId` (chosen).
    2. One module per tool holding parser, applier, chat card and preview (bigger move, mixes display with state).
    3. Raw tool results into the reducer with per-tool sub-reducers (couples the workspace to the chat protocol).
- **Consequences:** new tools need one file and one registry line; appliers are testable without React; `scripts/check-tool-results.ts` covers the pipeline. See [Applying tool results](../concepts/tool-results.md).

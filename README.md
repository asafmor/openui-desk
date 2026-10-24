# OpenUI Desk: a learning demo of long-lived generative interfaces

A chat surrounded by four **surfaces** (top strip, left rail, main canvas, bottom dock). Each surface is an OpenUI Lang program that keeps running between turns. The agent evolves them with edit-mode patches. You use them directly: filter, edit, run mutations. The whole workspace (programs, UI state, chat, artifacts, notes) is autosaved and can be exported to a JSON file and imported again to continue from the same point.

- Self-hosted: Vite + React client, Mastra agent server, AI SDK v7 UIMessage protocol. No OpenUI Cloud, Gateway or Autofix.
- Every component is written for this demo, in `client/src/openui/components`. `@openuidev/react-ui` is not used.

**📖 Docs site: https://asafmor.github.io/openui-desk/** explains every concept and how to port it to your own Mastra + OpenUI app, one concept at a time.

## Run it

```bash
pnpm install
pass insert agents/openai-api-key      # once; the value never touches a file
pnpm dev:pass                          # generate spec → check programs → server :4111 + client :5173
```

- **Without `pass`:** `OPENAI_API_KEY=... pnpm dev`.
- **gpg won't decrypt:** if `pass` fails in a non-interactive shell, run `pass agents/openai-api-key > /dev/null` once in a terminal to cache the passphrase.
- **Model:** defaults to `openai/gpt-6.1-sol`; override with `DESK_MODEL=openai/<id>`.
- **Without a key:** the "Feature tour" template is fully interactive. Only the chat needs the model.

| URL | What |
| --- | --- |
| http://localhost:5173 | the app (OpenUI DevTools button, bottom-right) |
| http://localhost:4111 | Mastra Studio (inspect the agent, its tools and traces) |

| Script | What |
| --- | --- |
| `pnpm generate` | OpenUI CLI: component library → `shared/generated/library.spec.json` (the server prompts with it) |
| `pnpm check` | parses every hand-written program (prompt examples + templates) against the spec; checks the tool-result pipeline applies each call once |
| `pnpm prompt` | prints the exact system prompt the agent receives. **Read it once.** |
| `pnpm typecheck` | `tsc` for shared, client and server |

## Architecture

```
┌──────────── browser (client/) ─────────────────────────────────────────────┐
│ useChat (AI SDK) ──POST /chat {messages, requestContext:{surfaces}}──────┐ │
│      ▲ UIMessage stream (text parts + tool parts, streamed tool input)   │ │
│      │                                                                   │ │
│ update_surface tool result ─► applyPatch (mergeStatements) ─► workspace  │ │
│                                                                   │      │ │
│ <Renderer response=program initialState=state toolProvider onAction>     │ │
│      │ Query()/Mutation() ──POST /ui-tools/:name  or  MCP /api/mcp/…     │ │
│      │ @Broadcast / @Notify / @CopyToClipboard / @ToAssistant ─► host    │ │
│ workspace ─► localStorage autosave / .json export & import               │ │
└──────────────────────────────────────────────────────────────────────────┼─┘
┌──────────── Mastra (server/) ────────────────────────────────────────────▼─┐
│ chatRoute(v7) → deskAgent: instructions = OpenUI prompt + CURRENT WORKSPACE │
│   tools: list_tickets… (agent-side reads), update_surface, publish_artifact │
│ /ui-tools/:name  ← same handlers →  MCPServer "desk-ui"                     │
│ /a2ui/stream (SSE) + /a2ui/action      in-memory desk DB                    │
└────────────────────────────────────────────────────────────────────────────┘
shared/  contracts (Zod) · prompt options · protocol helpers · validate/apply programs
```

## Feature map

Each feature points to the file to read and says how to try it in the UI.

| # | Feature | Read | Try it |
| --- | --- | --- | --- |
| 1 | Reactive `$state`, two-way binding | `components/inputs/useValidatedField.ts`, `components/layout/Tabs.tsx`, `Modal.tsx` | Canvas → Tickets: change Status/Priority/Search; open `</>` to watch `$state` |
| 2 | Expressions & built-ins (`@Filter @Sort @Count @Avg @Each`, pluck, ternaries) | `workspace/templates/feature-tour.ts` (canvas) | "Only SLA breached" checkbox (client-side `@Filter`); summary line; the canvas **Agents** tab exists only while `stats.open > 15` (create a ticket → it appears, resolve one → it goes) |
| 3 | UI-side tools: `Query`/`Mutation`, refresh interval, `toolProvider` as function map **or** MCP client, browser-only tools | `shared/src/ui-tools/contracts.ts`, `openui/tool-provider/*`, `server/src/mastra/routes/ui-tools-route.ts`, `mcp/desk-mcp-server.ts` | Top strip refreshes (5s/30s); header "Tools via → MCP client"; rail Notes |
| 4 | Action chains `Action([@Run, @Set, @Reset, @ToAssistant…])` | `components/inputs/useRunAction.ts` | New ticket / Edit / Escalate / Add comment |
| 5 | Custom functions | `openui/functions/*` | `@Percent` (top strip), `@Duration`, `@Tone`, `@PriorityTone`, `@ShortTime` |
| 6 | Custom actions, typed `onAction`, restricted action slot | `openui/actions/*`, `actions/handle-action.ts` + `actions/handlers/*` (typed registry), `components/inputs/ShareButton.tsx` | Rail "Saved views" (`@Broadcast`), dock "Copy id", toasts (`@Notify`), rail "Toggle theme" (`@ToggleTheme`) |
| 7 | Forms & validation rules | `components/inputs/Form.tsx`, `FormControl.tsx`, `useValidatedField.ts` | Click Create with empty fields |
| 8 | Incremental editing (`editMode`, `mergeStatements`) | `shared/src/program/apply-patch.ts`, `server/src/mastra/tools/update-surface.ts`, `chat/apply-tool-results.ts` + `chat/tool-results/*` (applier registry) | Ask "add a pie chart by priority to the overview"; the tool card shows the patch; ↶ undoes |
| 9 | Inline mode (prose + fenced UI) | `chat/split-inline.ts`, `chat/AssistantText.tsx` | Ask "show me the 3 oldest urgent tickets here in the chat" |
| 10 | Bindable custom components (`reactive()` + `useStateField`) | `components/layout/Tabs.tsx`, `components/inputs/*` | Rail menu switches the canvas tab via `$tab` |
| 11 | Streaming-aware components | `components/content/HtmlFrame.tsx`, `Kpi.tsx` | Canvas → Lab; ask the agent for a new HtmlFrame |
| 12 | Library composition (`createLibrary`, `componentGroups`, `extend` add+slots/override/remove) | `openui/library.ts`, `a2ui/incident-library.tsx` | `pnpm prompt` shows the groups |
| 13 | Structured errors, self-correction loop | `shared/src/program/validate-program.ts`, `update-surface.ts`, `surfaces/useErrorReporter.ts` | Failed patches show in red in chat and are retried; a render error shows "⚠ ask agent to fix" |
| 14 | Renderer slot API (`Renderer.Root/Content/QueryError/Retry`) | `surfaces/SurfaceView.tsx` | Stop the server, click Refresh → Retry banner |
| 15 | Persistence: `initialState`/`onStateUpdate`, `buildMessage`/`parseMessage` | `workspace/serialize.ts`, `storage.ts`, `shared/src/protocol/action-message.ts` | Reload, Export, Import; expand a 🖱 action turn in chat |
| 16 | AI SDK protocol + Mastra bridge | `chat/chat-transport.ts`, `chat/useDeskChat.ts`, `server/src/mastra/index.ts`, `request-context.ts` | Mastra Studio → traces |
| 17 | Artifacts (tool result → preview card → side panel, versions) | `server/.../publish-artifact.ts`, `artifacts/*` | Ask "publish a weekly SLA report artifact" |
| 18 | A2UI protocol (`@openuidev/a2ui`) | `server/src/a2ui/*`, `client/src/a2ui/*` | Dock tabs → "A2UI live incident" → Acknowledge → Resolve |
| 19 | Observability bus + DevTools | `debug/*`, `main.tsx` | DevTools button; Dock tabs → "Event log" |
| 20 | Agent drives live UI state (`set_surface_state`): sets declared `$variables` without rewriting the program; validated against `stateDeclarations`; idempotent on replay | `server/src/mastra/tools/set-surface-state.ts`, `client/src/chat/tool-results/set-surface-state.ts`, `workspace/workspace-reducer.ts` ("toolCall", "setStateValues") | Starter "Show me only the urgent open tickets in the canvas table" |

## Long-lived, serializable, malleable: how it works

1. **A surface is data.** It has a `program` (OpenUI Lang text) and a `state` (the Renderer's snapshot of `$variables` and form fields). Mounting is `<Renderer response={program} initialState={state}>`; Queries then fetch live data again.
2. **Saving** writes each surface in OpenUI's stored-message format, `]]>openui:content?library=support-desk@1` … `]]>openui:context {state}` … `]]>openui:end`, together with the chat transcript, artifacts and notes (`workspace/serialize.ts`).
3. **Evolving the UI.** The agent sees every program, its live `$state` and its render errors on each request. It sends small patches through `update_surface`. The server merges and validates them, returns errors so the agent can fix them in the same turn, and the browser applies the identical merge. Every applied patch is kept as a version, so ↶ undoes it.
4. **Agent control of live state.** A patch that changes `$status = "open"` only changes the default; saved state wins. To change what a surface shows now, the agent calls `set_surface_state`, which writes into the same saved state the Renderer reads as `initialState`.
5. **Cross-surface control.** Each Renderer has its own `$state`. The custom action `@Broadcast(key, value)` writes `$key` into every surface's saved state. react-lang re-applies a changed `initialState` live, so dependent Queries refetch with no remount.
6. **Library changes.** Programs are positional. Only append optional props to existing components; never reorder or remove props. The `library` attribute in saved surfaces records which version wrote them.

## Gotchas found while building (versions as of Oct 2026)

- **Use the full prompt.** `generateSystemPrompt({ cloud: true })` silently drops tools, `$bindings`, `editMode` and `inlineMode`; this demo uses the full prompt.
- **Reuse the reference names.** The generated prompt's built-in sections show examples using the reference library's names (`Form`, `FormControl`, `Input`, `Select`, `SelectItem`, `Button`, `TextContent`, `Stack`). The custom library keeps those names and argument orders.
- **Restricted action slots aren't enforced.** `z.union([copy.ref, steps.OpenUrl.ref])` shapes only the prompt; any action is still accepted at runtime.
- **MCP needs a pinned protocol.** `@mastra/mcp` 2.x speaks MCP `2026-07-28` only, so the browser needs `@modelcontextprotocol/client` 2.x with `versionNegotiation: { mode: { pin: "2026-07-28" } }`, plus extra CORS headers on the server.
- **Mastra's chat route:** per-request data must go in `body.requestContext`; other top-level body keys don't reach tools or instructions. `chatRoute` defaults to AI SDK v5, so `version: "v7"` is set explicitly.
- **DevTools nudge:** the DevTools widget (loaded from a CDN) sometimes shows a "Ready to share your app? … deploy" Cloud nudge. It has no prop to disable it; close it.
- **Effect cleanup:** newer browsers make `scrollIntoView()` return a Promise, so `useEffect(() => el.scrollIntoView())` breaks React. Use a block body.
- **Not used here.** The chat uses AI SDK `useChat` directly, so OpenUI's `vercelAIAdapter`, `ChatProvider`, `useToolActivities` and `AgentInterface` are not needed; tool parts come straight from `UIMessage.parts`. `WithPreviewRenderer` metadata comes from OpenUI Cloud and is skipped.

## License

MIT. See [LICENSE](LICENSE). A learning demo; not an official OpenUI or Mastra project.

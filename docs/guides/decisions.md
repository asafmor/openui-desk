# Decision guides

Each section compares the options for one design question, then says which one fits which situation. Pick per question: the answers are independent, and none of them requires the rest of the demo.

!!! tip "How to read these"
    "Demo" marks what [OpenUI Desk](https://github.com/asafmor/openui-desk) does. That is one valid choice for a learning app with four panels. It is not a recommendation for every app.

## One surface or many?

A **surface** is a place on screen that hosts one long-lived OpenUI program. See [Surface modeling](../concepts/surfaces.md).

| | One surface | Several fixed surfaces (demo) | Surfaces created on demand |
| --- | --- | --- | --- |
| Agent targeting | Implicit | `surfaceId` enum in the tool | Agent must create, name and find them |
| Prompt size | One program in context | Every program in context | Grows with use |
| Layout control | App decides | App decides the slots, agent decides contents | Agent decides a lot |
| State isolation | n/a | Each surface has its own `$state` | Same, plus lifecycle |
| Cross-surface control | n/a | Needed ([@Broadcast](../concepts/cross-surface.md)) | Needed |

**Choose:**

- **One surface** when the app has one main canvas: a dashboard page, a report builder, a form. It is the cheapest start and the easiest prompt.
- **Several fixed surfaces** when your layout already has named regions (header strip, sidebar, main, footer) and each has a clear purpose the agent can be told about.
- **On-demand surfaces** only when users manage many independent views (tabs, saved boards). Add create/delete tools and a listing in the context; keep the current set small in the prompt.

## One tool per surface or one big program?

| | `update_surface({surfaceId, patch})` (demo) | One program for the whole screen |
| --- | --- | --- |
| Patch size | Small; only that surface's statements | Small too with edit mode, but names collide |
| Failure blast radius | One surface | Whole screen |
| Names and `$vars` | Scoped per surface | Global; must stay unique |
| Shared state | Needs a bridge ([@Broadcast](../concepts/cross-surface.md)) | Free: one `$state` store |
| Layout | Owned by the app | Owned by the program |

**Choose** one program when the screen is one cohesive view and you want shared `$state` for free. **Choose** a tool per surface when regions have different lifetimes, different owners, or must survive each other's errors.

## Change the program, change the state, or propose?

Three ways for the agent to affect a live surface. Details: [Agent edits surfaces](../concepts/agent-edits.md), [Agent drives live state](../concepts/agent-state.md), [Proposals](../concepts/proposals.md).

| Goal | Tool | Changes | Persists as |
| --- | --- | --- | --- |
| Add, remove or restyle UI | `update_surface` | The program (statements) | New program version, undoable |
| Filter, switch tab, select, open a modal, prefill a form | `set_surface_state` | `$variables` the program declares | Saved `$state` |
| Write data (escalate, delete, pay) | Both: add a card, then set `$proposal` | The program + state; the **user** clicks | Mutation runs only on click |

!!! warning "Patching a default does not move a live surface"
    `$status = "pending"` in a patch changes the default only. The Renderer keeps the saved value, because lang-core's `store.initialize` lets persisted values win. Use state, not a patch, for "show me …" requests.

**Choose:** state for anything a user could do with the existing controls; program patches for new controls or layout; proposals for every write the user should approve.

## UI tools: REST function map or MCP client?

`Query()` and `Mutation()` call a `toolProvider`. See [UI-side tools](../concepts/ui-tools.md).

| | Function map (demo default) | MCP client (demo toggle) |
| --- | --- | --- |
| Client code | `{ list_tickets: (args) => fetch(...) }` | `Client` + transport from `@modelcontextprotocol/client` |
| Server | Any HTTP route | An MCP server (Mastra `MCPServer`) |
| Tool discovery | You list the tools | `listTools()`, schemas included |
| Extra setup | None | Protocol version pin, CORS headers (see [Gotchas](../reference/gotchas.md#mcp-client-rejected-by-mastra)) |
| Browser-only tools | Just add a function | Wrap the client (demo: `createMcpProvider`) |

**Choose** the function map when you control the backend and want the fewest moving parts. **Choose** MCP when the same tools already serve other agents or IDEs, or you want one tool contract for every consumer.

## Chat: hand-built `useChat` or OpenUI's Agent Interface?

| | `useChat` + your components (demo) | `AgentInterface` + `vercelAIAdapter()` |
| --- | --- | --- |
| Package | `@ai-sdk/react` | `@openuidev/react-ui` (with `react-headless`) |
| Tool parts | Read `UIMessage.parts` yourself | `useToolActivities`, artifact renderers |
| Layout | Anything | Its layout and slots |
| Thread storage | Yours | `ChatStorage` interface you implement |
| Artifacts panel | Build it | Built in (`defineArtifactRenderer`) |

**Choose** `useChat` (or keep the chat you already have) when the chat is one panel of a larger app, as here. **Choose** Agent Interface when the chat *is* the app and you want threads, artifacts and a sidebar without writing them. If you already have chat and history, see [You already have chat & history](../porting/own-chat.md).

## Persistence: client or server?

See [Persist & resume](../concepts/persistence.md) and [Persisting on the server](../porting/server-persistence.md).

| | localStorage + JSON file (demo) | Server (DB, Mastra storage) |
| --- | --- | --- |
| Effort | Small | Medium |
| Survives device change | Only via export/import | Yes |
| Sharing between users | Send the file | Permissions needed |
| Quota | About 5 MB per origin | Your DB |
| Agent can read it without the browser | No | Yes |

**Choose** client storage for prototypes, single-user tools and offline use. **Choose** the server once workspaces must follow the user, be shared, or be read by background jobs. The format stays the same: program + state per surface.

## OpenUI Lang surfaces or A2UI?

See [A2UI](../concepts/a2ui.md).

| | OpenUI Lang surface | A2UI surface |
| --- | --- | --- |
| Who writes the UI | The model, as a program | Your server, as envelopes |
| Data flow | Program calls tools (`Query`) | Server pushes data model updates |
| Best for | Agent-crafted, user-evolved views | Server-driven live views (incidents, jobs, wizards) |
| Clicks go to | Host `onAction` | Server, as action envelopes |

**Choose** A2UI when a backend process owns the view and its timing, and the model may not be involved at all. Use OpenUI Lang when the agent designs the view.

## Host concern: custom action or `$state`?

See [Custom actions & the host](../concepts/custom-actions.md) and [Host-owned preferences](../concepts/preferences.md).

| | `$state` | Custom action (`@ToggleTheme()`) | Typed preference action (`@SetPreference(key, value)`) |
| --- | --- | --- | --- |
| Lives | Inside one Renderer | Host | Host |
| Can change the page outside the Renderer | No | Yes | Yes |
| Validated | Program types | Action params (Zod) | Allow-listed keys + per-key schema |
| Scales to many options | n/a | One action each | One registry entry each |

**Choose** `$state` for anything only the program reads. **Choose** a custom action for host effects (theme, clipboard, navigation, toasts). Move to a typed preference action once you have two or more host settings. Never expose a raw `SetLocalStorage(key, value)`: any program, including one shaped by a prompt injection, could overwrite unrelated keys.

## Artifact, surface or inline UI?

See [Artifacts](../concepts/artifacts.md), [Inline UI in chat](../concepts/inline-ui.md).

| | Inline UI | Surface | Artifact |
| --- | --- | --- | --- |
| Where | Inside a chat message | Fixed slot, always visible | Side panel, opened on demand |
| Lifetime | The message | Long-lived, patched | Immutable versions |
| `$state` saved | Yes (demo: `inlineState`) | Yes | No |
| Agent sees it each turn | Only in chat history | Yes | Only in chat history |

**Choose** inline for one-off answers ("show the 3 oldest tickets"), a surface for tools the user keeps working with, an artifact for a document to keep and reopen (a report, a summary).

## Where to validate programs?

See [Fixing errors with the agent](../concepts/self-correction.md).

| | Server only | Client only | Both (demo) |
| --- | --- | --- | --- |
| Catches parse/type errors | Yes, before the browser sees them | After render | Yes |
| Catches runtime errors (bad data, function throws) | No | Yes (`onError`) | Yes |
| Agent can fix in the same turn | Yes | No; next turn | Both |
| Needs the library spec on the server | Yes | No | Yes |

**Choose both** when you can generate the spec for the server (`openui generate --spec`). Server validation gives the agent a same-turn retry; client `onError` reports what only shows up with live data. With client only, send render errors with the next request so the agent can fix them then.

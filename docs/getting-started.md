# Getting started

Run the demo, then take a 10-minute tour that maps what you see to the concept pages.

## Requirements

- Node.js 22 or newer and [pnpm](https://pnpm.io).
- An OpenAI API key, for the chat only. The "Feature tour" template works without one.

## Run it

```bash
git clone https://github.com/asafmor/openui-desk.git
cd openui-desk
pnpm install
OPENAI_API_KEY=sk-... pnpm dev
```

`pnpm dev` generates the library spec, validates every hand-written program, then starts
the Mastra server and the Vite client.

!!! tip "Keep the key out of files"
    If you use [`pass`](https://www.passwordstore.org/), store the key once
    (`pass insert agents/openai-api-key`) and run `pnpm dev:pass`. The key is read into
    the server's environment for that process only.

| Variable | Default | What |
| --- | --- | --- |
| `OPENAI_API_KEY` | none | needed by the agent only |
| `DESK_MODEL` | `openai/gpt-6.1-sol` | any Mastra model-router id, e.g. `openai/<model>` |
| `VITE_SERVER_URL` | `http://localhost:4111` | where the client finds the Mastra server |

| URL | What |
| --- | --- |
| <http://localhost:5173> | the app (the OpenUI DevTools button is bottom-right) |
| <http://localhost:4111> | Mastra Studio: the agent, its tools and traces |

| Script | What it does |
| --- | --- |
| `pnpm generate` | OpenUI CLI: component library → `shared/generated/library.spec.json` |
| `pnpm check` | parses every hand-written program against the spec; checks the tool-result pipeline |
| `pnpm prompt` | prints the exact system prompt the agent receives (read it once) |
| `pnpm typecheck` | `tsc` for shared, client and server |
| `pnpm dev` | generate → check → server `:4111` + client `:5173` |
| `pnpm dev:pass` | `pnpm dev` with the key read from `pass` |

## A 10-minute tour

The first visit loads the **Feature tour** template. Later visits resume your autosave.
To start over, pick **New from template… → Feature tour** in the header.

| # | Do this | What happens | Read |
| --- | --- | --- | --- |
| 1 | Look at the four areas around the chat | each is its own OpenUI program with its own state | [Surface modeling](concepts/surfaces.md) |
| 2 | Canvas → **Tickets**, change Status or Priority | `$status` changes and the `list_tickets` Query re-fetches | [UI-side tools](concepts/ui-tools.md) |
| 3 | Rail → **Saved views → Urgent & open** | the rail changes the canvas filters with `@Broadcast` | [Cross-surface control](concepts/cross-surface.md) |
| 4 | Click **Open** on a ticket | the dock shows that ticket | [Cross-surface control](concepts/cross-surface.md) |
| 5 | **+ New ticket**, click Create with empty fields | validation errors; fill it in and the ticket is created | [UI-side tools](concepts/ui-tools.md) |
| 6 | Count the canvas tabs, create one more ticket | an **Agents** tab appears once more than 15 tickets are open | [Data-shaped UI](concepts/data-shaped-ui.md) |
| 7 | Reload the page | filters, tab and notes come back | [Persist & resume](concepts/persistence.md) |
| 8 | Rail → **Toggle theme** | the host flips the app theme | [Host-owned preferences](concepts/preferences.md) |
| 9 | Chat: *"Show me only the urgent open tickets in the canvas table"* | the agent sets the filters without rewriting the program | [Agent drives live state](concepts/agent-state.md) |
| 10 | Chat: *"Add a pie chart of tickets by priority next to the existing charts"* | a patch streams in; ↶ on the surface undoes it | [Agent edits surfaces](concepts/agent-edits.md) |
| 11 | Click `</>` on a surface, open the DevTools, Dock → **Event log** | program source, `$state` and every runtime event | [Runtime diagnostics](concepts/diagnostics.md) |
| 12 | **Export**, load another template, **Import** the file | the exported workspace returns exactly as it was | [Persist & resume](concepts/persistence.md) |

More things to try:

- *"Show me the 3 oldest urgent tickets here in the chat"* → [Inline UI in chat](concepts/inline-ui.md)
- *"Publish a weekly SLA report artifact"* → [Artifacts](concepts/artifacts.md)
- Dock → **A2UI live incident** → Acknowledge → Resolve → [A2UI](concepts/a2ui.md)
- Header → **Tools via → MCP client**: the same programs, a different backend → [UI-side tools](concepts/ui-tools.md)

Next: [Architecture](architecture.md).

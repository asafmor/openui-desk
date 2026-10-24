# OpenUI Desk

!!! abstract "What this is"
    A learning demo of **long-lived generative interfaces**. A chat sits between four
    **surfaces** (top strip, left rail, main canvas, bottom dock). Each surface is an
    [OpenUI Lang](https://www.openui.com/docs) program that keeps running between chat
    turns. A [Mastra](https://mastra.ai) agent builds and evolves the surfaces, you use
    them directly (filter, edit, run mutations), and the whole workspace can be saved,
    exported and imported to continue from the same spot.

Everything is self-hosted: a Vite + React client, a Mastra server and the AI SDK v7
`UIMessage` protocol. Every component is hand-written for the demo. No OpenUI Cloud
services are used.

## Adopt one concept at a time

This site is not a framework to install. It is a catalog of **independent ideas** that
you can lift into your own Mastra + OpenUI app **one at a time**. Each concept page says
what it needs first, so you can start with the smallest useful piece and stop there.

!!! tip "Typical first steps"
    - Already render OpenUI in a chat? Add [Persist & resume](concepts/persistence.md) to
      keep generated UIs alive across reloads.
    - Want the agent to change a dashboard instead of regenerating it? Start with
      [Live UI context](concepts/workspace-context.md), then
      [Agent edits surfaces](concepts/agent-edits.md).
    - Need to debug generated UI? [Runtime diagnostics](concepts/diagnostics.md) needs
      nothing else.

## Concept catalog

Effort: **S** = an afternoon, **M** = a day or two, **L** = more.

### Long-lived surfaces

| Concept | What you get | Needs first | Effort | Lives in |
| --- | --- | --- | --- | --- |
| [Surface modeling](concepts/surfaces.md) | UI regions that outlive chat turns, one program each | nothing | S | client |
| [Persist & resume](concepts/persistence.md) | reload, export or import and continue from the same spot | nothing | S | client |
| [Cross-surface control](concepts/cross-surface.md) | a click in one surface changes another | [Surface modeling](concepts/surfaces.md), [Persist & resume](concepts/persistence.md) | S | client |
| [Host-owned preferences](concepts/preferences.md) | app-wide settings (theme) changed from generated UI | [Custom actions](concepts/custom-actions.md) | S | client |

### Agent ↔ UI

| Concept | What you get | Needs first | Effort | Lives in |
| --- | --- | --- | --- | --- |
| [Live UI context for the agent](concepts/workspace-context.md) | the agent sees current programs, `$state` and render errors | nothing | S | client, server |
| [Agent edits surfaces](concepts/agent-edits.md) | small validated patches instead of full rewrites | [Live UI context](concepts/workspace-context.md) | M | client, server, prompt |
| [Agent drives live state](concepts/agent-state.md) | the agent sets filters, tabs, selections | [Live UI context](concepts/workspace-context.md), [Persist & resume](concepts/persistence.md) | M | client, server, prompt |
| [Applying tool results](concepts/tool-results.md) | one registry turns agent tool outputs into UI changes, once | nothing | S | client |
| [Proposals (human in the loop)](concepts/proposals.md) | the agent proposes a write, the user confirms with a click | [Agent edits surfaces](concepts/agent-edits.md), [Agent drives live state](concepts/agent-state.md) | S | prompt |
| [Clicks that talk to the agent](concepts/action-turns.md) | a button sends a chat turn with form values and context | nothing | S | client |
| [Inline UI in chat](concepts/inline-ui.md) | small throw-away UIs inside assistant messages | [Prompt generation](concepts/prompt.md) | S | client, prompt |
| [Artifacts](concepts/artifacts.md) | keep-and-reopen reports with versions | [Applying tool results](concepts/tool-results.md) | M | client, server |

### Components & language

| Concept | What you get | Needs first | Effort | Lives in |
| --- | --- | --- | --- | --- |
| [Your own component library](concepts/component-library.md) | your design system as OpenUI components | nothing | M | client |
| [Restricting components per surface](concepts/restricted-components.md) | each surface allows only a chosen set of components | [Component library](concepts/component-library.md), [Prompt generation](concepts/prompt.md) | M | client, server, prompt |
| [Custom functions](concepts/custom-functions.md) | `@Fn(...)` helpers inside expressions | [Component library](concepts/component-library.md) | S | client |
| [Data-shaped UI](concepts/data-shaped-ui.md) | layout that appears or hides based on live data | [UI-side tools](concepts/ui-tools.md) | S | program |
| [Prompt generation](concepts/prompt.md) | the system prompt generated from your library | [Component library](concepts/component-library.md) | S | server |

### Data & actions

| Concept | What you get | Needs first | Effort | Lives in |
| --- | --- | --- | --- | --- |
| [UI-side tools (Query / Mutation)](concepts/ui-tools.md) | live data and writes straight from programs, REST or MCP | nothing | M | client, server |
| [Custom actions & the host](concepts/custom-actions.md) | your own `@Action(...)` steps, routed through a typed registry | nothing | S | client |

### Reliability & debugging

| Concept | What you get | Needs first | Effort | Lives in |
| --- | --- | --- | --- | --- |
| [Fixing errors with the agent](concepts/self-correction.md) | invalid patches rejected and retried; render errors sent back | [Agent edits surfaces](concepts/agent-edits.md) | M | client, server |
| [Runtime diagnostics](concepts/diagnostics.md) | DevTools, an event log, a source view | nothing | S | client |

### Protocols

| Concept | What you get | Needs first | Effort | Lives in |
| --- | --- | --- | --- | --- |
| [A2UI](concepts/a2ui.md) | a server-driven surface over the A2UI protocol | [Component library](concepts/component-library.md) | L | client, server |

## How to read a concept page

Every concept page has the same shape:

1. **At a glance**: can you adopt it alone, how big it is, and where it lives.
2. **The problem** it solves.
3. **How the demo does it**, with short excerpts linked to the source.
4. **Port it to your app**: the minimal steps.
5. **Variations**: what changes when your app differs from the demo.
6. **Pitfalls** and **Related** concepts.

Snippets marked **"Recipe — not in the demo"** show how to go further than the demo does.

## Assumptions about your app

- You use **Mastra** for the agent and **OpenUI** (`@openuidev/react-lang`) to render.
- You may **already have your own chat and conversation history** (Mastra memory, your
  own database, another chat UI). See [You already have chat & history](porting/own-chat.md).
- You may **not have a shared package** between client and server. See
  [No shared client/server package](porting/no-shared-package.md).
- You may want to store generated UIs **on the server** instead of in the browser. See
  [Persisting on the server](porting/server-persistence.md).

Still choosing between approaches? The [Decision guides](guides/decisions.md) compare
the common forks in the road. To run the demo first, go to
[Getting started](getting-started.md).

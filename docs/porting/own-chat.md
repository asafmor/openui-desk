# You already have chat & history

!!! abstract "In one line"
    Keep your chat UI and your conversation storage. The demo's patterns need only three small hooks into them: read tool results, attach the live surfaces to each request, and store surfaces somewhere.

The demo owns its whole conversation: a hand-built chat on AI SDK `useChat`, with the transcript saved inside the workspace and sent in full on every request (the Mastra agent has no memory). Your app probably differs. It may use Mastra Memory threads, OpenUI's `AgentInterface`, assistant-ui, or a chat of its own. This page shows what to keep and what to add.

## What the patterns need from your chat

| Need | Why | Used by |
|---|---|---|
| **1. Read tool calls and their results on the client** | The browser applies `update_surface`, `set_surface_state` and `publish_artifact` results | [Agent edits surfaces](../concepts/agent-edits.md), [Agent drives live state](../concepts/agent-state.md), [Artifacts](../concepts/artifacts.md), [Applying tool results](../concepts/tool-results.md) |
| **2. Attach data to each request** | The agent must see each surface's program, `$state` and errors | [Live UI context](../concepts/workspace-context.md), [Fixing errors](../concepts/self-correction.md) |
| **3. Send a user turn from code** | Clicks in generated UI become chat turns | [Clicks that talk to the agent](../concepts/action-turns.md) |
| **4. A place to store surfaces** | Programs and state must outlive the page | [Persist & resume](../concepts/persistence.md) |

Many concepts need none of these: custom components, functions and actions, UI-side tools, cross-surface control, preferences, diagnostics and A2UI are all independent of chat.

## Need 1: tool results

If your stream carries tool results (AI SDK UI message stream, Mastra's `chatRoute`, LangGraph, Responses API), the browser can read them. The demo reads AI SDK `UIMessage.parts` with `isToolUIPart` and `getToolName` ([`client/src/chat/tool-parts.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/chat/tool-parts.ts)). Your chat library exposes the same data in its own shape; write one adapter that yields `{ toolName, toolCallId, output }` for finished calls, then reuse the demo's applier registry ([`client/src/chat/tool-results/`](https://github.com/asafmor/openui-desk/tree/main/client/src/chat/tool-results)).

!!! warning "Chat Completions streams don't carry tool results"
    With a plain Chat Completions SSE stream, the browser never sees tool outputs. Run the tool loop in Mastra (as here) and stream with `chatRoute`, or apply tool results on the server (option B below).

### Where "apply once" lives

Tool results are replayed whenever history is loaded: after a reload, when a thread is reopened, on another device. Applying them twice would undo the user's later changes (for example, re-setting a filter the user cleared). Pick one:

=== "A. Client applies, remembers ids"

    The demo's way. The workspace keeps `appliedToolCalls`, and the reducer's `toolCall` envelope skips ids it has seen ([`client/src/workspace/workspace-reducer.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/workspace-reducer.ts)).

    With server-side history, store `appliedToolCalls` **with the surfaces**, not with the chat. They must be saved together, or a crash between the two saves causes a double apply.

=== "B. Server applies, client just reloads"

    The tool's `execute` writes the new program or state to your database directly, then returns `{ ok: true }`. The client re-fetches surfaces when a turn finishes (or listens for a change event). History replay is harmless because the client never applies results.

    This fits apps that already store everything on the server. See [Persisting on the server](server-persistence.md).

## Need 2: per-request surface context

The demo sends surfaces in the body, and Mastra's `chatRoute` turns `body.requestContext` into the agent's `RequestContext` ([`client/src/chat/chat-transport.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/chat/chat-transport.ts)):

```ts
prepareSendMessagesRequest: ({ messages }) => {
  const requestContext: ChatRequestExtras = { surfaces: getSurfaces() };
  return { body: { messages: messages.map(forModel), requestContext } };
},
```

The agent's `instructions` function and every tool read the same `RequestContext` for that request.

How to do the same with other setups:

- **Mastra Memory with `chatRoute`.** Send only the new message plus `memory: { thread, resource }`, as Mastra's docs show, and keep `requestContext: { surfaces }` in the same body. Surfaces are *current state*, not history, so they should not be stored in the thread.
- **Your own server route calling the agent.** Build the context yourself: `const requestContext = new RequestContext(); requestContext.set("surfaces", surfaces);` then pass `{ requestContext }` to `agent.stream(...)` or `agent.generate(...)`.
- **Server-side surfaces.** Don't send them from the browser at all. Load them from your database in the route (or in the agent's `instructions` function) using the user or workspace id.
- **Chat UIs with adapters** (OpenUI `AgentInterface`, assistant-ui): look for the hook that customizes the request body or headers, and add the same field.

!!! tip "Keep context out of history"
    Put surfaces in the system prompt (the demo appends a `## CURRENT WORKSPACE` section) or the request context, never in stored messages. Otherwise every past turn carries an old copy and the model sees conflicting versions.

## Need 3: send a turn from code

Clicks become user turns stored in OpenUI's message format and converted to plain text for the model ([`shared/src/protocol/action-message.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/protocol/action-message.ts)). Any chat with a "send message" function works. If your history is server-side, store the readable text (or keep both forms) so the transcript doesn't show marker lines.

## Need 4: storing surfaces

The demo saves surfaces inside a workspace JSON together with the transcript. With your own history, store surfaces separately: one record per user or workspace with each surface's program, state and history, plus `appliedToolCalls` if you use option A. The chat only needs to reference that record's id.

## Concept by concept

| Concept | Change when you have your own chat/history |
|---|---|
| [Surface modeling](../concepts/surfaces.md) | None |
| [Persist & resume](../concepts/persistence.md) | Store surfaces apart from the transcript |
| [Live UI context](../concepts/workspace-context.md) | Attach surfaces per request (Need 2) |
| [Agent edits surfaces](../concepts/agent-edits.md) | Apply results via your tool-part adapter, or server-side (option B) |
| [Agent drives live state](../concepts/agent-state.md) | Same as above; "apply once" matters most here |
| [Applying tool results](../concepts/tool-results.md) | Reuse the registry; feed it from your adapter |
| [Proposals](../concepts/proposals.md) | None beyond agent edits/state |
| [Clicks that talk to the agent](../concepts/action-turns.md) | Use your "send message" function |
| [Inline UI in chat](../concepts/inline-ui.md) | Your message renderer must split text and fenced OpenUI Lang |
| [Artifacts](../concepts/artifacts.md) | Store artifacts by id outside the transcript so they survive history trimming |
| [Fixing errors](../concepts/self-correction.md) | Errors travel with the per-request context |
| Components, functions, actions, UI-side tools, cross-surface, preferences, diagnostics, A2UI | None |

## Pitfalls

- **Full history vs memory.** Without memory, send the full message list; with Mastra Memory, send only the new message. Mixing both duplicates history.
- **Edited or regenerated messages.** With Mastra Memory, the stored thread is the source of truth; editing an earlier message in the client doesn't change it.
- **Stale context.** Read surfaces at send time (the demo reads them through a ref), not when the chat component mounted.

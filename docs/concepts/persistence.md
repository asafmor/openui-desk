# Persist & resume

> A generated interface is data: **program text + a state snapshot**. Save both, mount
> them again later, and the user continues from the same spot.

**Adopt alone?** Yes · **Effort** S · **Touches** client

## The problem

Users filter a table, open a tab, half-fill a form, then reload the page or come back
tomorrow. A generated UI that is rebuilt from the chat loses all of that, and asking
the model again costs time and money and may give a different UI.

## How the demo does it

### Two pieces of data per surface

| Piece | What it is | Who changes it |
| --- | --- | --- |
| `program` | OpenUI Lang text | the agent (patches), undo, templates |
| `state` | the Renderer's snapshot: `$variables` and form fields | the user (via `onStateUpdate`), `@Broadcast`, `set_surface_state` |

```ts
export interface SurfaceRecord {
  program: string;
  /** Raw snapshot from <Renderer onStateUpdate>: { $var: value, formName: {...} }. */
  state: Record<string, unknown>;
  /** Previous programs, newest last — powers Undo ("malleable" UI with history). */
  history: SurfaceVersion[];
}
```

[client/src/workspace/types.ts](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/types.ts)

Mounting is just the two props. Queries then fetch live data again.

```tsx
<Renderer.Root
  response={surface.program}
  initialState={surface.state}
  onStateUpdate={(s) => dispatch({ type: "setSurfaceState", surfaceId: id, state: s })}
  /* library, toolProvider, onAction … */
>
```

[client/src/surfaces/SurfaceView.tsx](https://github.com/asafmor/openui-desk/blob/main/client/src/surfaces/SurfaceView.tsx)

### How `initialState` meets the program's defaults

A program declares defaults (`$status = "open"`). The saved state may hold another
value. lang-core's store decides with `initialize(defaults, persisted)`:

```js
function initialize(defaults, persisted) {
  for (const key of Object.keys(persisted)) {
    pristine.delete(key);                                   // saved keys are no longer "pristine"
    if (!state.has(key) || !Object.is(state.get(key), persisted[key])) state.set(key, persisted[key]);
  }
  for (const key of Object.keys(defaults)) if (!state.has(key)) {
    state.set(key, defaults[key]); pristine.add(key);       // never-saved keys take the default
  } else if (pristine.has(key) && !Object.is(state.get(key), defaults[key])) {
    state.set(key, defaults[key]);                          // …and follow default changes
  }
  // notify subscribers if anything changed
}
```

(From `@openuidev/lang-core` 1.0.1, trimmed.)

Three rules follow, and the demo depends on all of them:

1. **Saved values win over defaults.** A reload restores the user's filters.
2. **A changed `initialState` is applied live, without a remount.** Writing a new value into
   the saved state (from [Cross-surface control](cross-surface.md) or
   [Agent drives live state](agent-state.md)) updates the running UI and re-runs
   dependent Queries.
3. **Changing a default in the program does not move a saved value.** A patch that
   rewrites `$status = "pending"` changes nothing on screen once `$status` has been saved.
   That is why the agent needs a separate tool to set state.

### The stored format

Each surface is written in OpenUI's stored-message format with `buildMessage`, and read
back with `parseMessage`:

```ts
function encodeSurface(id: string, s: SurfaceRecord): StoredSurface {
  const message = buildMessage({
    content: s.program,
    context: s.state,
    attributes: { library: `${LIBRARY_ID}@${LIBRARY_VERSION}`, surface: id },
    end: true,
  });
  return { message, history: s.history };
}
```

[client/src/workspace/serialize.ts](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/serialize.ts)

```text
]]>openui:content?library=support-desk%401&surface=canvas
root = Stack([tabs])
…program…
]]>openui:context
{"$tab":"tickets","$status":"open","create":{"newTitle":{"value":"…","componentType":"input"}}}
]]>openui:end
```

- `content`: the program. The `library` attribute records which library version wrote it,
  so loading a mismatched workspace shows a warning.
- `context`: host JSON. The demo stores the state snapshot there.
- `end`: the program was complete, not a stream cut off mid-way.

### The whole workspace

```jsonc
{
  "format": "openui-desk-workspace", "formatVersion": 1, "savedAt": "…",
  "id": "…", "name": "Feature tour",
  "surfaces": { "canvas": { "message": "]]>openui:content…", "history": [ … ] } /* top, rail, dock */ },
  "chat": [ /* AI SDK UIMessage[] */ ],
  "inlineState": { "msgId:0": { /* state of inline UIs in chat */ } },
  "artifacts": [ { "id", "title", "program", "version", "at" } ],
  "notes": [ /* data of the browser-only notes tools */ ],
  "appliedToolCalls": [ "call_abc" ]
}
```

The same JSON is the localStorage autosave (`openui-desk:workspace`, written 400 ms after
the last change) and the export file.
[storage.ts](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/storage.ts) ·
[WorkspaceContext.tsx](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/WorkspaceContext.tsx)

### History and undo

Every applied agent patch pushes the previous program onto `history` (max 30). ↶ pops it.
The undo restores the program only; the state stays, so filters survive an undo.

### Applying each tool call once

The chat transcript is saved too. After a reload or import, the client sees every old
`update_surface` result again. `appliedToolCalls` records which tool calls have been
applied, so they are not applied twice:

```ts
case "toolCall": {
  if (ws.appliedToolCalls.includes(action.toolCallId)) return ws; // already applied (e.g. after import)
  const next = action.actions.reduce(reduceWorkspace, ws);
  return { ...next, appliedToolCalls: [...next.appliedToolCalls, action.toolCallId] };
}
```

[client/src/workspace/workspace-reducer.ts](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/workspace-reducer.ts)
· more in [Applying tool results](tool-results.md)

### What is not saved

| Not saved | Why |
| --- | --- |
| Query results | fetched again on mount, so the UI shows live data |
| Render errors | recomputed when the program renders |
| Theme | a per-browser preference with its own key ([Host-owned preferences](preferences.md)) |
| Server data | lives in the backend |

## Port it to your app

1. **Keep the program text** of the generated UI you want to keep. If it came from an
   assistant message, copy it out of the message into your own record.
2. **Capture state** with `onStateUpdate` and store it next to the program.
3. **Mount with both**: `<Renderer response={program} initialState={state} />`.
4. **Save** wherever you like: localStorage, your database, a file. For a portable format,
   use `buildMessage({ content, context: state, attributes, end: true })`.
5. **Record the library version** in what you save (an attribute or a field), and follow
   the versioning rule below.
6. If saved UIs come from tool calls in a saved transcript, **record applied tool call
   ids** so replaying the transcript does not apply them again.

## Variations

=== "Own chat & history"

    You do not need to save the transcript with the UI. Save surfaces separately, keyed
    by user or conversation. If you rebuild surfaces by replaying tool results from your
    stored messages, persist the applied tool-call ids with them. See
    [You already have chat & history](../porting/own-chat.md).

=== "Server-side storage"

    The same record (program, state, history) fits one database row per surface. Debounce
    `onStateUpdate` writes; typing in a filter fires many updates. See
    [Persisting on the server](../porting/server-persistence.md).

=== "Single inline UI"

    Persisting one inline UI per message works the same way: the demo stores the state of
    inline UIs under `inlineState["<messageId>:<segment>"]`.

## Pitfalls

!!! warning "Programs are positional"
    OpenUI Lang passes props by position: `Kpi("Open", stats.open, "hint")`. If you
    reorder or remove props in a component, saved programs put values in the wrong place.
    **Only append new optional props at the end.** Bump the library version when you
    change the library.

- **Patching a default is not a state change.** See rule 3 above.
- **Debounce saves.** `onStateUpdate` fires on every keystroke.
- **Wrap storage access.** localStorage can throw (private mode, quota). The demo wraps
  every read and write in `try/catch` and falls back to a template.
- **Fresh id on load.** The demo gives an imported workspace a new id so the chat and
  every Renderer remount cleanly instead of mixing old and new state.

## Related

- [Surface modeling](surfaces.md)
- [Cross-surface control](cross-surface.md)
- [Agent drives live state](agent-state.md)
- [Applying tool results](tool-results.md)
- [Persisting on the server](../porting/server-persistence.md)

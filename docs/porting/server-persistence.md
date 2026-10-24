# Persisting on the server

!!! abstract "In one line"
    Keep the demo's workspace format, but save it through an API instead of localStorage: per user and workspace, with a version number for conflicts, and validated when it is loaded.

The demo saves the whole workspace to localStorage 400 ms after each change, and lets you export and import it as a JSON file ([`client/src/workspace/storage.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/storage.ts)). That's enough for one person in one browser. A product needs workspaces that follow the user across devices, can be shared, and are backed up.

## What you need

- **A format.** Reuse the demo's: `serializeWorkspace` writes each surface in OpenUI's stored-message format (`]]>openui:content … ]]>openui:context … ]]>openui:end`) plus history, chat, artifacts and `appliedToolCalls` ([`client/src/workspace/serialize.ts`](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/serialize.ts)). `deserializeWorkspace` reads it back and warns when it was written for another library version.
- **An API** to load and save one workspace by id, behind your auth.
- **A conflict rule** for two tabs or devices saving at once.
- **Validation on load**, because the content was written by a model and edited by a browser.

## Options

| Option | Fits when | Notes |
|---|---|---|
| **Whole workspace as one JSON document** | Most apps | Simplest. One row per workspace; the demo's format as-is. |
| **One row per surface** | Large workspaces, or several people editing different surfaces | Smaller writes and fewer conflicts; more code to load. |
| **Server applies agent changes** | You already store chat on the server | Tools write programs/state directly in `execute`; the client reloads. Removes the need to replay tool results in the browser. See [You already have chat & history](own-chat.md). |

Where to store it: the database your app already uses. Keep surfaces out of chat history; they are current state, not conversation.

## Steps

!!! note "Recipe — not in the demo"
    The demo has no server persistence. The routes below are type-checked against the demo's Mastra version but not run in the app.

**1. Add two routes to your Mastra server** with `registerApiRoute` (from `@mastra/core/server`), with optimistic locking:

```ts
const Body = z.object({ baseVersion: z.number().int(), data: z.unknown() });

export const putWorkspace = registerApiRoute("/workspaces/:id", {
  method: "PUT",
  handler: async (c) => {
    const id = c.req.param("id");
    const body = Body.safeParse(await c.req.json());
    if (!body.success) return c.json({ issues: body.error.issues }, 400);
    const current = await db.get(id); // your database; check the user may write it
    if (current && current.version !== body.data.baseVersion) return c.json(current, 409);
    const next = { version: (current?.version ?? 0) + 1, data: body.data.data };
    await db.set(id, next);
    return c.json({ version: next.version });
  },
});
// GET /workspaces/:id returns { version, data } the same way.
```

Register them in `server.apiRoutes`, next to `chatRoute`.

**2. Replace localStorage in the client.** Keep the debounce from [`WorkspaceContext.tsx`](https://github.com/asafmor/openui-desk/blob/main/client/src/workspace/WorkspaceContext.tsx), but call the API with the last version you saw. On `409`, the server returns its copy: reload it, or show "changed elsewhere" and let the user choose.

**3. Validate when loading.** Run `deserializeWorkspace`, then on the server (or before rendering) run each surface program through the same validator the agent tools use ([`shared/src/program/validate-program.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/program/validate-program.ts)). Render a surface that fails as empty with a warning, rather than failing the whole workspace.

**4. Keep per-viewer settings per viewer.** The theme stays in localStorage (or the user profile), not in the workspace; see [Host-owned preferences](../concepts/preferences.md).

**5. Keep export/import.** It's the easiest backup and the easiest way to share a reproducible bug.

## Autosave and conflicts

- **Debounce.** Typing in a filter fires many state updates. The demo waits 400 ms; for a network save, 1–2 s is gentler, plus a save on `visibilitychange`/`pagehide`.
- **Don't save runtime-only data.** Render errors and Query results are recomputed on mount; the demo already leaves them out.
- **Conflicts are real with agents.** A long agent turn in one tab and a filter change in another both write the same workspace. With one document per workspace, the version check above catches it; with one row per surface, most of these never collide.
- **Tool-call ids must travel with the surfaces.** `appliedToolCalls` prevents replaying old agent results. Save it in the same write as the surfaces, or a reload can apply a tool result twice.

## Security

Workspace content is untrusted input, even when it was your own agent that wrote it:

- **Programs** come from a model that reads user and customer text. They can only use your library's components, functions and actions, which is the main protection. Keep risky components (like the demo's sandboxed `HtmlFrame`) out of libraries where they're not needed; see [Restricting components per surface](../concepts/restricted-components.md).
- **State** comes from the browser. Never trust it for authorization; the server re-checks every Query and Mutation.
- **Size.** Cap the request size and the surface history length (the demo keeps 30 versions).
- **Access.** Check the user can read or write the workspace id on every request; workspace ids in URLs are not secrets.

## Pitfalls

- **Library versions.** A workspace saved months ago was written for an older library. Programs are positional: only append optional props, never reorder or remove them. `deserializeWorkspace` warns on a library mismatch; decide whether to migrate or render as-is.
- **Loading another workspace must reset everything.** The demo gives every loaded workspace a fresh id and keys each Renderer and the chat by it, so nothing from the previous one survives.

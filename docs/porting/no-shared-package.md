# No shared client/server package

!!! abstract "In one line"
    The demo's `shared/` package is a convenience, not a requirement. Each thing in it can be generated, copied, duplicated or moved to one side, and most of it is used by only one side anyway.

The demo is a pnpm workspace with three packages: `client`, `server` and `shared`. Your app may have a front end and a Mastra server in separate repos, built by separate teams, with no package they both import. This page lists what `shared/` provides and how to replace each item.

## Who uses what

Most of `shared/` is used by one side only. It lives in `shared/` to keep related code together, and so the check scripts can reach it.

| Module | Client | Server | What it is |
|---|:-:|:-:|---|
| [`library-spec.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/library-spec.ts) + generated `library.spec.json` | | ✓ | The component library as JSON (no React) |
| [`program/validate-program.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/program/validate-program.ts) | | ✓ | `createParser` over the spec; issue list; declared `$variables` |
| [`program/apply-patch.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/program/apply-patch.ts) | ✓ | ✓ | `mergeStatements(current, patch)` |
| [`prompt/*`](https://github.com/asafmor/openui-desk/tree/main/shared/src/prompt) | | ✓ | Preamble, rules, examples, prompt options |
| [`ui-tools/contracts.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/ui-tools/contracts.ts) | ✓ (REST function map, browser-only tools) | ✓ | Tool names, kinds, Zod input/output |
| [`ui-tools/descriptors.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/ui-tools/descriptors.ts) | | ✓ | Contracts → OpenUI `ToolSpec` for the prompt |
| [`protocol/chat-request.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/protocol/chat-request.ts) | ✓ | ✓ | Types of the per-request surface context |
| [`protocol/action-message.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/protocol/action-message.ts) | ✓ | | Encode/decode click turns |
| [`surfaces.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/surfaces.ts) | ✓ | ✓ | Surface ids, titles, purposes |
| [`domain/schemas.ts`](https://github.com/asafmor/openui-desk/blob/main/shared/src/domain/schemas.ts) | | ✓ | Ticket and agent Zod schemas |

## Options per item

| Item | Options | Trade-offs |
|---|---|---|
| **Library spec** (the hard one: the library is written in the client, the server needs it) | **a.** Run `openui generate <library file> --spec --out <path>` in the client's CI and publish the JSON as a build artifact the server downloads. **b.** Commit the generated JSON into the server repo with a CI check that it is current. **c.** Server fetches it at startup from a URL the client deploys. | a/b are reproducible and versioned. c is easy but couples server startup to the client deploy. In all cases, a stale spec makes the prompt and the validator disagree with what the browser renders. |
| **Program validation** | Server only. It needs `@openuidev/lang-core` and the spec. | The client already validates as it renders (`onError`), so nothing to share. |
| **Patch merge** (`mergeStatements`) | Import it on each side from the package you already have: `@openuidev/lang-core` on the server, `@openuidev/react-lang` on the client (it re-exports the same function). | Same function, same result, no shared code needed. Keep both sides on the same OpenUI version. |
| **Prompt pieces** | Server only. Move them into the server. | None; the client never reads them. |
| **UI tool contracts** | **a.** Server owns them; the client calls tools by name only. **b.** Generate JSON Schema on the server (`z.toJSONSchema`) and publish it. **c.** Use MCP: the client discovers tools with `listTools`, including input/output schemas. | Programs call `Query("list_tickets", …)` by name, so the client only needs the names. The demo's REST provider builds its function map from the contract list; its MCP provider just forwards `callTool({ name, arguments })` and needs no list at all. Browser-only tools (the demo's notes) stay in the client. |
| **Request context types** | Duplicate a small interface on each side, or generate it from a JSON Schema. | A few fields (`id`, `program`, `state`, `errors`). Validate on the server anyway: it is input from the browser. |
| **Action-turn encoding** | Client only. | The server sees plain text (the client converts with `toModelText` before sending). |
| **Surface ids** | Server owns the list (it is in the prompt and in tool schemas); the client hard-codes its layout slots. | A mismatch shows up quickly: tools reject an unknown `surfaceId`. |
| **Domain schemas** | Server only. | — |

## Other ways to share

- **Internal npm package.** Publish `@your-org/ui-contracts` with the spec JSON, contracts and types. Clean, but adds a release step between front-end and back-end changes.
- **Monorepo without a shared package.** Let the server import a JSON file from the client folder at build time. Simple; works only if both build from the same checkout.
- **Separate repos, generated artifacts.** Treat the spec and the tool schemas like an API schema (OpenAPI-style): generated by the owner, checked in CI by the consumer.

## Steps for a two-repo setup

1. In the client repo, add a CI step: `openui generate src/openui/library.ts --spec --out dist/library.spec.json`, and publish the file.
2. In the server repo, fetch that file at build time; build the prompt with `generateSystemPrompt({ library: spec, promptOptions })` and the parser with `createParser(spec.schema, spec.root)`.
3. Move prompt options, rules and examples into the server.
4. Use `mergeStatements` from `@openuidev/lang-core` on the server and from `@openuidev/react-lang` on the client.
5. Keep tool contracts on the server; expose them over REST or MCP. The client's `toolProvider` calls by name.
6. Define the per-request context type on both sides and validate it on the server with Zod.

## Pitfalls

- **Version skew.** Pin the same `@openuidev/*` versions on both sides; parser and merge behavior must match.
- **Library changes break saved programs.** Programs are positional. Only append optional props; never reorder or remove them. This matters more when the two sides deploy at different times.
- **The spec is part of your API.** A component renamed in the client is a breaking change for the server's prompt and validator.

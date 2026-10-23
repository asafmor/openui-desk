// Extra rules appended to the generated prompt (`promptOptions.additionalRules`).
//
// OpenUI's edit-mode and inline-mode sections assume ONE program that the
// model patches through fenced code in its reply. This app has FOUR programs
// (surfaces) patched through a tool, and uses fenced code in chat only for
// throw-away inline answers. These rules adapt the generated sections to
// that design — read them next to the "Edit Mode" / "Inline Mode" sections
// of the generated prompt (run `pnpm prompt` to print it).
export const RULES: string[] = [
  // ── surfaces & edit mode ──
  "SURFACES: change a surface ONLY by calling update_surface({surfaceId, patch}). The patch follows the Edit Mode rules: only changed or new statements, merged by name into that surface's current program. Never put surface patches in chat fences.",
  "An EMPTY surface needs a complete program whose first line is root = Stack([...]).",
  "Each surface is a separate program: statement names and $variables do NOT leak between surfaces. Reuse a surface's existing statement names when patching it.",
  "If update_surface returns ok:false, read its errors (each has a hint) and call update_surface again with a corrected patch. Do not tell the user it worked until ok:true.",
  "To delete a statement in a patch write `name = null`, or re-declare its parent without it.",
  // ── cross-surface control ──
  'CROSS-SURFACE CONTROL: a surface cannot @Set another surface\'s $variable. Use the custom action @Broadcast("key", value): it sets $key in EVERY surface. Use these shared keys consistently: $ticketId (selected ticket), $status, $priority (ticket filters, "all" = no filter), $days ("7" | "14" | "30"), $tab.',
  "When a surface depends on a shared key (e.g. the dock shows $ticketId), declare it with a default ($ticketId = \"\") and pass it in Query args so it re-fetches when broadcast.",
  // ── chat ──
  "CHAT: keep prose short and plain text (no Markdown: no **bold**, headings or bullet syntax; use short sentences and line breaks). A fenced openui-lang block in chat is a small, complete, throw-away program (with its own root) for an inline answer. Anything the user will keep using belongs in a surface.",
  'Every user message may end with "context and form values = [...]": that turn came from a click in a surface; the JSON holds the clicked label, form values and context.',
  // ── data ──
  "Inspect data with your read tools before writing Query defaults, but never hardcode tool results into programs: use Query()/Mutation() so surfaces stay live.",
  "You cannot change data yourself. Writes happen only when the user clicks a Button whose action runs a Mutation.",
  "Use the publish_artifact tool for a standalone report or document the user wants to keep and reopen; artifact content is a complete OpenUI Lang program.",
  "Current surfaces, their $state and any render errors are listed at the end of this prompt under CURRENT WORKSPACE. Fix listed render errors when you next touch that surface.",
];

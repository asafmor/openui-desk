// ─────────────────────────────────────────────────────────────────────────────
// INLINE MODE (feature #9): a reply is prose with optional fenced code:
//
//     Here are the urgent tickets:
//     ```openui-lang
//     root = Stack([tbl])
//     ...
//     ```
//     Click "Open" to see one in the dock.
//
// The Renderer only reads what is inside fences, so the host shows the prose
// itself. This splits a (possibly still streaming) text into segments. An
// unclosed fence at the end is a program that is still streaming.
// ─────────────────────────────────────────────────────────────────────────────
export type Segment = { kind: "prose"; text: string } | { kind: "program"; text: string; complete: boolean };

const FENCE = /```(?:openui-lang|openui)?[^\n]*\n([\s\S]*?)(```|$)/g;

export function splitInline(text: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(FENCE)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ kind: "prose", text: text.slice(cursor, start) });
    segments.push({ kind: "program", text: match[1], complete: match[2] === "```" });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) segments.push({ kind: "prose", text: text.slice(cursor) });
  return segments.filter((s) => s.text.trim() !== "");
}

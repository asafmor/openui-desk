// An assistant text part: prose paragraphs + inline programs (inline mode).
import { InlineProgram } from "./InlineProgram";
import { splitInline } from "./split-inline";

export function AssistantText({ text, partKey, streaming }: { text: string; partKey: string; streaming: boolean }) {
  return (
    <>
      {splitInline(text).map((seg, i) =>
        seg.kind === "prose" ? (
          <p key={i} className="chat__prose">
            {seg.text.trim()}
          </p>
        ) : (
          <InlineProgram key={i} stateKey={`${partKey}:${i}`} program={seg.text} streaming={streaming && !seg.complete} />
        ),
      )}
    </>
  );
}

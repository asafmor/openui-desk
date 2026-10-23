// ShareButton — a RESTRICTED ACTION SLOT (feature #6).
//
// Instead of `action()` (any action), the prop is a union of specific action
// refs: our custom @CopyToClipboard and OpenUI's built-in @OpenUrl
// (`steps.OpenUrl.ref`). The prompt prints `share: @CopyToClipboard | @OpenUrl`,
// steering the model to only those two.
//
// ⚠ As of @openuidev/react-lang 1.0.1 this is NOT enforced at runtime: the
// slot still accepts any action. It shapes the prompt and the JSON Schema.
import { defineComponent, steps } from "@openuidev/react-lang";
import { z } from "zod";
import { copyToClipboard } from "../../actions/copy-to-clipboard";
import { useRunAction } from "./useRunAction";

export const ShareButton = defineComponent({
  name: "ShareButton",
  description: "Share something: copy text to the clipboard or open a URL.",
  props: z.object({
    label: z.string(),
    share: z.union([copyToClipboard.ref, steps.OpenUrl.ref]),
  }),
  component: ({ props }) => {
    const run = useRunAction();
    return (
      <button type="button" className="ou-btn ou-btn--ghost" onClick={() => run(props.label, props.share)}>
        ⤴ {props.label}
      </button>
    );
  },
});

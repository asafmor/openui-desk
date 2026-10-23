// Callout — a highlighted message. Handy for conditional UI:
//
//     warn = stats.breached > 0 ? Callout("danger", "SLA breached", stats.breached + " tickets") : null
//
// A `null` child is simply skipped by renderNode.
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Tone } from "./Badge";

export const Callout = defineComponent({
  name: "Callout",
  description: "Highlighted message box with a tone, a title and a body.",
  props: z.object({
    tone: Tone,
    title: z.string(),
    body: z.string().optional(),
  }),
  component: ({ props }) => (
    <div className={`ou-callout ou-tone--${props.tone}`} role="note">
      <strong>{props.title}</strong>
      {props.body ? <p>{props.body}</p> : null}
    </div>
  ),
});

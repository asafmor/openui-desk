// Badge — a small colored label. Its `tone` enum pairs with the custom
// function @Tone (../../functions/tone.ts), which turns a number into a tone:
//
//     Badge("SLA " + t.ageHours + "h", @Tone(t.ageHours, 8, 24))
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Tone = z.enum(["neutral", "info", "success", "warning", "danger"]);

export const Badge = defineComponent({
  name: "Badge",
  description: "Small colored label for statuses and priorities.",
  props: z.object({
    label: z.union([z.string(), z.number()]),
    tone: Tone.optional(),
  }),
  component: ({ props }) => <span className={`ou-badge ou-tone--${props.tone ?? "neutral"}`}>{props.label}</span>,
});

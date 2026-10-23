// TextContent — plain text. The name matches OpenUI's reference library on
// purpose: the generated system prompt's built-in sections (Mutation, Forms…)
// show examples like `TextContent("Saving...")`, so reusing the name keeps
// those examples valid for our custom library.
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const TextContent = defineComponent({
  name: "TextContent",
  description: 'Text. variant: "body" (default), "muted", "heading" or "title".',
  props: z.object({
    // Numbers are accepted so `TextContent(@Count(rows))` works without "" + …
    text: z.union([z.string(), z.number()]),
    variant: z.enum(["body", "muted", "heading", "title"]).optional(),
  }),
  component: ({ props }) => <p className={`ou-text ou-text--${props.variant ?? "body"}`}>{props.text}</p>,
});

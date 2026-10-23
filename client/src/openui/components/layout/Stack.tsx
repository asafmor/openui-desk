// Stack — the library ROOT (see ../../library.ts `root: "Stack"`).
//
// OpenUI basics recap, shown on the simplest component:
//  • `props` is a Zod object. Its KEY ORDER is the positional argument order
//    the model writes: Stack([a, b], "row", "m")  →  {children, direction, gap}.
//  • `description` is printed next to the signature in the system prompt.
//  • `component` receives already-evaluated props plus `renderNode`, which
//    turns child element nodes (or arrays of them) into React elements.
//
// `children: z.array(z.any())` lets any component nest inside a Stack, which
// is how recursive layouts (Stack → Card → Stack …) stay possible without
// circular imports. Components with stricter slots use unions of `.ref`s
// (see Card.tsx).
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Stack = defineComponent({
  name: "Stack",
  description:
    'Flex container and the root of every program. direction "column" (default) or "row"; row stacks wrap.',
  props: z.object({
    children: z.array(z.any()),
    direction: z.enum(["column", "row"]).optional(),
    gap: z.enum(["s", "m", "l"]).optional(),
  }),
  component: ({ props, renderNode }) => (
    <div className={`ou-stack ou-stack--${props.direction ?? "column"} ou-gap--${props.gap ?? "m"}`}>
      {renderNode(props.children)}
    </div>
  ),
});

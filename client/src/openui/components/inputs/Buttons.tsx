// Buttons — a row of buttons (also the `buttons` slot of Form).
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Button } from "./Button";

export const Buttons = defineComponent({
  name: "Buttons",
  description: "Horizontal group of Buttons.",
  props: z.object({ buttons: z.array(Button.ref) }),
  component: ({ props, renderNode }) => <div className="ou-buttons">{renderNode(props.buttons)}</div>,
});

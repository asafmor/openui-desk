// Button — the main way generated UI DOES things.
//
// `action: action().optional()` is react-lang's action prop schema. In the
// prompt it prints as `action?: ActionExpression`, which teaches the model
// to pass one @-action, or several inside Action([...]):
//
//     Button("Refresh", @Run(tickets), "secondary")
//     Button("Create", Action([@Run(create), @Run(tickets), @Reset($title)]))
//     Button("Explain", @ToAssistant("Explain this chart", {chart: "daily"}), "ghost")
//     Button("Copy id", @CopyToClipboard(t.id), "ghost")          ← custom action
import { action, defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { z } from "zod";
import { useRunAction } from "./useRunAction";

export const Button = defineComponent({
  name: "Button",
  description:
    'Button. variant "primary" (default; validates its Form first), "secondary", "ghost" or "danger". Without an action it sends its label to the assistant.',
  props: z.object({
    label: z.string(),
    action: action().optional(),
    variant: z.enum(["primary", "secondary", "ghost", "danger"]).optional(),
  }),
  component: ({ props }) => {
    const run = useRunAction();
    const streaming = useIsStreaming();
    const variant = props.variant ?? "primary";
    return (
      <button
        type="button"
        className={`ou-btn ou-btn--${variant}`}
        disabled={streaming}
        onClick={() => run(props.label, props.action, { validate: variant === "primary" })}
      >
        {props.label}
      </button>
    );
  },
});

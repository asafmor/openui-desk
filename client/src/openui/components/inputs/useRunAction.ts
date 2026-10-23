// useRunAction — how a component fires the action the model gave it (feature #4).
//
// A prop declared with `action()` (see Button.tsx) arrives already evaluated
// as an ActionPlan: `{ steps: [...] }`, one step per @-action:
//
//     Button("Save", Action([@Run(update), @Run(tickets), @Set($open, false), @ToAssistant("Saved")]))
//       → steps: [Run(mutation), Run(query), Set, ToAssistant]
//
// triggerAction(label, formName, plan) executes the steps IN ORDER:
//   • @Run(mutation) is awaited; a failed mutation stops the remaining steps
//   • @Run(query) re-fetches; @Set / @Reset write $state       → handled inside the Renderer
//   • @ToAssistant / @OpenUrl / custom @Actions                  → delivered to <Renderer onAction>
// With no plan, triggerAction(label) sends `continue_conversation` with the label.
//
// Before running anything that writes or talks to the agent, we validate the
// enclosing form (if any) — the same policy as OpenUI's reference Button.
import {
  ACTION_STEPS,
  useFormName,
  useFormValidation,
  useTriggerAction,
  type ActionPlan,
} from "@openuidev/react-lang";

function needsValidation(plan: ActionPlan | undefined): boolean {
  if (!plan?.steps?.length) return true; // a bare submit button
  return plan.steps.some(
    (s) =>
      s.type === ACTION_STEPS.ToAssistant ||
      s.type === "custom_action" ||
      (s.type === ACTION_STEPS.Run && s.refType === "mutation"),
  );
}

export function useRunAction() {
  const trigger = useTriggerAction();
  const formName = useFormName();
  const validation = useFormValidation();

  return (label: string, plan: unknown, opts: { validate?: boolean } = {}) => {
    const actionPlan = plan as ActionPlan | undefined;
    if (opts.validate && validation && needsValidation(actionPlan) && !validation.validateForm()) return;
    trigger(label, formName, actionPlan);
  };
}

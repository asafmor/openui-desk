// Checkbox — a boolean binding. Pairs well with ternaries (feature #2):
//
//     $onlyBreached = false
//     toggle = Checkbox("onlyBreached", "Only breached", $onlyBreached)
//     rows   = $onlyBreached ? @Filter(tickets.rows, "breached", "==", true) : tickets.rows
import { defineComponent, reactive } from "@openuidev/react-lang";
import { z } from "zod";
import { useValidatedField } from "./useValidatedField";

export const Checkbox = defineComponent({
  name: "Checkbox",
  description: "Checkbox with a label. Bind value to a $boolean.",
  props: z.object({
    name: z.string(),
    label: z.string(),
    value: reactive(z.boolean().optional()),
  }),
  component: ({ props }) => {
    const f = useValidatedField<boolean>(props.name, props.value, undefined);
    return (
      <label className="ou-checkbox">
        <input type="checkbox" checked={!!f.value} disabled={f.disabled} onChange={(e) => f.setValue(e.target.checked)} />
        {props.label}
      </label>
    );
  },
});

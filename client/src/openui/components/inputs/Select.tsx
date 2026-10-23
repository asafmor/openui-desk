// Select + SelectItem — dropdown. Same argument order as OpenUI's reference
// library (the prompt's "Interactive Filters" section uses it verbatim):
//
//     $status = "open"
//     filter  = Select("status", [SelectItem("open", "Open"), SelectItem("all", "All")], null, null, $status)
//     tickets = Query("list_tickets", {status: $status}, {rows: []})   ← re-fetches on change
import { defineComponent, reactive } from "@openuidev/react-lang";
import { z } from "zod";
import { rulesSchema } from "./rules";
import { useValidatedField } from "./useValidatedField";

export const SelectItem = defineComponent({
  name: "SelectItem",
  description: "One option of a Select: value and visible label.",
  props: z.object({ value: z.string(), label: z.string() }),
  component: () => null, // rendered by Select
});

export const Select = defineComponent({
  name: "Select",
  description: "Dropdown. Bind value to a $variable to drive filters and Query args.",
  props: z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: rulesSchema,
    value: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const f = useValidatedField<string>(props.name, props.value, props.rules);
    return (
      <select
        className={`ou-input ${f.error ? "has-error" : ""}`}
        id={props.name}
        value={f.value ?? ""}
        disabled={f.disabled}
        onChange={(e) => {
          f.setValue(e.target.value);
          f.validate(e.target.value);
        }}
      >
        {props.placeholder || f.value == null ? <option value="">{props.placeholder ?? "Select…"}</option> : null}
        {props.items.filter(Boolean).map((item) => (
          <option key={item.props.value} value={item.props.value}>
            {item.props.label}
          </option>
        ))}
      </select>
    );
  },
});

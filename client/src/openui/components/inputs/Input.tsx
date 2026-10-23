// Input — text field. Argument order matches OpenUI's reference library,
// because the generated prompt's "Forms" section teaches exactly this call:
//
//     Input("email", "you@company.com", "email", {required: true, email: true}, $email)
//            name      placeholder        type        rules                       value
//
// `value: reactive(...)` makes the last argument a `$binding<string>`.
import { defineComponent, reactive } from "@openuidev/react-lang";
import { z } from "zod";
import { rulesSchema } from "./rules";
import { useValidatedField } from "./useValidatedField";

export const Input = defineComponent({
  name: "Input",
  description: "Text input. Bind value to a $variable to use it in Query args, filters or Mutation args.",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    type: z.enum(["text", "email", "number", "url", "search"]).optional(),
    rules: rulesSchema,
    value: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const f = useValidatedField<string>(props.name, props.value, props.rules);
    return (
      <input
        className={`ou-input ${f.error ? "has-error" : ""}`}
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        placeholder={props.placeholder ?? ""}
        value={f.value ?? ""}
        disabled={f.disabled}
        onChange={(e) => f.setValue(e.target.value)}
        onBlur={(e) => f.validate(e.target.value)}
      />
    );
  },
});

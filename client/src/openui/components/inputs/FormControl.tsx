// FormControl — label + one input + its validation error.
//
// It finds the error by reading the field `name` straight from the child's
// element node (`props.field.props.name`) and looking it up in the Form's
// validation context. That is the general trick for parents that need to
// know something about their (not yet rendered) children.
import { defineComponent, useFormValidation } from "@openuidev/react-lang";
import { z } from "zod";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { Select } from "./Select";

export const FormControl = defineComponent({
  name: "FormControl",
  description: "Labeled form field wrapping one Input, Select or Checkbox.",
  props: z.object({
    label: z.string(),
    field: z.union([Input.ref, Select.ref, Checkbox.ref]),
    hint: z.string().optional(),
  }),
  component: ({ props, renderNode }) => {
    const validation = useFormValidation();
    const name = props.field?.props?.name as string | undefined;
    const error = name ? validation?.errors[name] : undefined;
    const required = (props.field?.props as { rules?: { required?: boolean } })?.rules?.required;
    return (
      <div className="ou-field">
        <label htmlFor={name}>
          {props.label}
          {required ? <span aria-hidden> *</span> : null}
        </label>
        {renderNode(props.field)}
        {error ? <small className="ou-field__error">{error}</small> : props.hint ? <small>{props.hint}</small> : null}
      </div>
    );
  },
});

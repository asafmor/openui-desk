// Form — groups fields under a name and owns their validation (feature #7).
//
//     createForm = Form("create", Buttons([createBtn]), [titleField, priorityField])
//
// Two React contexts from react-lang do the work:
//   • FormNameContext        → fields store their values under this form's
//                              name, and every action fired inside the form
//                              carries `formName` + that form's `formState`
//                              in the ActionEvent sent to onAction.
//   • FormValidationContext  → created by useCreateFormValidation(); fields
//                              register rules, buttons call validateForm().
import {
  defineComponent,
  FormNameContext,
  FormValidationContext,
  useCreateFormValidation,
} from "@openuidev/react-lang";
import { z } from "zod";
import { Buttons } from "./Buttons";
import { FormControl } from "./FormControl";

export const Form = defineComponent({
  name: "Form",
  description: "Form with a name, its buttons and its fields. A primary button validates all fields before its action runs.",
  props: z.object({
    name: z.string(),
    buttons: Buttons.ref,
    fields: z.array(FormControl.ref),
  }),
  component: ({ props, renderNode }) => {
    const validation = useCreateFormValidation();
    return (
      <FormValidationContext.Provider value={validation}>
        <FormNameContext.Provider value={props.name}>
          <form className="ou-form" onSubmit={(e) => e.preventDefault()}>
            {renderNode(props.fields)}
            {renderNode(props.buttons)}
          </form>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});

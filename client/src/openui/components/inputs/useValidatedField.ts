// useValidatedField — the one hook every input in this library uses.
// It combines three OpenUI runtime mechanisms:
//
// 1. useStateField(name, boundValue)            (feature #1, #10)
//      Two-way binding. If the model passed a $variable as the value prop,
//      reads/writes go to that $variable; otherwise the value is stored as
//      form state under `name`, scoped by the nearest Form (useFormName).
//
// 2. useFormValidation() + parseStructuredRules (feature #7)
//      The enclosing Form provides a validation context
//      (see ./Form.tsx → useCreateFormValidation). Each field registers its
//      rules; the Form's primary button calls validateForm() before running
//      its action, and FormControl shows `errors[name]`.
//
// 3. useIsStreaming()                           (feature #11)
//      Inputs are disabled while the program is still streaming, and only
//      register rules once it is complete (rules may still be half-written).
import {
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import { useEffect, useMemo } from "react";

export function useValidatedField<T>(name: string, boundValue: unknown, rules: unknown) {
  const field = useStateField<unknown>(name, boundValue);
  const validation = useFormValidation();
  const streaming = useIsStreaming();
  const parsedRules = useMemo(() => parseStructuredRules(rules), [rules]);

  useEffect(() => {
    if (streaming || !validation || parsedRules.length === 0) return;
    validation.registerField(name, parsedRules, () => field.value);
    return () => validation.unregisterField(name);
  }, [name, field.value, validation, parsedRules, streaming]);

  return {
    value: field.value as T | undefined,
    disabled: streaming,
    error: validation?.errors[name],
    setValue: (next: T) => {
      field.setValue(next);
      validation?.clearFieldError(name);
    },
    validate: (next: unknown) => validation?.validateField(name, next, parsedRules),
  };
}

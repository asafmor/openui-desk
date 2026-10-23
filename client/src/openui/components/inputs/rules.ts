// Validation rules accepted by every input (feature #7).
//
// The model writes them as an object literal:
//     Input("email", "you@co.com", "email", {required: true, email: true})
//
// OpenUI ships the validators (required, email, url, numeric, min, max,
// minLength, maxLength, pattern); we only declare the schema so the prompt
// documents it and the parser type-checks it.
import { z } from "zod";

export const rulesSchema = z
  .object({
    required: z.boolean().optional(),
    email: z.boolean().optional(),
    url: z.boolean().optional(),
    numeric: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  })
  .optional();

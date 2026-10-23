// All custom functions, registered in ../library.ts (`functions: [...]`).
// The generated prompt lists them next to the built-in @functions.
import { duration } from "./duration";
import { percent } from "./percent";
import { shortTime } from "./short-time";
import { priorityTone, tone } from "./tone";

export const customFunctions = [percent, duration, tone, priorityTone, shortTime];

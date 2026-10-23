// CUSTOM ACTION (feature #6): @ToggleTheme() — the generated UI asks the HOST
// to change something that lives OUTSIDE every Renderer (here: the app theme).
//
//     Button("Toggle theme", @ToggleTheme(), "ghost")
//
// Path of a click (same as @Notify / @CopyToClipboard):
//   1. Button → useRunAction runs the chain; @ToggleTheme is not a built-in
//      step, so the Renderer emits ActionEvent { type: "ToggleTheme", params: {} }
//   2. <Renderer onAction> → client/src/actions/handle-action.ts ("ToggleTheme")
//   3. client/src/actions/theme.ts flips <html data-theme>; styles.css swaps tokens
//
// No params: the host owns the current theme, the program just asks to flip it.
import { defineAction } from "@openuidev/react-lang";
import { z } from "zod";

export const toggleTheme = defineAction({
  name: "ToggleTheme",
  description: "Switch the whole app between light and dark theme.",
  params: z.object({}),
});

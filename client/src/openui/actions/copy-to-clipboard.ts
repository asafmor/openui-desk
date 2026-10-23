// CUSTOM ACTION (feature #6): @CopyToClipboard(text)
//
// defineAction declares an @-step the model can put in any action prop:
//
//     Button("Copy id", @CopyToClipboard(t.id), "ghost")
//
// Unlike a custom FUNCTION, the client runtime does not execute it. The
// Renderer turns it into an ActionEvent `{ type: "CopyToClipboard", params:
// { text } }` and hands it to <Renderer onAction>. Our host routes it in
// client/src/actions/handle-action.ts. Because the library knows its
// actions, `onAction`'s event type is a typed union: checking
// `event.type === "CopyToClipboard"` narrows `event.params` to `{ text: string }`.
//
// `copyToClipboard.ref` is also used to build a restricted action slot
// (components/inputs/ShareButton.tsx).
import { defineAction } from "@openuidev/react-lang";
import { z } from "zod";

export const copyToClipboard = defineAction({
  name: "CopyToClipboard",
  description: "Copy text to the user's clipboard.",
  params: z.object({ text: z.string() }),
});

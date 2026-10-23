// CUSTOM ACTION (feature #6): @Notify(message, tone) — host toast.
//
// Typical use: confirm a successful Mutation without asking the agent.
//
//     saveBtn = Button("Save", Action([@Run(update), @Run(tickets), @Notify("Ticket saved", "success")]))
//
// Because @Run(mutation) stops the chain on failure, the toast only shows
// when the save really succeeded.
import { defineAction } from "@openuidev/react-lang";
import { z } from "zod";

export const notify = defineAction({
  name: "Notify",
  description: "Show a short toast to the user.",
  params: z.object({
    message: z.string(),
    tone: z.enum(["info", "success", "warning", "danger"]).optional(),
  }),
});

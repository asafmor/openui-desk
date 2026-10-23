// CUSTOM ACTION (feature #6): @Broadcast(key, value) — CROSS-SURFACE CONTROL.
//
// Every surface is its own <Renderer> with its own $state store, so a button
// in the left rail cannot @Set a $variable of the canvas directly. This
// action bridges them through the host:
//
//     rail:    MenuItem("Urgent queue", @Broadcast("priority", "urgent"))
//     canvas:  tickets = Query("list_tickets", {priority: $priority}, {rows: []})
//
// The host (client/src/workspace/workspace-reducer.ts → "broadcast") writes
// `$priority = "urgent"` into the saved state of EVERY surface. Each
// SurfaceView passes its state back as <Renderer initialState>, and
// react-lang re-applies persisted values whenever initialState changes
// (store.initialize overwrites differing values without a remount). So the
// canvas' $priority changes, and its Query re-fetches — no model involved.
import { defineAction } from "@openuidev/react-lang";
import { z } from "zod";

export const broadcast = defineAction({
  name: "Broadcast",
  description:
    'Set $key to value in EVERY surface (cross-surface control). E.g. @Broadcast("ticketId", t.id) makes the dock show that ticket.',
  params: z.object({
    key: z.string().describe('State name WITHOUT the $, e.g. "ticketId"'),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
});

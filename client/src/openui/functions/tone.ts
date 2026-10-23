// CUSTOM FUNCTIONS (feature #5) that map data to a Badge/Kpi tone.
//
//     Badge(t.priority, @PriorityTone(t.priority))
//     Kpi("Queue", h.queueDepth, null, @Tone(h.queueDepth, 20, 50))
import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod";

export const tone = defineFunction({
  name: "Tone",
  description: 'Threshold → tone: value >= danger → "danger", >= warn → "warning", else "success".',
  params: z.object({ value: z.number(), warn: z.number(), danger: z.number() }),
  returns: z.enum(["success", "warning", "danger"]),
  fn: ({ value, warn, danger }) => (value >= danger ? "danger" : value >= warn ? "warning" : "success"),
});

const PRIORITY_TONES = { low: "neutral", medium: "info", high: "warning", urgent: "danger" } as const;

export const priorityTone = defineFunction({
  name: "PriorityTone",
  description: 'Ticket priority → tone: low neutral, medium info, high warning, urgent danger.',
  params: z.object({ priority: z.string() }),
  returns: z.string(),
  fn: ({ priority }) => PRIORITY_TONES[priority as keyof typeof PRIORITY_TONES] ?? "neutral",
});

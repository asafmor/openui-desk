// ─────────────────────────────────────────────────────────────────────────────
// Domain model for the demo: a tiny support desk (tickets, agents, activity).
//
// These Zod schemas are the single source of truth for data shapes. They are
// used in three places:
//   1. server/src/db/*            → typing the in-memory database
//   2. shared/src/ui-tools/*      → tool input/output contracts, turned into
//                                   JSON Schema for the OpenUI system prompt
//                                   (see shared/src/ui-tools/descriptors.ts)
//   3. server/src/routes/*        → validating untrusted tool arguments that
//                                   arrive from the browser (trust boundary)
// ─────────────────────────────────────────────────────────────────────────────
import { z } from "zod";

export const TicketStatus = z.enum(["open", "pending", "resolved", "closed"]);
export const TicketPriority = z.enum(["low", "medium", "high", "urgent"]);

export const Ticket = z.object({
  id: z.string().describe('Ticket id, e.g. "T-1007"'),
  title: z.string(),
  customer: z.string(),
  priority: TicketPriority,
  status: TicketStatus,
  assignee: z.string().describe('Agent name, or "unassigned"'),
  createdAt: z.string().describe("ISO date-time"),
  ageHours: z.number().describe("Hours since the ticket was created"),
  slaHours: z.number().describe("Hours allowed before the SLA is breached"),
  breached: z.boolean().describe("true when an open/pending ticket is older than its SLA"),
});

export const Activity = z.object({
  id: z.string(),
  at: z.string().describe("ISO date-time"),
  ticketId: z.string(),
  kind: z.enum(["created", "updated", "escalated", "commented"]),
  text: z.string(),
});

export const SupportAgent = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  open: z.number().describe("Open tickets currently assigned"),
});

export type Ticket = z.infer<typeof Ticket>;
export type Activity = z.infer<typeof Activity>;
export type SupportAgent = z.infer<typeof SupportAgent>;

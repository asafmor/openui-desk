// ─────────────────────────────────────────────────────────────────────────────
// UI-SIDE TOOL CONTRACTS  (feature #3 "Query & Mutation", feature #16 "tools")
//
// A "UI-side tool" is a function the *generated interface* calls by itself:
//
//     tickets = Query("list_tickets", {status: $status}, {rows: []})
//     create  = Mutation("create_ticket", {title: $title, ...})
//
// The model never runs these during its turn; the browser's <Renderer
// toolProvider> runs them when the program needs data (see
// client/src/openui/tool-provider/*). Each contract below is used:
//   - by the SERVER prompt: name + description + JSON Schema of input/output
//     teach the model which Query()/Mutation() calls exist
//     (shared/src/ui-tools/descriptors.ts → generateSystemPrompt `tools`)
//   - by the SERVER routes: `input` validates the untrusted arguments that
//     arrive from the browser (server/src/routes/ui-tools-route.ts)
//   - by the AGENT: contracts with `agentSide: true` are ALSO registered as
//     normal Mastra agent tools, so the model can inspect real data before
//     writing UI ("Data Workflow" section of the OpenUI prompt). This is the
//     "agent-side vs UI-side" distinction from the docs: same function, two
//     callers (server/src/mastra/tools/agent-data-tools.ts).
// ─────────────────────────────────────────────────────────────────────────────
import { z } from "zod";
import { Activity, SupportAgent, Ticket, TicketPriority, TicketStatus } from "../domain/schemas";

export interface UiToolContract<I extends z.ZodObject = z.ZodObject, O extends z.ZodType = z.ZodType> {
  name: string;
  /** query = read (used with Query), mutation = write (used with Mutation + @Run). */
  kind: "query" | "mutation";
  description: string;
  input: I;
  output: O;
  /** Also give this tool to the agent, so it can look at data during its turn. */
  agentSide?: boolean;
}

// Tiny helper so every contract keeps its precise generic types.
const tool = <I extends z.ZodObject, O extends z.ZodType>(c: UiToolContract<I, O>) => c;

// "all" lets a <Select> bound to $status show every ticket. $variables hold
// plain strings, so filters use string sentinels instead of null.
const StatusFilter = z.enum([...TicketStatus.options, "all"]);
const PriorityFilter = z.enum([...TicketPriority.options, "all"]);

// ── Queries (read-only) ─────────────────────────────────────────────────────

export const listTickets = tool({
  name: "list_tickets",
  kind: "query",
  agentSide: true,
  description: "Search tickets, newest first. All filters are optional.",
  input: z.object({
    status: StatusFilter.optional(),
    priority: PriorityFilter.optional(),
    assignee: z.string().optional().describe('Agent name, "unassigned" or "all"'),
    search: z.string().optional().describe("Case-insensitive match on title or customer"),
    limit: z.number().optional().describe("Max rows, default 50"),
  }),
  output: z.object({ rows: z.array(Ticket), total: z.number() }),
});

export const getTicket = tool({
  name: "get_ticket",
  kind: "query",
  agentSide: true,
  // Not nullable on purpose: OpenUI derives the Query-defaults hint from the
  // output schema, and an object default ({id: "", title: "", …}) lets
  // programs read fields safely before data arrives.
  description: 'One ticket with its activity log. For an unknown or empty id, ticket.id is "".',
  input: z.object({ id: z.string() }),
  output: z.object({ ticket: Ticket, activity: z.array(Activity) }),
});

export const ticketStats = tool({
  name: "ticket_stats",
  kind: "query",
  agentSide: true,
  description: "Desk KPIs and daily series for charts over the last N days.",
  input: z.object({ days: z.string().optional().describe('Window in days as a string: "7", "14" or "30"') }),
  output: z.object({
    open: z.number(),
    pending: z.number(),
    breached: z.number(),
    resolved: z.number().describe("Resolved or closed inside the window"),
    byStatus: z.array(z.object({ status: z.string(), count: z.number() })),
    byPriority: z.array(z.object({ priority: z.string(), count: z.number() })),
    daily: z.array(z.object({ day: z.string(), created: z.number(), resolved: z.number() })),
  }),
});

export const listAgents = tool({
  name: "list_agents",
  kind: "query",
  agentSide: true,
  description: "Support agents with their open ticket load.",
  input: z.object({}),
  output: z.object({ rows: z.array(SupportAgent) }),
});

export const recentActivity = tool({
  name: "recent_activity",
  kind: "query",
  description: "Latest activity across the desk, newest first. Good with a refresh interval.",
  input: z.object({ limit: z.number().optional() }),
  output: z.object({ rows: z.array(Activity) }),
});

export const systemHealth = tool({
  name: "system_health",
  kind: "query",
  description: "Live queue health. Values change on every call, so use a refresh interval (e.g. 5).",
  input: z.object({}),
  output: z.object({
    queueDepth: z.number(),
    p95LatencyMs: z.number(),
    errorRate: z.number().describe("Percent, e.g. 0.8"),
    checkedAt: z.string().describe("ISO date-time"),
  }),
});

// ── Mutations (side effects; only run when the user clicks) ────────────────

export const createTicket = tool({
  name: "create_ticket",
  kind: "mutation",
  description: "Create a ticket. Returns the new ticket.",
  input: z.object({
    title: z.string().min(3),
    customer: z.string().min(1),
    priority: TicketPriority,
  }),
  output: z.object({ ticket: Ticket }),
});

export const updateTicket = tool({
  name: "update_ticket",
  kind: "mutation",
  description: "Change status, priority and/or assignee of a ticket. Omitted fields stay as they are.",
  input: z.object({
    id: z.string(),
    status: TicketStatus.optional(),
    priority: TicketPriority.optional(),
    assignee: z.string().optional(),
  }),
  output: z.object({ ticket: Ticket }),
});

export const escalateTicket = tool({
  name: "escalate_ticket",
  kind: "mutation",
  description: "Escalate: sets priority to urgent and logs the reason. A side effect visible in recent_activity.",
  input: z.object({ id: z.string(), reason: z.string().min(3) }),
  output: z.object({ ticket: Ticket }),
});

export const addComment = tool({
  name: "add_comment",
  kind: "mutation",
  description: "Add an internal comment to a ticket's activity log.",
  input: z.object({ id: z.string(), text: z.string().min(1) }),
  output: z.object({ activity: Activity }),
});

/** Every server-backed UI tool, in prompt order. */
export const SERVER_UI_TOOLS = [
  listTickets,
  getTicket,
  ticketStats,
  listAgents,
  recentActivity,
  systemHealth,
  createTicket,
  updateTicket,
  escalateTicket,
  addComment,
] as const;


// ── Browser-only tools ──────────────────────────────────────────────────────
// A toolProvider is just a map of async functions, so a "tool" does not have
// to call a server. These two read/write notes kept INSIDE the workspace
// (so they are exported/imported with it). Implemented in
// client/src/openui/tool-provider/local-tools.ts.

export const NoteSchema = z.object({ id: z.string(), text: z.string(), at: z.string() });

export const listNotes = tool({
  name: "list_notes",
  kind: "query",
  description: "The user's private scratch notes stored in this workspace (browser-only, newest first).",
  input: z.object({}),
  output: z.object({ rows: z.array(NoteSchema) }),
});

export const addNote = tool({
  name: "add_note",
  kind: "mutation",
  description: "Append a scratch note to this workspace (browser-only).",
  input: z.object({ text: z.string().min(1) }),
  output: z.object({ note: NoteSchema }),
});

export const LOCAL_UI_TOOLS = [listNotes, addNote] as const;

/** Everything the model may use in Query()/Mutation(). */
export const ALL_UI_TOOLS = [...SERVER_UI_TOOLS, ...LOCAL_UI_TOOLS];

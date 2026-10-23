// Example programs for the prompt (`promptOptions.toolExamples`, shown
// because tools are configured). Examples teach shapes better than rules,
// but a WRONG example causes regressions — every example here is parsed
// against the real library spec by `pnpm check` (scripts/check-programs.ts).
export const TOOL_EXAMPLES: string[] = [
  // 1. filterable table + broadcast selection (canvas)
  `root = Stack([Card([controls, tbl], "Tickets")])
$status = "open"
$search = ""
tickets = Query("list_tickets", {status: $status, search: $search}, {rows: [], total: 0})
controls = Stack([FormControl("Status", Select("status", [SelectItem("open", "Open"), SelectItem("pending", "Pending"), SelectItem("all", "All")], null, null, $status)), FormControl("Search", Input("search", "Title or customer", "search", null, $search))], "row")
tbl = Table([Col("Id", tickets.rows.id), Col("Title", tickets.rows.title), Col("Priority", @Each(tickets.rows, "t", Badge(t.priority, @PriorityTone(t.priority)))), Col("Age", @Each(tickets.rows, "t", TextContent(@Duration(t.ageHours), "muted"))), Col("", @Each(tickets.rows, "t", Button("Open", @Broadcast("ticketId", t.id), "ghost")))], "No tickets match.")`,

  // 2. detail panel driven by a broadcast key + mutation chain (dock)
  `root = Stack([detail])
$ticketId = ""
data = Query("get_ticket", {id: $ticketId}, {ticket: {title: "", status: "", priority: ""}, activity: []})
escalate = Mutation("escalate_ticket", {id: $ticketId, reason: "Customer impact"})
detail = $ticketId == "" ? TextContent("Select a ticket to see it here.", "muted") : Card([Stack([Badge(data.ticket.status), Badge(data.ticket.priority, @PriorityTone(data.ticket.priority))], "row"), actions], data.ticket.title)
actions = Buttons([Button("Escalate", Action([@Run(escalate), @Run(data), @Notify("Escalated", "warning")]), "danger"), Button("Summarize", @ToAssistant("Summarize this ticket", {ticketId: $ticketId}), "ghost")])`,

  // 3. KPI strip with refresh interval and custom functions (top)
  `root = Stack([open, breached, queue], "row")
stats = Query("ticket_stats", {days: "7"}, {open: 0, pending: 0, breached: 0, resolved: 0, byStatus: [], byPriority: [], daily: []}, 30)
health = Query("system_health", {}, {queueDepth: 0, p95LatencyMs: 0, errorRate: 0, checkedAt: ""}, 5)
open = Kpi("Open", stats.open)
breached = Kpi("SLA breached", stats.breached, @Percent(stats.breached, stats.open + stats.pending) + " of active", stats.breached > 0 ? "danger" : "success")
queue = Kpi("Queue", health.queueDepth, health.p95LatencyMs + " ms p95", @Tone(health.queueDepth, 15, 25))`,
];

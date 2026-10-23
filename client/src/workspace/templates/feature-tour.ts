// ─────────────────────────────────────────────────────────────────────────────
// FEATURE TOUR — hand-written programs for the four surfaces. No model
// needed: load this template and every language feature is live. Then ask
// the agent to evolve it. Each program is validated by `pnpm check`.
//
// Look for these features (numbers match the README feature map):
//   #1 $state & binding      $status, $days, $tab, $showEdit …
//   #2 expressions/builtins  @Filter @Sort @Count @Avg @Each, pluck, ternaries
//   #3 Query/Mutation        list_tickets, ticket_stats (refresh 30s), system_health (5s)
//   #4 action chains         Action([@Run(m), @Run(q), @Reset(..), @Set(..), @Notify(..)])
//   #5 custom functions      @Percent @Duration @Tone @PriorityTone @ShortTime
//   #6 custom actions        @Broadcast @CopyToClipboard @Notify, ShareButton slot
//   #7 forms & validation    create/edit/comment/notes forms with rules
//   #11 streaming-aware      HtmlFrame (Lab tab), Kpi dims while loading
//   browser-only tools       list_notes / add_note in the rail
// ─────────────────────────────────────────────────────────────────────────────
import type { SurfaceId } from "@demo/shared/surfaces";

const top = `root = Stack([open, pending, breached, resolved, queue, latency, window], "row", "s")
$days = "14"
stats = Query("ticket_stats", {days: $days}, {open: 0, pending: 0, breached: 0, resolved: 0, byStatus: [], byPriority: [], daily: []}, 30)
health = Query("system_health", {}, {queueDepth: 0, p95LatencyMs: 0, errorRate: 0, checkedAt: ""}, 5)
open = Kpi("Open", stats.open, "refreshes every 30s")
pending = Kpi("Pending", stats.pending)
breached = Kpi("SLA breached", stats.breached, @Percent(stats.breached, stats.open + stats.pending) + " of active", stats.breached > 0 ? "danger" : "success")
resolved = Kpi("Resolved", stats.resolved, "last " + $days + " days", "success")
queue = Kpi("Queue depth", health.queueDepth, "live · every 5s", @Tone(health.queueDepth, 15, 25))
latency = Kpi("p95 latency", health.p95LatencyMs + " ms", "errors " + health.errorRate + "%", @Tone(health.p95LatencyMs, 300, 370))
window = Badge("window " + $days + "d", "info")`;

const rail = `root = Stack([title, views, windowCard, quick, notesCard])
title = TextContent("Desk navigation", "heading")
views = Menu("Saved views", [MenuItem("Urgent & open", Action([@Broadcast("status", "open"), @Broadcast("priority", "urgent"), @Broadcast("tab", "tickets")]), "open · urgent"), MenuItem("Waiting on customer", Action([@Broadcast("status", "pending"), @Broadcast("priority", "all"), @Broadcast("tab", "tickets")]), "pending"), MenuItem("Everything", Action([@Broadcast("status", "all"), @Broadcast("priority", "all"), @Broadcast("tab", "tickets")])), MenuItem("Overview charts", @Broadcast("tab", "overview"))])
$days = "14"
windowCard = Card([Stack([Select("days", [SelectItem("7", "Last 7 days"), SelectItem("14", "Last 14 days"), SelectItem("30", "Last 30 days")], null, null, $days), Button("Apply to all surfaces", @Broadcast("days", $days), "secondary")])], "Time window")
quick = Card([Stack([Button("What's urgent?", @ToAssistant("What needs my attention right now?", {source: "rail"}), "ghost"), ShareButton("OpenUI docs", @OpenUrl("https://www.openui.com/docs"))])], "Quick actions")
notes = Query("list_notes", {}, {rows: []})
$note = ""
saveNote = Mutation("add_note", {text: $note})
notesForm = Form("notes", Buttons([Button("Add note", Action([@Run(saveNote), @Run(notes), @Reset($note), @Notify("Saved by a browser-only tool", "success")]))]), [FormControl("Scratch note", Input("note", "Remember to…", "text", {required: true, minLength: 3}, $note))])
notesCard = Card([notesForm, Table([Col("Note", notes.rows.text)], "No notes yet.")], "Notes")`;

const canvas = `root = Stack([tabs])
$tab = "overview"
tabs = Tabs([overviewTab, ticketsTab, agentsTab, labTab], $tab)
$days = "14"
stats = Query("ticket_stats", {days: $days}, {open: 0, pending: 0, breached: 0, resolved: 0, byStatus: [], byPriority: [], daily: []})
breachWarning = stats.breached > 0 ? Callout("danger", stats.breached + " active tickets breached their SLA", "Use the Urgent view in the rail to triage them.") : Callout("success", "All active tickets are within SLA")
overviewTab = TabItem("overview", "Overview", [breachWarning, Stack([Card([BarChart(stats.daily.day, [Series("Created", stats.daily.created), Series("Resolved", stats.daily.resolved)])], "Created vs resolved per day"), Card([PieChart(stats.byStatus.status, stats.byStatus.count)], "By status")], "row"), Card([LineChart(stats.daily.day, [Series("Created", stats.daily.created)])], "Intake trend"), Buttons([Button("Explain these charts", @ToAssistant("Explain what these charts say about the desk", {days: $days}), "ghost")])])
$status = "open"
$priority = "all"
$search = ""
$onlyBreached = false
tickets = Query("list_tickets", {status: $status, priority: $priority, search: $search}, {rows: [], total: 0})
visible = $onlyBreached ? @Filter(tickets.rows, "breached", "==", true) : tickets.rows
sorted = @Sort(visible, "ageHours", "desc")
filters = Stack([FormControl("Status", Select("status", [SelectItem("open", "Open"), SelectItem("pending", "Pending"), SelectItem("resolved", "Resolved"), SelectItem("closed", "Closed"), SelectItem("all", "All")], null, null, $status)), FormControl("Priority", Select("priority", [SelectItem("all", "All"), SelectItem("urgent", "Urgent"), SelectItem("high", "High"), SelectItem("medium", "Medium"), SelectItem("low", "Low")], null, null, $priority)), FormControl("Search", Input("search", "Title or customer", "search", null, $search)), FormControl("Client-side filter", Checkbox("onlyBreached", "Only SLA breached", $onlyBreached))], "row")
summary = TextContent(@Count(sorted) + " of " + tickets.total + " tickets" + (@Count(sorted) > 0 ? " · avg age " + @Duration(@Avg(sorted.ageHours)) : ""), "muted")
toolbar = Stack([Button("+ New ticket", @Set($showCreate, true)), Button("Refresh", @Run(tickets), "secondary"), summary], "row")
tbl = Table([Col("Id", sorted.id), Col("Title", sorted.title), Col("Customer", sorted.customer), Col("Priority", @Each(sorted, "t", Badge(t.priority, @PriorityTone(t.priority)))), Col("Age", @Each(sorted, "t", Badge(@Duration(t.ageHours), t.breached ? "danger" : "neutral"))), Col("Assignee", sorted.assignee), Col("", @Each(sorted, "t", Buttons([Button("Open", @Broadcast("ticketId", t.id), "ghost"), Button("Edit", Action([@Set($editId, t.id), @Set($editStatus, t.status), @Set($editPriority, t.priority), @Set($editAssignee, t.assignee), @Set($showEdit, true)]), "ghost")])))], "No tickets match these filters.")
$showCreate = false
$newTitle = ""
$newCustomer = ""
$newPriority = "medium"
createTicket = Mutation("create_ticket", {title: $newTitle, customer: $newCustomer, priority: $newPriority})
createModal = Modal("New ticket", $showCreate, [Form("create", Buttons([Button("Create", Action([@Run(createTicket), @Run(tickets), @Reset($newTitle, $newCustomer, $newPriority), @Set($showCreate, false), @Notify("Ticket created", "success")])), Button("Cancel", @Set($showCreate, false), "secondary")]), [FormControl("Title", Input("newTitle", "What is broken?", "text", {required: true, minLength: 3}, $newTitle)), FormControl("Customer", Input("newCustomer", "Acme", "text", {required: true}, $newCustomer)), FormControl("Priority", Select("newPriority", [SelectItem("low", "Low"), SelectItem("medium", "Medium"), SelectItem("high", "High"), SelectItem("urgent", "Urgent")], null, {required: true}, $newPriority))]), createTicket.status == "error" ? Callout("danger", "Create failed", createTicket.error) : null])
$showEdit = false
$editId = ""
$editStatus = "open"
$editPriority = "medium"
$editAssignee = ""
agents = Query("list_agents", {}, {rows: []})
updateTicket = Mutation("update_ticket", {id: $editId, status: $editStatus, priority: $editPriority, assignee: $editAssignee})
editModal = Modal("Edit " + $editId, $showEdit, [Form("edit", Buttons([Button("Save", Action([@Run(updateTicket), @Run(tickets), @Set($showEdit, false), @Notify("Saved " + $editId, "success")])), Button("Cancel", @Set($showEdit, false), "secondary")]), [FormControl("Status", Select("editStatus", [SelectItem("open", "Open"), SelectItem("pending", "Pending"), SelectItem("resolved", "Resolved"), SelectItem("closed", "Closed")], null, {required: true}, $editStatus)), FormControl("Priority", Select("editPriority", [SelectItem("low", "Low"), SelectItem("medium", "Medium"), SelectItem("high", "High"), SelectItem("urgent", "Urgent")], null, {required: true}, $editPriority)), FormControl("Assignee", Select("editAssignee", @Each(agents.rows, "a", SelectItem(a.name, a.name + " · " + a.open + " open")), "Pick an agent", null, $editAssignee))]), updateTicket.status == "error" ? Callout("danger", "Save failed", updateTicket.error) : null])
ticketsTab = TabItem("tickets", "Tickets", [filters, toolbar, tbl, createModal, editModal])
agentsTab = TabItem("agents", "Agents", [Card([Table([Col("Agent", agents.rows.name), Col("Team", agents.rows.team), Col("Open load", @Each(agents.rows, "a", Badge(a.open, @Tone(a.open, 4, 6))), "right")])], "Team load"), Card([BarChart(agents.rows.name, [Series("Open tickets", agents.rows.open)])], "Open tickets per agent")])
labTab = TabItem("lab", "Lab", [Callout("info", "Open-ended HTML", "HtmlFrame renders model-written HTML in a sandboxed iframe. While a program streams it shows the incoming source instead."), HtmlFrame("SLA heartbeat", "<style>body{font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:#0b1020;color:#fff}.dot{width:70px;height:70px;border-radius:50%;background:#f43f5e;animation:p 1.2s infinite}@keyframes p{50%{transform:scale(1.3);opacity:.5}}</style><div><div class='dot'></div><p>SLA heartbeat</p></div>", 220)])`;

const dock = `root = Stack([detail])
$ticketId = ""
data = Query("get_ticket", {id: $ticketId}, {ticket: {id: "", title: "", status: "", priority: "", customer: "", assignee: "", ageHours: 0, slaHours: 0, breached: false}, activity: []})
feed = Query("recent_activity", {limit: 6}, {rows: []}, 10)
detail = $ticketId == "" ? emptyView : ticketView
emptyView = Stack([TextContent("Click Open on a ticket in the canvas to show it here (cross-surface @Broadcast). Meanwhile, live activity (refresh 10s):", "muted"), Table([Col("When", @Each(feed.rows, "r", TextContent(@ShortTime(r.at), "muted"))), Col("Ticket", feed.rows.ticketId), Col("What", feed.rows.text)], "No activity yet.")])
ticketView = Stack([header, Stack([info, commentCard], "row")])
escalate = Mutation("escalate_ticket", {id: $ticketId, reason: "Escalated from the dock"})
header = Stack([TextContent(data.ticket.id + " · " + data.ticket.title, "heading"), Badge(data.ticket.status, "info"), Badge(data.ticket.priority, @PriorityTone(data.ticket.priority)), data.ticket.breached ? Badge("SLA breached", "danger") : null, Buttons([Button("Escalate", Action([@Run(escalate), @Run(data), @Notify("Escalated " + $ticketId, "warning")]), "danger"), Button("Summarize", @ToAssistant("Summarize this ticket and suggest a next step", {ticketId: $ticketId}), "secondary"), Button("Copy id", @CopyToClipboard($ticketId), "ghost"), Button("Close", @Set($ticketId, ""), "ghost")])], "row")
info = Card([Table([Col("Field", ["Customer", "Assignee", "Age", "SLA"]), Col("Value", [data.ticket.customer, data.ticket.assignee, @Duration(data.ticket.ageHours), data.ticket.slaHours + "h"])]), Table([Col("Activity", data.activity.text), Col("Kind", data.activity.kind)], "No activity.")], "Details")
$comment = ""
comment = Mutation("add_comment", {id: $ticketId, text: $comment})
commentCard = Card([Form("comment", Buttons([Button("Add comment", Action([@Run(comment), @Run(data), @Reset($comment)]))]), [FormControl("Internal comment", Input("comment", "Write a note for the team", "text", {required: true}, $comment))])], "Comment")`;

export const FEATURE_TOUR: Record<SurfaceId, string> = { top, rail, canvas, dock };

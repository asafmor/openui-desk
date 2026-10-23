// ─────────────────────────────────────────────────────────────────────────────
// In-memory "database" for the support desk. Plain functions over arrays.
// It resets on every server restart (good enough for a learning demo).
//
// Each exported function backs one UI tool (see ../ui-tools/handlers.ts).
// ─────────────────────────────────────────────────────────────────────────────
import type { Activity, Ticket } from "@demo/shared/domain/schemas";
import { AGENTS, SEED_TICKETS } from "./seed";

const SLA_HOURS = { urgent: 4, high: 8, medium: 24, low: 72 } as const;
const HOUR = 3_600_000;

interface StoredTicket extends Omit<Ticket, "ageHours" | "breached" | "slaHours"> {
  resolvedAt?: string;
}

let nextId = 1001;
const tickets: StoredTicket[] = SEED_TICKETS.map((s) => ({
  id: `T-${nextId++}`,
  title: s.title,
  customer: s.customer,
  priority: s.priority,
  status: s.status,
  assignee: s.assignee,
  createdAt: new Date(Date.now() - s.hoursAgo * HOUR).toISOString(),
  resolvedAt:
    s.status === "resolved" || s.status === "closed"
      ? new Date(Date.now() - (s.hoursAgo / 2) * HOUR).toISOString()
      : undefined,
}));

const activity: Activity[] = tickets.map((t, i) => ({
  id: `A-${i + 1}`,
  at: t.createdAt,
  ticketId: t.id,
  kind: "created",
  text: `${t.customer} opened "${t.title}"`,
}));

// ── helpers ─────────────────────────────────────────────────────────────────

/** Derived fields are computed on read, so they are always current. */
function view(t: StoredTicket): Ticket {
  const ageHours = Math.round(((Date.now() - Date.parse(t.createdAt)) / HOUR) * 10) / 10;
  const slaHours = SLA_HOURS[t.priority];
  const active = t.status === "open" || t.status === "pending";
  return { ...t, ageHours, slaHours, breached: active && ageHours > slaHours };
}

function log(ticketId: string, kind: Activity["kind"], text: string): Activity {
  const entry = { id: `A-${activity.length + 1}`, at: new Date().toISOString(), ticketId, kind, text };
  activity.unshift(entry);
  return entry;
}

function find(id: string): StoredTicket {
  const t = tickets.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown ticket ${id}`);
  return t;
}

const matches = (filter: string | undefined, value: string) => !filter || filter === "all" || filter === value;

// ── queries ─────────────────────────────────────────────────────────────────

export function listTickets(f: { status?: string; priority?: string; assignee?: string; search?: string; limit?: number }) {
  const q = f.search?.trim().toLowerCase();
  const rows = tickets
    .map(view)
    .filter((t) => matches(f.status, t.status) && matches(f.priority, t.priority) && matches(f.assignee, t.assignee))
    .filter((t) => !q || t.title.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { rows: rows.slice(0, f.limit ?? 50), total: rows.length };
}

const EMPTY_TICKET: Ticket = {
  id: "", title: "", customer: "", priority: "low", status: "open", assignee: "",
  createdAt: "", ageHours: 0, slaHours: 0, breached: false,
};

export function getTicket(id: string) {
  const t = tickets.find((x) => x.id === id);
  return { ticket: t ? view(t) : EMPTY_TICKET, activity: activity.filter((a) => a.ticketId === id).slice(0, 20) };
}

export function ticketStats(days: number) {
  const all = tickets.map(view);
  const since = Date.now() - days * 24 * HOUR;
  const count = <K extends string>(key: "status" | "priority", values: readonly K[]) =>
    values.map((v) => ({ [key]: v, count: all.filter((t) => t[key] === v).length }));
  const daily = Array.from({ length: days }, (_, i) => {
    const start = since + i * 24 * HOUR;
    const inDay = (iso?: string) => !!iso && Date.parse(iso) >= start && Date.parse(iso) < start + 24 * HOUR;
    return {
      day: new Date(start).toISOString().slice(5, 10), // "MM-DD"
      created: tickets.filter((t) => inDay(t.createdAt)).length,
      resolved: tickets.filter((t) => inDay(t.resolvedAt)).length,
    };
  });
  return {
    open: all.filter((t) => t.status === "open").length,
    pending: all.filter((t) => t.status === "pending").length,
    breached: all.filter((t) => t.breached).length,
    resolved: tickets.filter((t) => t.resolvedAt && Date.parse(t.resolvedAt) >= since).length,
    byStatus: count("status", ["open", "pending", "resolved", "closed"]) as { status: string; count: number }[],
    byPriority: count("priority", ["low", "medium", "high", "urgent"]) as { priority: string; count: number }[],
    daily,
  };
}

export function listAgents() {
  return {
    rows: AGENTS.map((a) => ({
      ...a,
      open: tickets.filter((t) => t.assignee === a.name && (t.status === "open" || t.status === "pending")).length,
    })),
  };
}

export const recentActivity = (limit = 10) => ({ rows: activity.slice(0, limit) });

/** Random-walk metrics: different on every call, for Query refresh intervals. */
let depth = 12;
export function systemHealth() {
  depth = Math.max(0, depth + Math.round(Math.random() * 8 - 4));
  return {
    queueDepth: depth,
    p95LatencyMs: 180 + Math.round(Math.random() * 220),
    errorRate: Math.round(Math.random() * 25) / 10,
    checkedAt: new Date().toISOString(),
  };
}

// ── mutations ───────────────────────────────────────────────────────────────

export function createTicket(input: { title: string; customer: string; priority: Ticket["priority"] }) {
  const t: StoredTicket = {
    id: `T-${nextId++}`,
    ...input,
    status: "open",
    assignee: "unassigned",
    createdAt: new Date().toISOString(),
  };
  tickets.unshift(t);
  log(t.id, "created", `${t.customer} opened "${t.title}"`);
  return { ticket: view(t) };
}

export function updateTicket(input: { id: string; status?: Ticket["status"]; priority?: Ticket["priority"]; assignee?: string }) {
  const t = find(input.id);
  const changes = (["status", "priority", "assignee"] as const).filter((k) => input[k] !== undefined && input[k] !== t[k]);
  for (const k of changes) Object.assign(t, { [k]: input[k] });
  if (changes.includes("status") && (t.status === "resolved" || t.status === "closed")) t.resolvedAt = new Date().toISOString();
  if (changes.length) log(t.id, "updated", changes.map((k) => `${k} → ${t[k]}`).join(", "));
  return { ticket: view(t) };
}

export function escalateTicket(id: string, reason: string) {
  const t = find(id);
  t.priority = "urgent";
  if (t.status !== "open") t.status = "open";
  log(t.id, "escalated", `Escalated: ${reason}`);
  return { ticket: view(t) };
}

export function addComment(id: string, text: string) {
  find(id);
  return { activity: log(id, "commented", text) };
}

// ─────────────────────────────────────────────────────────────────────────────
// SURFACES = the long-lived interfaces around the chat ("extension points").
//
// Each surface is one independent OpenUI program rendered by its own
// <Renderer>. Surfaces outlive chat turns: the agent changes them with the
// `update_surface` tool (edit-mode patches), the user changes their state by
// interacting, and the whole set is saved/exported as a workspace.
//
//   ┌──────────────── top ─────────────────┐
//   │ rail │   chat   │      canvas        │
//   │      │          ├────────────────────┤
//   │      │          │       dock         │
//   └──────┴──────────┴────────────────────┘
//
// The descriptions are injected into the agent's prompt so it knows what each
// surface is for (server/src/mastra/prompt/surface-context.ts).
// ─────────────────────────────────────────────────────────────────────────────

export const SURFACE_IDS = ["top", "rail", "canvas", "dock"] as const;
export type SurfaceId = (typeof SURFACE_IDS)[number];

export const SURFACES: Record<SurfaceId, { title: string; purpose: string }> = {
  top: {
    title: "Top strip",
    purpose:
      "A thin horizontal strip across the top: 3-6 compact KPIs or status badges in ONE row (Stack direction row). No tables, no forms, no charts taller than a sparkline.",
  },
  rail: {
    title: "Left rail",
    purpose:
      "A narrow (240px) vertical column of navigation: menus, saved views, quick filters and quick actions that CONTROL other surfaces via @Broadcast. Keep it compact.",
  },
  canvas: {
    title: "Main canvas",
    purpose:
      "The large primary area: dashboards, data tables, charts, tabs, CRUD forms and modals.",
  },
  dock: {
    title: "Bottom dock",
    purpose:
      "A wide, short secondary panel under the canvas: the detail of the selected item ($ticketId), an activity log, or a quick form.",
  },
};

export function isSurfaceId(value: unknown): value is SurfaceId {
  return typeof value === "string" && (SURFACE_IDS as readonly string[]).includes(value);
}

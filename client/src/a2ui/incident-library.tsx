// ─────────────────────────────────────────────────────────────────────────────
// LIBRARY COMPOSITION with extend() (feature #12), used by the A2UI panel.
//
// `library.extend({...})` derives a NEW library; the base stays untouched.
// This one shows all three component verbs:
//   • add + slots  → IncidentClock joins the `Card.children` union, so it is
//                    only valid inside a Card (see components/layout/Card.tsx)
//   • override     → a different Badge (same name "Badge"), pulsing; every
//                    parent that referenced Badge now points at this one
//   • remove       → HtmlFrame and Modal are dropped from the library and
//                    from every parent union / component group
// plus `actions.add` for a surface-specific action.
//
// Create derived libraries at MODULE scope: parsers are memoized by library
// identity, so building one inside a render would re-parse every time.
// ─────────────────────────────────────────────────────────────────────────────
import { defineAction, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Tone } from "../openui/components/content/Badge";
import { library } from "../openui/library";

const IncidentClock = defineComponent({
  name: "IncidentClock",
  description: "Large elapsed-time counter for an incident.",
  props: z.object({ seconds: z.number(), label: z.string().optional() }),
  component: ({ props }) => {
    const m = Math.floor(props.seconds / 60);
    const s = String(props.seconds % 60).padStart(2, "0");
    return (
      <div className="ou-clock">
        <strong>{`${m}:${s}`}</strong>
        <small>{props.label ?? "elapsed"}</small>
      </div>
    );
  },
});

const PulseBadge = defineComponent({
  name: "Badge", // same name → override
  description: "Status badge that pulses while the incident is active.",
  props: z.object({ label: z.union([z.string(), z.number()]), tone: Tone.optional() }),
  component: ({ props }) => (
    <span className={`ou-badge ou-badge--pulse ou-tone--${props.tone ?? "neutral"}`}>{props.label}</span>
  ),
});

// A2UI actions the server listens for (server/src/a2ui/incident-session.ts).
// The A2UI renderer turns them into `action` envelopes sent to the agent.
export const acknowledge = defineAction({
  name: "Acknowledge",
  description: "Acknowledge the incident as the given responder.",
  params: z.object({ by: z.string() }),
});
const resolve = defineAction({ name: "Resolve", description: "Mark the incident resolved.", params: z.object({}) });
const restart = defineAction({ name: "Restart", description: "Start a new drill.", params: z.object({}) });

export const incidentLibrary = library.extend({
  components: {
    add: [{ component: IncidentClock, slots: ["Card.children"] }],
    override: [PulseBadge],
    remove: ["HtmlFrame", "Modal"],
  },
  actions: { add: [acknowledge, resolve, restart] },
});

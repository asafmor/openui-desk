// Kpi — one number with a label. Typically fed by a Query plus built-ins:
//
//     stats = Query("ticket_stats", {days: $days}, {open: 0, breached: 0})
//     kpi   = Kpi("Breached", stats.breached, @Percent(stats.breached, stats.open) + " of open", "danger")
//
// `useIsQueryLoading()` is true while any Query in this Renderer is fetching,
// so the value can dim instead of flashing the defaults (feature #11).
import { defineComponent, useIsQueryLoading } from "@openuidev/react-lang";
import { z } from "zod";
import { Tone } from "./Badge";

export const Kpi = defineComponent({
  name: "Kpi",
  description: "Key metric: label, value, optional hint line and tone.",
  props: z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    hint: z.string().optional(),
    tone: Tone.optional(),
  }),
  component: ({ props }) => {
    const loading = useIsQueryLoading();
    return (
      <div className={`ou-kpi ou-tone--${props.tone ?? "neutral"}`} aria-busy={loading}>
        <span className="ou-kpi__label">{props.label}</span>
        <strong className={`ou-kpi__value ${loading ? "is-loading" : ""}`}>{props.value}</strong>
        {props.hint ? <span className="ou-kpi__hint">{props.hint}</span> : null}
      </div>
    );
  },
});

// LineChart — one polyline per Series, plain SVG.
//
//     health = Query("system_health", {}, {p95LatencyMs: 0}, 5)   ← refresh every 5s
//     (a LineChart over a growing series is a good fit for trends)
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Legend } from "./Legend";
import { CHART_H, CHART_W, PAD, seriesColor, toNumbers, yScale } from "./scale";
import { Series } from "./Series";

export const LineChart = defineComponent({
  name: "LineChart",
  description: "Line chart for trends over time.",
  props: z.object({
    labels: z.array(z.any()),
    series: z.array(Series.ref),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = (props.labels ?? []).map(String);
    const series = props.series.filter(Boolean).map((s) => ({ name: s.props.name, values: toNumbers(s.props.values) }));
    const max = Math.max(1, ...series.flatMap((s) => s.values));
    const step = (CHART_W - PAD.left - PAD.right) / Math.max(1, labels.length - 1);
    const x = (i: number) => PAD.left + i * step;
    return (
      <figure className="ou-chart">
        {props.title ? <figcaption>{props.title}</figcaption> : null}
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" aria-label={props.title ?? "Line chart"}>
          <text x={4} y={PAD.top + 4} className="ou-chart__axis">{max}</text>
          {series.map((s, si) => (
            <polyline
              key={si}
              fill="none"
              stroke={seriesColor(si)}
              strokeWidth={2}
              points={s.values.map((v, i) => `${x(i)},${yScale(v, max)}`).join(" ")}
            />
          ))}
          {labels.map((label, i) =>
            i % Math.ceil(labels.length / 8) === 0 ? (
              <text key={i} x={x(i)} y={CHART_H - 6} textAnchor="middle" className="ou-chart__axis">
                {label.length > 6 ? label.slice(-5) : label}
              </text>
            ) : null,
          )}
        </svg>
        <Legend names={series.map((s) => s.name)} />
      </figure>
    );
  },
});

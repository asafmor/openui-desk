// BarChart — grouped bars drawn with plain SVG.
//
//     stats = Query("ticket_stats", {days: $days}, {daily: []})
//     chart = BarChart(stats.daily.day, [Series("Created", stats.daily.created), Series("Resolved", stats.daily.resolved)])
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Legend } from "./Legend";
import { CHART_H, CHART_W, PAD, seriesColor, toNumbers, yScale } from "./scale";
import { Series } from "./Series";

export const BarChart = defineComponent({
  name: "BarChart",
  description: "Grouped bar chart for comparing categories.",
  props: z.object({
    labels: z.array(z.any()),
    series: z.array(Series.ref),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = (props.labels ?? []).map(String);
    const series = props.series.filter(Boolean).map((s) => ({ name: s.props.name, values: toNumbers(s.props.values) }));
    const max = Math.max(1, ...series.flatMap((s) => s.values));
    const groupW = (CHART_W - PAD.left - PAD.right) / Math.max(1, labels.length);
    const barW = (groupW * 0.8) / Math.max(1, series.length);
    return (
      <figure className="ou-chart">
        {props.title ? <figcaption>{props.title}</figcaption> : null}
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" aria-label={props.title ?? "Bar chart"}>
          <text x={4} y={PAD.top + 4} className="ou-chart__axis">{max}</text>
          {labels.map((label, li) => (
            <g key={li}>
              {series.map((s, si) => {
                const v = s.values[li] ?? 0;
                const x = PAD.left + li * groupW + groupW * 0.1 + si * barW;
                const y = yScale(v, max);
                return (
                  <rect key={si} x={x} y={y} width={barW - 2} height={CHART_H - PAD.bottom - y} fill={seriesColor(si)}>
                    <title>{`${s.name} · ${label}: ${v}`}</title>
                  </rect>
                );
              })}
              <text x={PAD.left + li * groupW + groupW / 2} y={CHART_H - 6} textAnchor="middle" className="ou-chart__axis">
                {label.length > 6 ? label.slice(-5) : label}
              </text>
            </g>
          ))}
        </svg>
        <Legend names={series.map((s) => s.name)} />
      </figure>
    );
  },
});

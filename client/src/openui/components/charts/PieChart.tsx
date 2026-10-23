// PieChart — donut slices from labels + values (plain SVG arcs).
//
//     stats = Query("ticket_stats", {}, {byStatus: []})
//     pie   = PieChart(stats.byStatus.status, stats.byStatus.count)
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Legend } from "./Legend";
import { seriesColor, toNumbers } from "./scale";

const R = 70;
const C = 2 * Math.PI * R; // circumference

export const PieChart = defineComponent({
  name: "PieChart",
  description: "Donut chart for parts of a whole.",
  props: z.object({
    labels: z.array(z.any()),
    values: z.array(z.any()),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = (props.labels ?? []).map(String);
    const values = toNumbers(props.values);
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let offset = 0;
    return (
      <figure className="ou-chart ou-chart--pie">
        {props.title ? <figcaption>{props.title}</figcaption> : null}
        <svg viewBox="0 0 180 180" role="img" aria-label={props.title ?? "Pie chart"}>
          {/* Each slice is a circle stroke dashed to its share of the circumference. */}
          {values.map((v, i) => {
            const len = (v / total) * C;
            const slice = (
              <circle
                key={i}
                cx={90}
                cy={90}
                r={R}
                fill="none"
                stroke={seriesColor(i)}
                strokeWidth={28}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 90 90)"
              >
                <title>{`${labels[i]}: ${v}`}</title>
              </circle>
            );
            offset += len;
            return slice;
          })}
          <text x={90} y={96} textAnchor="middle" className="ou-chart__total">
            {values.reduce((a, b) => a + b, 0)}
          </text>
        </svg>
        <Legend names={labels} />
      </figure>
    );
  },
});

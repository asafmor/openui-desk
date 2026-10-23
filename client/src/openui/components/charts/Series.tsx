// Series — a named list of numbers, consumed by BarChart and LineChart.
// It is a "data-only" component: it renders nothing by itself; the parent
// reads `series[i].props` (an evaluated element node) instead.
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Series = defineComponent({
  name: "Series",
  description: "Named numeric series for charts. values align with the chart labels.",
  props: z.object({
    name: z.string(),
    values: z.array(z.any()).describe("Numbers, often a pluck like stats.daily.created"),
  }),
  component: () => null,
});

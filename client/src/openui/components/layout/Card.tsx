// Card — a titled panel whose children are RESTRICTED to a union of refs.
//
// `Child.ref` is a Zod type that matches "an element of component Child".
// `z.array(z.union([A.ref, B.ref]))` therefore means "a list of A or B".
// The prompt prints it as `children: (TextContent | Kpi | ...)[]`, and the
// parser reports `type-mismatch` if the model puts anything else in there.
//
// This union is also an EXTENSION POINT: `library.extend({ components: { add:
// [{ component: X, slots: ["Card.children"] }] } })` appends X to this union
// in a derived library (see ../../a2ui-library.ts, feature #12).
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { BarChart } from "../charts/BarChart";
import { LineChart } from "../charts/LineChart";
import { PieChart } from "../charts/PieChart";
import { Badge } from "../content/Badge";
import { Callout } from "../content/Callout";
import { Kpi } from "../content/Kpi";
import { TextContent } from "../content/TextContent";
import { Table } from "../data/Table";
import { Buttons } from "../inputs/Buttons";
import { Form } from "../inputs/Form";
import { Stack } from "./Stack";

export const CardChild = z.union([
  Stack.ref,
  TextContent.ref,
  Badge.ref,
  Kpi.ref,
  Callout.ref,
  Table.ref,
  BarChart.ref,
  LineChart.ref,
  PieChart.ref,
  Form.ref,
  Buttons.ref,
]);

export const Card = defineComponent({
  name: "Card",
  description: "Bordered panel with an optional title. Put a Stack inside for complex layouts.",
  props: z.object({
    children: z.array(CardChild),
    title: z.string().optional(),
  }),
  component: ({ props, renderNode }) => (
    <section className="ou-card">
      {props.title ? <h3 className="ou-card__title">{props.title}</h3> : null}
      <div className="ou-card__body">{renderNode(props.children)}</div>
    </section>
  ),
});

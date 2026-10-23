// Table + Col — a COLUMN-oriented table, the shape that works best with
// OpenUI's "array pluck" (feature #2):
//
//     tickets = Query("list_tickets", {status: $status}, {rows: [], total: 0})
//     tbl = Table([
//       Col("Id", tickets.rows.id),                       ← pluck: every row's id
//       Col("Title", tickets.rows.title),
//       Col("Priority", @Each(tickets.rows, "t", Badge(t.priority, t.priority == "urgent" ? "danger" : "neutral"))),
//       Col("", @Each(tickets.rows, "t", Button("Open", @Broadcast("ticketId", t.id), "ghost")))
//     ])
//
// A column's values may be plain strings/numbers OR element nodes produced by
// @Each; renderNode handles both. Row i is made of values[i] of every column.
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Col = defineComponent({
  name: "Col",
  description:
    "Table column: header plus one value per row. Use pluck (rows.field) for text or @Each(rows, \"r\", Comp(...)) for components.",
  props: z.object({
    header: z.string(),
    values: z.array(z.any()),
    align: z.enum(["left", "right"]).optional(),
  }),
  component: () => null, // rendered by Table
});

export const Table = defineComponent({
  name: "Table",
  description: "Data table built from columns. Shows emptyText when there are no rows.",
  props: z.object({
    columns: z.array(Col.ref),
    emptyText: z.string().optional(),
  }),
  component: ({ props, renderNode }) => {
    const columns = props.columns.filter(Boolean).map((c) => c.props);
    const rowCount = Math.max(0, ...columns.map((c) => (Array.isArray(c.values) ? c.values.length : 0)));
    if (rowCount === 0) return <p className="ou-text ou-text--muted">{props.emptyText ?? "No rows."}</p>;
    return (
      <div className="ou-table-wrap">
        <table className="ou-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} style={{ textAlign: c.align ?? "left" }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, row) => (
              <tr key={row}>
                {columns.map((c, i) => (
                  <td key={i} style={{ textAlign: c.align ?? "left" }}>
                    {renderNode(c.values?.[row])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});

// Tabs + TabItem — a BINDABLE container (feature #10).
//
// `value: reactive(z.string().optional())` marks the prop as accepting a
// `$variable`. The prompt prints it as `value?: $binding<string>`, so the
// model can write:
//
//     $tab = "overview"
//     tabs = Tabs([overviewTab, ticketsTab], $tab)
//
// `useStateField(name, props.value)` then gives a { value, setValue } pair:
//   - bound to $tab  → setValue writes the $variable; every expression and
//     Query that reads $tab re-evaluates (feature #1)
//   - not bound      → it falls back to plain field state under `name`
//
// Because the active tab lives in $tab, another surface can switch it with
// the custom action @Broadcast("tab", "tickets") (see ../../actions/broadcast.ts).
import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod";

export const TabItem = defineComponent({
  name: "TabItem",
  description: "One tab: a stable value, a label and its content.",
  props: z.object({
    value: z.string(),
    label: z.string(),
    children: z.array(z.any()),
  }),
  // TabItem never renders itself; Tabs reads its props and renders the content.
  component: ({ props, renderNode }) => <>{renderNode(props.children)}</>,
});

export const Tabs = defineComponent({
  name: "Tabs",
  description: "Tabbed container. Bind value to a $variable to control or remember the active tab.",
  props: z.object({
    items: z.array(TabItem.ref),
    value: reactive(z.string().optional()),
  }),
  component: ({ props, renderNode }) => {
    const field = useStateField("tabs", props.value);
    // Each item is an evaluated element node: { type: "element", typeName, props }.
    const items = props.items.filter(Boolean);
    const active = items.find((t) => t.props.value === field.value) ?? items[0];
    if (!active) return null;
    return (
      <div className="ou-tabs">
        <div className="ou-tabs__bar" role="tablist">
          {items.map((t) => (
            <button
              key={t.props.value}
              role="tab"
              aria-selected={t === active}
              className="ou-tabs__tab"
              onClick={() => field.setValue(t.props.value)}
            >
              {t.props.label}
            </button>
          ))}
        </div>
        <div role="tabpanel">{renderNode(active.props.children)}</div>
      </div>
    );
  },
});

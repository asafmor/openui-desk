// Menu + MenuItem — a dropdown of actions. Great in the left rail to control
// OTHER surfaces through the custom @Broadcast action:
//
//     views = Menu("Saved views", [
//       MenuItem("Urgent queue", Action([@Broadcast("status", "open"), @Broadcast("priority", "urgent")])),
//       MenuItem("Everything", Action([@Broadcast("status", "all"), @Broadcast("priority", "all")]))
//     ])
//
// `open` is local React state (useState). Not everything has to live in
// OpenUI state: purely visual, throw-away UI state can stay in the component.
import { action, defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { z } from "zod";
import { useRunAction } from "./useRunAction";

export const MenuItem = defineComponent({
  name: "MenuItem",
  description: "One menu entry: label, action and an optional hint.",
  props: z.object({
    label: z.string(),
    action: action(),
    hint: z.string().optional(),
  }),
  component: () => null, // rendered by Menu
});

export const Menu = defineComponent({
  name: "Menu",
  description: "Button that opens a list of MenuItems.",
  props: z.object({
    label: z.string(),
    items: z.array(MenuItem.ref),
  }),
  component: ({ props }) => {
    const [open, setOpen] = useState(false);
    const run = useRunAction();
    return (
      <div className="ou-menu">
        <button type="button" className="ou-btn ou-btn--secondary" aria-expanded={open} onClick={() => setOpen(!open)}>
          {props.label} ▾
        </button>
        {open ? (
          <ul className="ou-menu__list" role="menu">
            {props.items.filter(Boolean).map((item, i) => (
              <li key={i} role="menuitem">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    run(item.props.label, item.props.action);
                  }}
                >
                  {item.props.label}
                  {item.props.hint ? <small>{item.props.hint}</small> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
});

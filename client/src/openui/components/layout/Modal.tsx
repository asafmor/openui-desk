// Modal — opened and closed purely through reactive state (feature #1, #10).
//
//     $showEdit = false
//     editBtn   = Button("Edit", @Set($showEdit, true))
//     modal     = Modal("Edit ticket", $showEdit, [editForm])
//     saveBtn   = Button("Save", Action([@Run(update), @Set($showEdit, false)]))
//
// @Set runs inside the Renderer (it never reaches onAction); it writes
// $showEdit, and this component re-renders because useStateField subscribes
// to the store.
import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod";

export const Modal = defineComponent({
  name: "Modal",
  description:
    "Dialog. open is a $boolean binding: @Set($x, true) opens it; the close button sets it back to false. Put a Form inside.",
  props: z.object({
    title: z.string(),
    open: reactive(z.boolean().optional()),
    children: z.array(z.any()),
  }),
  component: ({ props, renderNode }) => {
    const open = useStateField("modalOpen", props.open);
    if (!open.value) return null;
    return (
      <div className="ou-modal__backdrop" onClick={() => open.setValue(false)}>
        <div className="ou-modal" role="dialog" aria-label={props.title} onClick={(e) => e.stopPropagation()}>
          <header className="ou-modal__header">
            <h3>{props.title}</h3>
            <button className="ou-icon-btn" aria-label="Close" onClick={() => open.setValue(false)}>
              ×
            </button>
          </header>
          {renderNode(props.children)}
        </div>
      </div>
    );
  },
});

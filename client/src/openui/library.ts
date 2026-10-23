// ─────────────────────────────────────────────────────────────────────────────
// THE COMPONENT LIBRARY — one contract, two consumers.
//
//  1. The BROWSER renders programs with it:  <Renderer library={library} />
//  2. The SERVER prompts the model with its SPEC. `pnpm generate` runs the
//     OpenUI CLI on this file:
//        openui generate client/src/openui/library.ts --spec --out shared/generated/library.spec.json
//     which writes signatures, descriptions, groups, functions and actions as
//     JSON. server/src/mastra/prompt/system-prompt.ts feeds it to
//     generateSystemPrompt(). Change a component → re-run `pnpm generate`,
//     or the model and the renderer disagree ("unknown-component" errors).
//
// Every component is our own (no @openuidev/react-ui). Names and argument
// orders of the form/filter components follow OpenUI's reference library
// because the generated prompt's built-in sections show examples using them.
// ─────────────────────────────────────────────────────────────────────────────
import { createLibrary } from "@openuidev/react-lang";
import { customActions } from "./actions";
import { BarChart } from "./components/charts/BarChart";
import { LineChart } from "./components/charts/LineChart";
import { PieChart } from "./components/charts/PieChart";
import { Series } from "./components/charts/Series";
import { Badge } from "./components/content/Badge";
import { Callout } from "./components/content/Callout";
import { HtmlFrame } from "./components/content/HtmlFrame";
import { Kpi } from "./components/content/Kpi";
import { TextContent } from "./components/content/TextContent";
import { Col, Table } from "./components/data/Table";
import { Button } from "./components/inputs/Button";
import { Buttons } from "./components/inputs/Buttons";
import { Checkbox } from "./components/inputs/Checkbox";
import { Form } from "./components/inputs/Form";
import { FormControl } from "./components/inputs/FormControl";
import { Input } from "./components/inputs/Input";
import { Menu, MenuItem } from "./components/inputs/Menu";
import { Select, SelectItem } from "./components/inputs/Select";
import { ShareButton } from "./components/inputs/ShareButton";
import { Card } from "./components/layout/Card";
import { Modal } from "./components/layout/Modal";
import { Stack } from "./components/layout/Stack";
import { TabItem, Tabs } from "./components/layout/Tabs";
import { customFunctions } from "./functions";

/** Written into every stored program (`]]>openui:content?library=...`). */
export const LIBRARY_ID = "support-desk";
export const LIBRARY_VERSION = "1";

export const library = createLibrary({
  id: LIBRARY_ID,
  // The entry component. Programs start with `root = Stack([...])`.
  root: "Stack",
  components: [
    Stack, Card, Tabs, TabItem, Modal,
    TextContent, Badge, Kpi, Callout, HtmlFrame,
    Table, Col,
    BarChart, LineChart, PieChart, Series,
    Form, FormControl, Input, Select, SelectItem, Checkbox, Button, Buttons, Menu, MenuItem, ShareButton,
  ],
  // componentGroups split the prompt's component list into titled sections
  // with notes — it helps the model pick the right component (feature #12).
  componentGroups: [
    { name: "Layout", components: ["Stack", "Card", "Tabs", "TabItem", "Modal"] },
    { name: "Content", components: ["TextContent", "Badge", "Kpi", "Callout"] },
    {
      name: "Data",
      components: ["Table", "Col"],
      notes: ["Prefer Query() results + array pluck (rows.field) over hardcoded rows."],
    },
    { name: "Charts", components: ["BarChart", "LineChart", "PieChart", "Series"] },
    {
      name: "Forms & actions",
      components: ["Form", "FormControl", "Input", "Select", "SelectItem", "Checkbox", "Button", "Buttons", "Menu", "MenuItem", "ShareButton"],
      notes: ["Bind inputs to $variables when other statements (Query/Mutation args, filters) need their value."],
    },
    {
      name: "Advanced",
      components: ["HtmlFrame"],
      notes: ["Only when explicitly asked for a custom visualization or mini app."],
    },
  ],
  functions: customFunctions,
  actions: customActions,
});

export type AppLibrary = typeof library;

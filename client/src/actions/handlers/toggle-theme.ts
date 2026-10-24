// @ToggleTheme() — definition: ../../openui/actions/toggle-theme.ts
import { toggleTheme } from "../theme";
import type { ActionHandler } from "./types";

export const handleToggleTheme: ActionHandler<"ToggleTheme"> = () => toggleTheme();

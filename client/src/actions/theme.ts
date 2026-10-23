// App theme: host-side handler for the @ToggleTheme() custom action
// (../openui/actions/toggle-theme.ts). The theme is a per-viewer preference,
// not part of the workspace, so it lives in its own localStorage key and is
// NOT exported/imported with workspaces.
//
// styles.css defines light tokens on :root and dark ones on
// :root[data-theme="dark"]; flipping the attribute re-themes every surface,
// chart and the chat at once (they only use CSS variables).
type Theme = "light" | "dark";
const KEY = "openui-desk:theme";

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/** Called once from main.tsx: saved choice, else the OS preference. */
export function initTheme(): void {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* storage blocked: fall back to the OS preference */
  }
  const system: Theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  apply(saved === "light" || saved === "dark" ? saved : system);
}

export function toggleTheme(): void {
  const next: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  apply(next);
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* not persisted; still applied for this session */
  }
}

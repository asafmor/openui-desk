// Tiny math helpers shared by the hand-drawn SVG charts. No chart library:
// a chart is just rectangles/paths placed with a linear scale.

export const CHART_W = 480;
export const CHART_H = 180;
export const PAD = { top: 12, right: 8, bottom: 22, left: 32 };

/** Coerce model/query input into numbers; anything non-numeric becomes 0. */
export function toNumbers(values: unknown): number[] {
  return Array.isArray(values) ? values.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0)) : [];
}

/** Map a value in [0, max] to a y pixel inside the plot area. */
export function yScale(value: number, max: number): number {
  const plotH = CHART_H - PAD.top - PAD.bottom;
  return PAD.top + plotH - (max === 0 ? 0 : (value / max) * plotH);
}

/** Series colors come from CSS variables so light/dark themes work. */
export const seriesColor = (i: number) => `var(--chart-${(i % 4) + 1})`;

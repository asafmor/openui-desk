// Plain React helper (NOT an OpenUI component): a legend row for charts.
import { seriesColor } from "./scale";

export function Legend({ names }: { names: string[] }) {
  return (
    <div className="ou-legend">
      {names.map((n, i) => (
        <span key={n + i}>
          <i style={{ background: seriesColor(i) }} /> {n}
        </span>
      ))}
    </div>
  );
}

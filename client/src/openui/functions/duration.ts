// CUSTOM FUNCTION (feature #5): @Duration(hours) → "1d 4h" / "5h" / "35m"
//
//     Col("Age", @Each(tickets.rows, "t", TextContent(@Duration(t.ageHours), "muted")))
//
// Note what it does NOT do: compute "time ago" from the current clock. A
// custom function must be pure, so the server sends `ageHours` and we only
// format it.
import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod";

export const duration = defineFunction({
  name: "Duration",
  description: 'Format a number of hours compactly: 0.5 → "30m", 5 → "5h", 28 → "1d 4h".',
  params: z.object({ hours: z.number() }),
  returns: z.string(),
  fn: ({ hours }) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const rest = Math.round(hours % 24);
    return rest ? `${days}d ${rest}h` : `${days}d`;
  },
});

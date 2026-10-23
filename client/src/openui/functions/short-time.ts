// CUSTOM FUNCTION (feature #5): @ShortTime(iso) → "10-23 13:33"
//
//     Col("When", @Each(feed.rows, "r", TextContent(@ShortTime(r.at), "muted")))
//
// Pure: it formats the given timestamp (UTC) and never reads the clock.
import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod";

export const shortTime = defineFunction({
  name: "ShortTime",
  description: 'Format an ISO date-time as "MM-DD HH:mm" (UTC). Returns "" for empty input.',
  params: z.object({ iso: z.string() }),
  returns: z.string(),
  fn: ({ iso }) => (iso ? `${iso.slice(5, 10)} ${iso.slice(11, 16)}` : ""),
});

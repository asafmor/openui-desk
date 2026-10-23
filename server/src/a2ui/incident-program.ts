// OpenUI Lang statements for the A2UI incident surface.
//
// In A2UI, statements are sent as an array in `updateComponents`. They read
// the A2UI DATA MODEL as $variables: a top-level data-model key `elapsed`
// becomes `$elapsed`. Data-model updates therefore re-render without
// resending any statement.
//
// Components come from the client's `incidentLibrary` (library.extend):
// IncidentClock and the pulsing Badge exist only there.

export const INITIAL_STATEMENTS = [
  "root = Stack([card])",
  'card = Card([head, IncidentClock($elapsed, "since detection"), TextContent($summary, "muted"), timeline, actions], "Live incident (A2UI)")',
  'head = Stack([Badge($status, $status == "resolved" ? "success" : $status == "acknowledged" ? "warning" : "danger"), TextContent($title, "heading")], "row")',
  'timeline = TextContent("Waiting for a responder…", "muted")',
  'actions = Buttons([Button("Acknowledge", @Acknowledge("you"))])',
];

export const ACKNOWLEDGED_STATEMENTS = [
  'timeline = TextContent("Acknowledged by " + $by + ". Mitigation in progress.")',
  'actions = Buttons([Button("Mark resolved", @Resolve())])',
];

export const RESOLVED_STATEMENTS = [
  'timeline = TextContent("Resolved after " + $elapsed + "s. Nice work!")',
  'actions = Buttons([Button("Run another drill", @Restart(), "secondary")])',
];

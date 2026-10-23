// HtmlFrame — OPEN-ENDED HTML inside an OpenUI program, and a STREAMING-AWARE
// component (feature #11 + the "html-artifact" pattern from the docs).
//
// While the program streams, `html` is a growing, half-finished string.
// Rendering it in an iframe on every chunk would flicker and run broken
// scripts, so:
//   • useIsStreaming() === true  → show a progress line + the raw source tail
//   • useIsStreaming() === false → render the finished document in an iframe
//
// SECURITY: model-written HTML is untrusted. It goes into `srcDoc` with
//   - sandbox="allow-scripts"  (no allow-same-origin → no access to our page,
//                               cookies, storage or the parent DOM)
//   - a Content-Security-Policy meta tag that blocks every network request.
import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { z } from "zod";

const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:";

function withCsp(html: string): string {
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="${CSP}">${html}`;
}

export const HtmlFrame = defineComponent({
  name: "HtmlFrame",
  description:
    "Self-contained HTML+CSS+JS mini app rendered in a sandbox. Use ONLY when asked for something no other component can do (a game, a custom visualization). Inline all CSS/JS, no external resources or network.",
  props: z.object({
    title: z.string(),
    html: z.string(),
    height: z.number().optional().describe("Pixels, default 320"),
  }),
  component: ({ props }) => {
    const streaming = useIsStreaming();
    return (
      <figure className="ou-html">
        <figcaption>{props.title}</figcaption>
        {streaming ? (
          <pre className="ou-html__source">
            Receiving HTML… {props.html.length} chars{"\n"}
            {props.html.slice(-400)}
          </pre>
        ) : (
          <iframe
            title={props.title}
            sandbox="allow-scripts"
            srcDoc={withCsp(props.html)}
            style={{ height: props.height ?? 320 }}
          />
        )}
      </figure>
    );
  },
});

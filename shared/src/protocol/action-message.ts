// ─────────────────────────────────────────────────────────────────────────────
// USER ACTION → CHAT TURN, using OpenUI's message protocol (feature #15).
//
// When a generated button runs @ToAssistant("Summarize", {ticketId: "T-1"}),
// the Renderer emits a `continue_conversation` event. The OpenUI spec
// (spec/prompt.md §6.3 "Reference format") stores that user turn as:
//
//     ]]>openui:content
//     Summarize
//     ]]>openui:context
//     ["User clicked: Summarize", {...formState}, {"ticketId":"T-1"}]
//
// and the MODEL receives the markers stripped:
//
//     Summarize
//     context and form values = ["User clicked: Summarize", {...}, {...}]
//
// buildMessage/parseMessage come from @openuidev/lang-core and write/read the
// marker lines. Writers: client/src/chat/useDeskChat.ts (sendActionTurn, fed by
// client/src/actions/handlers/continue-conversation.ts). Readers: the chat
// transcript (client/src/chat/MessageView.tsx) and the transport, which turns it
// into plain model text with toModelText (client/src/chat/chat-transport.ts).
// ─────────────────────────────────────────────────────────────────────────────
import { buildMessage, parseMessage } from "@openuidev/lang-core";

export interface ActionTurn {
  message: string;
  formState?: unknown;
  context?: unknown;
}

/** Client side: the text stored in the user message's text part. */
export function encodeActionTurn({ message, formState, context }: ActionTurn): string {
  const payload: unknown[] = [`User clicked: ${message}`, formState ?? {}];
  if (context !== undefined) payload.push(context);
  return buildMessage({ content: message, context: payload });
}

/** Both sides: split a stored turn back into the visible text and its context. */
export function decodeActionTurn(text: string): { message: string; context: unknown } {
  const parsed = parseMessage(text);
  return { message: parsed.content.trim(), context: parsed.context };
}

/** Server side: what the model reads. Plain text without markers passes through. */
export function toModelText(text: string): string {
  if (!text.includes("]]>openui:")) return text;
  const { message, context } = decodeActionTurn(text);
  return context == null ? message : `${message}\ncontext and form values = ${JSON.stringify(context)}`;
}

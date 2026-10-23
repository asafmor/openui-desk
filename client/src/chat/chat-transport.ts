// ─────────────────────────────────────────────────────────────────────────────
// The AI SDK transport: how a chat request is built (feature #16).
//
// DefaultChatTransport POSTs to Mastra's chatRoute (server/src/mastra/index.ts)
// and decodes the AI SDK v7 UIMessage stream it returns.
//
// prepareSendMessagesRequest lets us shape the body at SEND time:
//   1. messages: user turns created by UI actions are stored with OpenUI
//      marker lines; the model must get them in the reference text format
//      (toModelText, shared/src/protocol/action-message.ts).
//   2. requestContext.surfaces: the live program/state/errors of every
//      surface. Mastra turns `body.requestContext` into the agent's
//      RequestContext (server/src/mastra/request-context.ts).
// ─────────────────────────────────────────────────────────────────────────────
import { toModelText } from "@demo/shared/protocol/action-message";
import type { ChatRequestExtras, SurfaceSnapshot } from "@demo/shared/protocol/chat-request";
import { DefaultChatTransport, type UIMessage } from "ai";
import { SERVER_URL } from "../config";

function forModel(message: UIMessage): UIMessage {
  if (message.role !== "user") return message;
  return {
    ...message,
    parts: message.parts.map((p) => (p.type === "text" ? { ...p, text: toModelText(p.text) } : p)),
  };
}

export function createDeskTransport(getSurfaces: () => SurfaceSnapshot[]) {
  return new DefaultChatTransport<UIMessage>({
    api: `${SERVER_URL}/chat`,
    prepareSendMessagesRequest: ({ messages }) => {
      const requestContext: ChatRequestExtras = { surfaces: getSurfaces() };
      return { body: { messages: messages.map(forModel), requestContext } };
    },
  });
}

// One chat message. User turns created by clicks in generated UI are stored
// in OpenUI's message format; decodeActionTurn shows the label and lets you
// expand the context/form state that was sent to the model.
import { decodeActionTurn } from "@demo/shared/protocol/action-message";
import { isToolUIPart, type UIMessage } from "ai";
import { AssistantText } from "./AssistantText";
import { ToolCallView } from "./ToolCallView";

function UserText({ text }: { text: string }) {
  if (!text.includes("]]>openui:")) return <p className="chat__prose">{text}</p>;
  const { message, context } = decodeActionTurn(text);
  return (
    <details className="chat__action-turn">
      <summary>🖱 {message}</summary>
      <pre>{JSON.stringify(context, null, 2)}</pre>
    </details>
  );
}

export function MessageView({ message, streaming }: { message: UIMessage; streaming: boolean }) {
  return (
    <article className={`chat__msg chat__msg--${message.role}`}>
      {message.parts.map((part, i) => {
        const key = `${message.id}:${i}`;
        if (part.type === "text")
          return message.role === "user" ? <UserText key={key} text={part.text} /> : <AssistantText key={key} partKey={key} text={part.text} streaming={streaming} />;
        if (isToolUIPart(part)) return <ToolCallView key={key} part={part} />;
        return null; // step-start, reasoning, sources… are not shown
      })}
    </article>
  );
}

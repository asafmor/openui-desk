// Helpers to read our agent's tool calls out of AI SDK message parts.
//
// A server tool appears in UIMessage.parts as `tool-<name>` (or
// `dynamic-tool`), moving through states:
//   input-streaming  → `input` is a PARTIAL object parsed from partial JSON
//   input-available  → the full input, tool is running on the server
//   output-available → `output` holds the tool's return value
//   output-error     → `errorText`
// isToolUIPart + getToolName handle both part shapes.
import { getToolName, isToolUIPart, type UIMessage } from "ai";

export type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

export function toolParts(message: UIMessage, name?: string): ToolPart[] {
  return message.parts.filter(
    (p): p is ToolPart => isToolUIPart(p) && (name === undefined || getToolName(p) === name),
  );
}

export interface UpdateSurfaceInput {
  surfaceId?: string;
  patch?: string;
  summary?: string;
}

export interface UpdateSurfaceOutput {
  ok: boolean;
  surfaceId: string;
  patch?: string;
  summary?: string;
  errors?: { code: string; statementId?: string; message: string }[];
}

export interface PublishArtifactOutput {
  ok: boolean;
  id: string;
  title: string;
  program: string;
  errors?: unknown[];
}

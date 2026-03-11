import type Anthropic from "@anthropic-ai/sdk";
import type { ToolResultBlockParam } from "@anthropic-ai/sdk/resources";
import { type } from "arktype";

export type AnthropicTool = Anthropic.Messages.ToolUnion;

export type ToolResult = ToolResultBlockParam["content"];

export const LOCAL_TOOL_TYPE = "local_tool" as const;

export type AIAgentTool = {
  type: typeof LOCAL_TOOL_TYPE;
  name: string;
  description: string;
  inputSchema: type.Any;
  // oxlint-disable-next-line typescript-eslint/no-explicit-any
  run: (input: any) => Promise<ToolResult>;
};

export type ExtendedAnthropicTool = AnthropicTool & {
  // oxlint-disable-next-line typescript-eslint/no-explicit-any
  run: (input: any) => Promise<ToolResult>;
};

export type Tool = AIAgentTool | ExtendedAnthropicTool;

export function isAIAgentTool(tool: Tool): tool is AIAgentTool {
  return tool.type === LOCAL_TOOL_TYPE;
}

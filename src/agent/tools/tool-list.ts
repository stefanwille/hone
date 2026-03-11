import { bash } from "./available-tools/bash";
import type { BashSession } from "./available-tools/bash-session";
import { get_location } from "./available-tools/get-location";
import { get_weather } from "./available-tools/get-weather";
import { textEditor } from "./available-tools/text-editor";
import { isAIAgentTool, type AnthropicTool, type Tool } from "./tool";

export function createTools(bashSession: BashSession): Tool[] {
  return [get_location, get_weather, bash(bashSession), textEditor];
}

export function convertTools(tools: Tool[]): AnthropicTool[] {
  return tools.map((tool) => {
    if (isAIAgentTool(tool)) {
      // oxlint-disable-next-line typescript-eslint/no-explicit-any
      const inputSchema = tool.inputSchema?.toJsonSchema() as any;
      return {
        name: tool.name,
        description: tool.description,
        input_schema: inputSchema,
        strict: true,
      };
    } else {
      // Extended Anthropic tool
      const anthropicTool: AnthropicTool = { ...tool };
      // @ts-expect-error - run is not part of the AnthropicTool type
      delete anthropicTool.run;
      return anthropicTool;
    }
  });
}

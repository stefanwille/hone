import { type } from "arktype";
import type { ToolResultBlockParam } from "@anthropic-ai/sdk/resources";
import type Anthropic from "@anthropic-ai/sdk";
import type { BashSession, BashToolInput } from "./BashSession";

export type ToolResult = ToolResultBlockParam["content"];

export type Tool = {
  name: string;
  description: string;
  inputSchema?: type.Any;
  type?: Anthropic.Messages.ToolUnion["type"];
  run: (input: any) => Promise<ToolResult>;
};

const get_location: Tool = {
  name: "get_location",
  description: "Get the user's location",
  inputSchema: type({}),
  run: async () => {
    console.log("Getting location");
    return "Berlin, Germany";
  },
};

const getWeatherSchema = type({
  location: "string",
});

const get_weather: Tool = {
  name: "get_weather",
  description: "Get the current weather in a given location",
  inputSchema: getWeatherSchema,
  run: async ({ location }: typeof getWeatherSchema.infer) => {
    console.log(`Getting weather for ${location}`);
    if (location === "San Francisco, CA") {
      return "Very hot and dry, at 52 degrees Celsius.";
    }
    if (location === "Berlin, Germany") {
      return "Sunny and friendly, at 16 degrees Celsius.";
    }
    return "Unknown location";
  },
};

export function createBash(bashSession: BashSession): Tool {
  return {
    name: "bash",
    description: "Run a command in the bash shell",
    run: async (input: BashToolInput) => {
      if (input.restart) {
        bashSession.restart();
        return "Bash session restarted.";
      }
      return await bashSession.run(input.command, input.timeout);
    },
  };
}

export function createTools(bashSession: BashSession): Tool[] {
  return [get_location, get_weather, createBash(bashSession)];
}

export function convertTools(tools: Tool[]): Anthropic.Messages.ToolUnion[] {
  return tools.map((tool) => {
    if (tool.name === "bash") {
      return {
        type: "bash_20250124",
        name: tool.name,
      };
    }
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema?.toJsonSchema() as any,
      strict: true,
    };
  });
}

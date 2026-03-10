import { type } from "arktype";
import type { ToolResultBlockParam } from "@anthropic-ai/sdk/resources";
import type Anthropic from "@anthropic-ai/sdk";

export type ToolResult = ToolResultBlockParam["content"];

export type Tool = {
  name: string;
  description: string;
  inputSchema: type.Any;
  jsFunction: (input: any) => Promise<ToolResult>;
  type?: Anthropic.Messages.ToolUnion["type"];
};

export const get_location: Tool = {
  name: "get_location",
  description: "Get the user's location",
  inputSchema: type({}),
  jsFunction: async () => {
    console.log("Getting location");
    return "Berlin, Germany";
  },
};

const getWeatherSchema = type({
  location: "string",
});

export const get_weather: Tool = {
  name: "get_weather",
  description: "Get the current weather in a given location",
  inputSchema: getWeatherSchema,
  jsFunction: async ({ location }: typeof getWeatherSchema.infer) => {
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

const readFileSchema = type({
  path: "string",
});

export const read_file: Tool = {
  name: "read_file",
  description:
    "Reads a file from the file system and returns an optional error_message and the file_content if successful",
  inputSchema: readFileSchema,
  jsFunction: async ({ path }: typeof readFileSchema.infer) => {
    console.log(`Reading file from ${path}`);
    if (path.includes("..") || path.startsWith("/")) {
      return JSON.stringify({ error_message: "Bad path given" });
    }
    try {
      const content = await Bun.file(path).text();
      return JSON.stringify({ file_content: content });
    } catch (e) {
      return JSON.stringify({
        error_message: `Failed to read file: ${e instanceof Error ? e.message : e}`,
      });
    }
  },
};

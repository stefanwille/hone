import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert";
import { type } from "arktype";
import type { ToolResultBlockParam } from "@anthropic-ai/sdk/resources";
import fs from "node:fs/promises";

const MODEL = "claude-haiku-4-5";

const getLocationSchema = type({
  type: "object",
  properties: {},
  required: [],
});

const getWeatherSchema = type({
  location: "string",
});

const readFileSchema = type({
  path: "string",
});

type readFileInput = typeof readFileSchema.infer;

type getWeatherInput = typeof getWeatherSchema.infer;

async function get_location(): Promise<string> {
  console.log(`Getting location`);
  return "Berlin, Germany";
}

async function get_weather({ location }: getWeatherInput): Promise<string> {
  console.log(`Getting weather for ${location}`);
  if (location === "San Francisco, CA") {
    return "Very hot and dry, at 52 degrees Celsius.";
  }
  if (location === "Berlin, Germany") {
    return "Sunny and friendly, at 16 degrees Celsius.";
  }
  return "Unknown location";
}

async function read_file({ path }: readFileInput): Promise<string> {
  console.log(`Reading file from ${path}`);
  if (path.includes("...")) {
    return JSON.stringify({ error_message: "Bad path given" });
  }
  const content = await fs.readFile(path, "utf8");
  return JSON.stringify({ file_content: content });
}

type ToolType = {
  name: string;
  description: string;
  inputSchema: type.Any;
  jsFunction: (input: any) => Promise<ToolResultBlockParam["content"]>;
};

const toolTypeTools: ToolType[] = [
  {
    name: "get_location",
    description: "Get the user's location",
    inputSchema: getLocationSchema,
    jsFunction: get_location,
  },
  {
    name: "get_weather",
    description: "Get the current weather in a given location",
    inputSchema: getWeatherSchema,
    jsFunction: get_weather,
  },
  {
    name: "read_file",
    description:
      "Reads a file from the file system and returns an optional error_message and the file_content if successful",
    inputSchema: readFileSchema,
    jsFunction: read_file,
  },
];

function getTools(toolTypeTools: ToolType[]): Anthropic.Messages.ToolUnion[] {
  return toolTypeTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema.toJsonSchema() as any,
  }));
}

const tools: Anthropic.Messages.ToolUnion[] = getTools(toolTypeTools);

async function invokeTool(
  toolName: string,
  toolInput: any,
  toolTypeTools: ToolType[],
): Promise<ToolResultBlockParam["content"]> {
  const toolTypeTool = toolTypeTools.find((tool) => tool.name === toolName);
  if (!toolTypeTool) {
    return `Unknown tool name: ${toolName}`;
  }
  return await toolTypeTool.jsFunction(toolInput);
}

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  const toolName = toolUse.name;
  const toolInput = toolUse.input;
  const toolResponse = await invokeTool(toolName, toolInput, toolTypeTools);
  const toolResult: Anthropic.Messages.ToolResultBlockParam = {
    type: "tool_result" as const,
    tool_use_id: toolUse.id,
    content: toolResponse,
  };
  return toolResult;
}

type AgenticRequest = {
  messages: Anthropic.Messages.MessageParam[];
  tools: Anthropic.Messages.ToolUnion[];
  max_tokens: number;
  max_turns: number;
  model: string;
};

async function agenticRequest(request: AgenticRequest) {
  let turns = 0;
  const anthropic = new Anthropic();
  const messages: Anthropic.Messages.MessageParam[] = [];

  messages.push(...request.messages);

  while (turns < request.max_turns) {
    const response = await anthropic.messages.create({
      model: request.model,
      max_tokens: request.max_tokens,
      tools: request.tools,
      messages,
    });
    console.log("response 0:", response);
    console.log("--------------------------------");
    messages.push({ role: response.role, content: response.content });

    if (
      response.stop_reason === "end_turn" ||
      response.stop_reason === "stop_sequence"
    ) {
      break;
    }

    assert(response.stop_reason === "tool_use", "Expected tool use in content");

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const content of response.content) {
      if (content.type === "tool_use") {
        const toolResult = await executeToolUse(content);
        toolResults.push(toolResult);
      }
    }

    messages.push({ role: "user", content: toolResults });

    turns++;
  }
}
async function main() {
  agenticRequest({
    messages: [
      {
        role: "user",
        content: "Read the file ./.prettierrc and tellme what it says",
      },
    ],
    tools: tools,
    max_tokens: 1000,
    max_turns: 10,
    model: MODEL,
  });
}

main().catch(console.error);

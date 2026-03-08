import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert";

const MODEL = "claude-haiku-4-5";

const tools: Anthropic.Messages.ToolUnion[] = [
  {
    name: "get_location",
    description: "Get the user's location",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_weather",
    description: "Get the current weather in a given location",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
      },
      required: ["location"],
    },
  },
];

async function get_location(): Promise<string> {
  console.log(`Getting location`);
  return "Berlin, Germany";
}

async function get_weather(location: string): Promise<string> {
  console.log(`Getting weather for ${location}`);
  if (location === "San Francisco, CA") {
    return "Very hot and dry, at 52 degrees Celsius.";
  }
  if (location === "Berlin, Germany") {
    return "Sunny and friendly, at 16 degrees Celsius.";
  }
  return "Unknown location";
}

async function invokeTool(
  toolName: string,
  toolInput: unknown,
): Promise<string> {
  switch (toolName) {
    case "get_location":
      return await get_location();
    case "get_weather":
      const location = (toolInput as { location: string }).location;
      return await get_weather(location);
    default:
      return `Unknown tool name: ${toolName}`;
  }
}

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  const toolName = toolUse.name;
  const toolInput = toolUse.input;
  const toolResponse = await invokeTool(toolName, toolInput);
  const toolResult: Anthropic.Messages.ToolResultBlockParam = {
    type: "tool_result" as const,
    tool_use_id: toolUse.id,
    content: toolResponse,
  };
  return toolResult;
}

async function main() {
  const anthropic = new Anthropic();
  const messages: Anthropic.Messages.MessageParam[] = [];

  messages.push({
    role: "user" as const,
    content:
      "Get the user's location and the current weather in that location.",
  });
  const response0 = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    tools: tools,
    messages,
  });
  console.log("response 0:", response0);
  console.log("--------------------------------");
  messages.push({ role: response0.role, content: response0.content });

  const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

  for (const content of response0.content) {
    if (content.type === "tool_use") {
      const toolResult = await executeToolUse(content);
      toolResults.push(toolResult);
    }
  }
  messages.push({ role: "user", content: toolResults });

  const response1 = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    tools: tools,
    messages,
  });
  console.log("response 1:", response1);
}

main().catch(console.error);

import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert";
import { type } from "arktype";
import type { ToolResultBlockParam } from "@anthropic-ai/sdk/resources";

const MODEL = "claude-haiku-4-5";

type Tool = {
  name: string;
  description: string;
  inputSchema: type.Any;
  jsFunction: (input: any) => Promise<ToolResultBlockParam["content"]>;
};

const get_location: Tool = {
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

const get_weather: Tool = {
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

const read_file: Tool = {
  name: "read_file",
  description:
    "Reads a file from the file system and returns an optional error_message and the file_content if successful",
  inputSchema: readFileSchema,
  jsFunction: async ({ path }: typeof readFileSchema.infer) => {
    console.log(`Reading file from ${path}`);
    if (path.includes("...")) {
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

const tools: Tool[] = [get_location, get_weather, read_file];

function convertTools(tools: Tool[]): Anthropic.Messages.ToolUnion[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema.toJsonSchema() as any,
  }));
}

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  const tool = tools.find((t) => t.name === toolUse.name);
  if (!tool) {
    return {
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: `Unknown tool name: ${toolUse.name}`,
    };
  }
  const content = await tool.jsFunction(toolUse.input);
  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content,
  };
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
  const messages: Anthropic.Messages.MessageParam[] = [...request.messages];

  while (turns < request.max_turns) {
    const response = await anthropic.messages.create({
      model: request.model,
      max_tokens: request.max_tokens,
      tools: request.tools,
      messages,
    });
    messages.push({ role: response.role, content: response.content });

    if (
      response.stop_reason === "end_turn" ||
      response.stop_reason === "stop_sequence"
    ) {
      break;
    }

    assert(response.stop_reason === "tool_use", "Expected tool use in content");

    const toolUses = response.content.filter(
      (c): c is Anthropic.Messages.ToolUseBlock => c.type === "tool_use",
    );
    const toolResults = await Promise.all(toolUses.map(executeToolUse));

    messages.push({ role: "user", content: toolResults });

    turns++;
  }
}

async function main() {
  const anthropicTools = convertTools(tools);

  await agenticRequest({
    messages: [
      {
        role: "user",
        content: "Read the file ./.prettierrc and tellme what it says",
      },
    ],
    tools: anthropicTools,
    max_tokens: 1000,
    max_turns: 10,
    model: MODEL,
  });
}

main().catch(console.error);

import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert";

const tools = [
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

async function main() {
  const anthropic = new Anthropic();
  const messages: Anthropic.Messages.MessageParam[] = [];

  messages.push({
    role: "user" as const,
    content: "What is the weather in San Francisco?",
  });
  const response0 = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1000,
    tools: tools,
    messages,
  });
  console.log("response 0:", response0);
  console.log("--------------------------------");

  const toolUse = response0.content.find((c) => c.type === "tool_use");
  assert(toolUse?.type === "tool_use", `Expected tool use - ${toolUse?.type}}`);
  const toolName = toolUse.name;
  assert(toolName === "get_weather", "Expected tool name to be get_weather");

  messages.push({ role: response0.role, content: response0.content });

  const toolResult: Anthropic.Messages.ToolResultBlockParam = {
    type: "tool_result" as const,
    tool_use_id: toolUse.id,
    content: "Very hot and dry, at 57 degrees Celsius.",
  };

  messages.push({
    role: "user" as const,
    content: [toolResult],
  });
  const response1 = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1000,
    tools: tools,
    messages,
  });
  console.log("response 1:", response1);
}

main().catch(console.error);

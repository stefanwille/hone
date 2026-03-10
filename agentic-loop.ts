import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert";
import { BashSession, type BashToolInput } from "./BashTool";
import {
  type Tool,
  type ToolResult,
  get_location,
  get_weather,
  read_file,
} from "./tools";

const MODEL = "claude-haiku-4-5";

const tools: Tool[] = [get_location, get_weather, read_file];

function convertTools(tools: Tool[]): Anthropic.Messages.ToolUnion[] {
  const convertedTools: Anthropic.Messages.ToolUnion[] = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema.toJsonSchema() as any,
  }));
  convertedTools.push({ type: "bash_20250124", name: "bash" });
  return convertedTools;
}

const bashSession = new BashSession();

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  let result: ToolResult;

  console.log("Tool use", toolUse);

  if (toolUse.name === "bash") {
    const input = toolUse.input as BashToolInput;
    try {
      if (input.restart) {
        bashSession.restart();
        result = "Bash baseSession restarted.";
      } else {
        const { command, timeout } = toolUse.input as {
          command: string;
          timeout?: number;
        };
        result = await bashSession.run(command, timeout);
      }
    } catch (err) {
      result = `Error: ${(err as Error).message}`;
    }
  } else {
    const tool = tools.find((t) => t.name === toolUse.name);
    if (!tool) {
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: `Unknown tool name: ${toolUse.name}`,
      };
    }
    result = await tool.jsFunction(toolUse.input);
  }

  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: result,
  };
}

type AgentRequet = {
  messages: Anthropic.Messages.MessageParam[];
  tools: Anthropic.Messages.ToolUnion[];
  max_tokens: number;
  max_turns: number;
  model: string;
};

async function agentRequest(request: AgentRequet) {
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
  return messages;
}

async function main() {
  const anthropicTools = convertTools(tools);
  let messages: Anthropic.Messages.MessageParam[] = [];

  for (;;) {
    const line = prompt("> ");
    if (line === null) {
      break;
    }
    if (!line) {
      continue;
    }

    messages.push({
      role: "user",
      content: line,
    });

    messages = await agentRequest({
      messages,
      tools: anthropicTools,
      max_tokens: 1000,
      max_turns: 10,
      model: MODEL,
    });

    console.log(messages![messages!.length - 1]!.content);
  }
}

main().catch(console.error);

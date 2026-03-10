import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert";
import { createInterface } from "node:readline";
import { BashSession, type BashToolInput } from "./BashTool";
import {
  type Tool,
  type ToolResult,
  get_location,
  get_weather,
  read_file,
} from "./tools";
import { renderMarkdown, renderToolFrame } from "./render-markdown";

const MODEL = "claude-haiku-4-5";
const HISTORY_FILE = "history.txt";
const MAX_HISTORY_LINES = 200;

async function loadSystemPrompt(): Promise<string> {
  try {
    const file = Bun.file("CLAUDE.md");
    if (await file.exists()) return await file.text();
  } catch {}
  return "";
}

async function loadHistory(): Promise<string[]> {
  try {
    const file = Bun.file(HISTORY_FILE);
    if (await file.exists()) {
      const text = await file.text();
      return text.split("\n").filter(Boolean).slice(-MAX_HISTORY_LINES);
    }
  } catch {}
  return [];
}

async function saveHistory(lines: string[]) {
  await Bun.write(
    HISTORY_FILE,
    lines.slice(-MAX_HISTORY_LINES).join("\n") + "\n",
  );
}

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

const anthropic = new Anthropic();
const bashSession = new BashSession();

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  let result: ToolResult;

  if (toolUse.name === "bash") {
    const input = toolUse.input as BashToolInput;
    try {
      if (input.restart) {
        bashSession.restart();
        result = "Bash baseSession restarted.";
      } else {
        result = await bashSession.run(input.command, input.timeout);
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

  const resultStr =
    typeof result === "string" ? result : JSON.stringify(result, null, 2);
  console.log(renderToolFrame(toolUse.name, toolUse.input, resultStr ?? ""));

  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: result,
  };
}

type AgentRequest = {
  messages: Anthropic.Messages.MessageParam[];
  system?: string;
  tools: Anthropic.Messages.ToolUnion[];
  max_tokens: number;
  max_turns: number;
  model: string;
};

async function agentRequest(request: AgentRequest) {
  let turns = 0;
  const messages: Anthropic.Messages.MessageParam[] = [...request.messages];

  while (turns < request.max_turns) {
    const response = await anthropic.messages.create({
      model: request.model,
      max_tokens: request.max_tokens,
      system: request.system || undefined,
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

function createPrompt(history: string[]): {
  ask: (prompt: string) => Promise<string | null>;
  getHistory: () => string[];
} {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    history,
  });

  let closed = false;
  rl.once("close", () => {
    closed = true;
  });

  return {
    ask: (prompt: string) =>
      new Promise<string | null>((resolve) => {
        if (closed) return resolve(null);
        rl.once("close", () => resolve(null));
        rl.question(prompt, (answer) => {
          rl.removeAllListeners("close");
          resolve(answer);
        });
      }),
    getHistory: () => (rl as any).history as string[],
  };
}

async function main() {
  const anthropicTools = convertTools(tools);
  const systemPrompt = await loadSystemPrompt();
  let messages: Anthropic.Messages.MessageParam[] = [];
  const history = await loadHistory();
  const { ask, getHistory } = createPrompt(history);

  for (;;) {
    const line = await ask("> ");
    if (line === null) {
      await saveHistory(getHistory());
      break;
    }
    if (!line) continue;

    messages.push({
      role: "user",
      content: line,
    });

    messages = await agentRequest({
      messages,
      system: systemPrompt,
      tools: anthropicTools,
      max_tokens: 1000,
      max_turns: 10,
      model: MODEL,
    });

    const lastContent = messages.at(-1)!.content;
    if (Array.isArray(lastContent)) {
      for (const block of lastContent) {
        if (block.type === "text") {
          console.log(renderMarkdown(block.text));
        }
      }
    }
  }
}

main().catch(console.error);

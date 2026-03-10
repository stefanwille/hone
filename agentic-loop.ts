import Anthropic from "@anthropic-ai/sdk";
import { createInterface } from "node:readline";
import { createAgentSession, type AgentSession } from "./agent-session";
import { type BashToolInput } from "./BashTool";
import { loadHistory, saveHistory } from "./history";
import { renderMarkdown, renderToolFrame } from "./render-markdown";
import { TOOLS, type ToolResult } from "./tools";

const MODEL = "claude-sonnet-4-6";

const anthropic = new Anthropic();

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
  session: AgentSession,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  let result: ToolResult;

  if (toolUse.name === "bash") {
    const input = toolUse.input as BashToolInput;
    try {
      if (input.restart) {
        session.bashSession.restart();
        result = "Bash session restarted.";
      } else {
        result = await session.bashSession.run(input.command, input.timeout);
      }
    } catch (err) {
      result = `Error: ${(err as Error).message}`;
    }
  } else {
    const tool = TOOLS.find((t) => t.name === toolUse.name);
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
  console.log(renderToolFrame(toolUse.name, toolUse.input, resultStr));

  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: result,
  };
}

async function agentRequest(line: string, session: AgentSession) {
  let turns = 0;
  session.messages.push({
    role: "user",
    content: line,
  });

  while (turns < session.max_turns) {
    const response = await anthropic.messages.create({
      model: session.model,
      max_tokens: session.max_tokens,
      system: session.system || undefined,
      tools: session.tools,
      messages: session.messages,
    });
    session.messages.push({ role: response.role, content: response.content });

    if (response.stop_reason !== "tool_use") {
      break;
    }

    const toolUses = response.content.filter(
      (c): c is Anthropic.Messages.ToolUseBlock => c.type === "tool_use",
    );
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      toolResults.push(await executeToolUse(toolUse, session));
    }

    session.messages.push({ role: "user", content: toolResults });

    turns++;
  }
}

function createPromptUser(history: string[]): {
  promptUser: (prompt: string) => Promise<string | null>;
  getHistory: () => string[];
} {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    history,
  });

  let closed = false;
  readline.once("close", () => {
    closed = true;
  });

  function promptUser(prompt: string) {
    return new Promise<string | null>((resolve) => {
      if (closed) return resolve(null);
      readline.once("close", () => resolve(null));
      readline.question(prompt, (answer) => {
        readline.removeAllListeners("close");
        resolve(answer);
      });
    });
  }

  function getHistory() {
    return (readline as any).history as string[];
  }

  return { promptUser, getHistory };
}

async function main() {
  const history = await loadHistory();
  const session = await createAgentSession(MODEL);
  const { promptUser, getHistory } = createPromptUser(history);

  for (;;) {
    const line = await promptUser("> ");
    if (line === null) {
      break;
    }
    if (!line) continue;
    await saveHistory(getHistory());

    await agentRequest(line, session);

    const lastContent = session.messages.at(-1)!.content;
    if (Array.isArray(lastContent)) {
      for (const block of lastContent) {
        if (block.type === "text") {
          console.log(renderMarkdown(block.text));
        }
      }
    }
  }

  process.exit(0);
}

main().catch(console.error);

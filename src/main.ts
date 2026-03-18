import { parseArgs } from "node:util";
import { createAgentSession } from "./agent/agent-session";
import { agentRequest } from "./agent/agent-request";
import {
  loadReadlineHistory,
  saveReadlineHistory,
} from "./agent/readline/readline-history";
import { createReadlineSession } from "./agent/readline/readline";
import { text } from "node:stream/consumers";
import { runInSandbox } from "./agent/sandbox/runProgramInSandbox";

type ModelAlias = "haiku" | "sonnet" | "opus";

const MODEL_MAP: Record<ModelAlias, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
};

function getCliOptions(): { model: string | undefined } {
  const { values } = parseArgs({
    options: {
      model: { type: "string", short: "m" },
    },
    allowPositionals: true,
  });

  let model: string | undefined;
  if (values.model) {
    const alias = values.model as ModelAlias;
    if (!(alias in MODEL_MAP)) {
      console.error(`Invalid model: ${values.model}. Use: haiku, sonnet, opus`);
      process.exit(1);
    }
    model = MODEL_MAP[alias];
  }

  return { model };
}

async function repl(model: string | undefined): Promise<void> {
  const history = await loadReadlineHistory();
  const readlineSession = createReadlineSession(history);
  const agentSession = await createAgentSession({ model });
  console.log("/help for available commands.\n");

  for (;;) {
    const prompt = agentSession.mode === "plan" ? "plan> " : "> ";
    let input = await readlineSession.promptUser(prompt);
    if (input === null) {
      break;
    }
    input = input.trim();
    if (input === "exit" || input === "quit") {
      break;
    }
    if (!input) continue;
    if (input === "/help") {
      console.log("Available commands:");
      console.log(
        "/plan - Plan mode. Agent will only read and plan, not edit.",
      );
      console.log("/agent - Agent mode. Agent can read, write, and execute.");
      console.log("/exit - Exit the coding agent.");
      continue;
    }
    if (input === "/plan") {
      agentSession.mode = "plan";
      console.log("Plan mode. Agent will only read and plan, not edit.");
      continue;
    }
    if (input === "/agent") {
      agentSession.mode = "agent";
      console.log("Agent mode. Agent can read, write, and execute.");
      continue;
    }
    await saveReadlineHistory(readlineSession.getHistory());
    await agentRequest(input, agentSession);
  }
  process.exit(0);
}

async function batchMode(model: string | undefined) {
  const input = await text(process.stdin);
  const agentSession = await createAgentSession({ model });
  await agentRequest(input, agentSession);
  process.exit(0);
}

async function program() {
  const { model } = getCliOptions();
  if (process.stdin.isTTY) {
    await repl(model);
  } else {
    await batchMode(model);
  }
}

async function main() {
  await runInSandbox(program);
}

main().catch(console.error);

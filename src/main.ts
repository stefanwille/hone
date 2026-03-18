import { text } from "node:stream/consumers";
import { agentRequest } from "./agent/agent-request";
import { createAgentSession } from "./agent/agent-session";
import { createReadlineSession } from "./agent/readline/readline";
import {
  loadReadlineHistory,
  saveReadlineHistory,
} from "./agent/readline/readline-history";
import { runInSandbox } from "./agent/sandbox/runProgramInSandbox";
import { getCliOptions, type CliOptions } from "./cli-options";

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

async function program(cliOptions: CliOptions) {
  const { model, cwd } = cliOptions;
  if (cwd) {
    process.chdir(cwd);
  }
  if (process.stdin.isTTY) {
    await repl(model);
  } else {
    await batchMode(model);
  }
}

async function main() {
  const cliOptions = getCliOptions();
  const programClosure = async () => {
    await program(cliOptions);
  };
  await runInSandbox(programClosure, cliOptions.cwd);
}

main().catch(console.error);

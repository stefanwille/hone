import { createAgentSession } from "./agent/agent-session";
import { agentRequest } from "./agent/agent-request";
import {
  loadReadlineHistory,
  saveReadlineHistory,
} from "./agent/readline/readline-history";
import { createReadlineSession } from "./agent/readline/readline";
import { text } from "node:stream/consumers";

async function repl() {
  const history = await loadReadlineHistory();
  const readlineSession = createReadlineSession(history);
  const agentSession = await createAgentSession();
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

async function batchMode() {
  const input = await text(process.stdin);
  const agentSession = await createAgentSession();
  await agentRequest(input, agentSession);
  process.exit(0);
}

async function main() {
  if (process.stdin.isTTY) {
    await repl();
  } else {
    await batchMode();
  }
}

main().catch(console.error);

import { createAgentSession } from "./agent/agent-session";
import { agentRequest } from "./agent/agent-request";
import {
  loadReadlineHistory,
  saveReadlineHistory,
} from "./agent/readline/readline-history";
import { createReadlineSession } from "./agent/readline/readline";
import { text } from "node:stream/consumers";

async function repl() {
  console.log("running REPL");

  const history = await loadReadlineHistory();
  const readlineSession = createReadlineSession(history);
  const agentSession = await createAgentSession();

  for (;;) {
    let input = await readlineSession.promptUser("> ");
    if (input === null) {
      break;
    }
    input = input.trim();
    if (input === "exit" || input === "quit") {
      break;
    }
    if (!input) continue;
    await saveReadlineHistory(readlineSession.getHistory());
    await agentRequest(input, agentSession);
  }
  process.exit(0);
}

async function batchMode() {
  console.log("running CLI");

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

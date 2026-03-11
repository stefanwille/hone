import { createAgentSession } from "./agent/agent-session";
import { agentRequest } from "./agent/agent-request";
import {
  loadReadlineHistory,
  saveReadlineHistory,
} from "./readline/readline-history";
import { createReadlineSession } from "./readline/readline";

async function main() {
  const history = await loadReadlineHistory();
  const readlineSession = createReadlineSession(history);
  const agentSession = await createAgentSession();

  for (;;) {
    const line = await readlineSession.promptUser("> ");
    if (line === null) {
      break;
    }
    if (!line) continue;
    await saveReadlineHistory(readlineSession.getHistory());
    await agentRequest(line, agentSession);
  }

  process.exit(0);
}

main().catch(console.error);

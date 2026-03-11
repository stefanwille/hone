import { createAgentSession } from "./agent-session";
import { agentRequest } from "./agent-request";
import { loadReadlineHistory, saveReadlineHistory } from "./readline-history";
import { createReadlineSession } from "./readline";

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

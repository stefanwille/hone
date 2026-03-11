import { createInterface } from "node:readline/promises";

export type ReadlineSession = {
  promptUser: (prompt: string) => Promise<string | null>;
  getHistory: () => string[];
};

export function createReadlineSession(history: string[]): ReadlineSession {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY ?? false,
    history,
  });

  function promptUser(prompt: string): Promise<string | null> {
    return new Promise((resolve) => {
      const onClose = () => resolve(null);
      readline.once("close", onClose);
      readline.question(prompt).then((answer) => {
        readline.removeListener("close", onClose);
        resolve(answer);
      });
    });
  }

  function getHistory() {
    return (readline as any).history as string[];
  }

  return { promptUser, getHistory };
}

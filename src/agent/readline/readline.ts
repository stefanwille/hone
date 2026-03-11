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

  async function promptUser(prompt: string): Promise<string | null> {
    return new Promise((resolve) => {
      readline.question(prompt).then(resolve);
      // Handle CTRL-D (EOF)
      readline.once("close", () => resolve(null));
    });
  }

  function getHistory() {
    return (readline as any).history as string[];
  }

  return { promptUser, getHistory };
}

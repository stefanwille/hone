import { createInterface } from "node:readline";

export type ReadlineSession = {
  promptUser: (prompt: string) => Promise<string | null>;
  getHistory: () => string[];
};

export function createReadlineSession(history: string[]): ReadlineSession {
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
      const onClose = () => resolve(null);
      readline.once("close", onClose);
      readline.question(prompt, (answer) => {
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

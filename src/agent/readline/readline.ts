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

  // Lines are buffered eagerly as they arrive; null signals EOF.
  const bufferedLines: Array<string | null> = [];
  let pendingResolve: ((line: string | null) => void) | null = null;

  readline.on("line", (line) => {
    if (pendingResolve) {
      pendingResolve(line);
      pendingResolve = null;
    } else {
      bufferedLines.push(line);
    }
  });

  readline.once("close", () => {
    if (pendingResolve) {
      pendingResolve(null);
      pendingResolve = null;
    } else {
      bufferedLines.push(null);
    }
  });

  function promptUser(prompt: string): Promise<string | null> {
    if (bufferedLines.length > 0) {
      return Promise.resolve(bufferedLines.shift()!);
    }
    return new Promise((resolve) => {
      pendingResolve = resolve;
    });
  }

  function getHistory() {
    return (readline as any).history as string[];
  }

  return { promptUser, getHistory };
}

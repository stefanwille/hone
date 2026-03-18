import { spawn } from "node:child_process";
import { Levenshtein } from "autoevals";
import { evalite } from "evalite";

function runAgent(input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("bun", ["start"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, SRT_SANDBOXED: "1" },
    });
    let stdout = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Agent exited with code ${code}`));
      }
    });
    proc.stdin.end(input);
  });
}

evalite("Basic Question Answer", {
  data: [
    {
      input: "What is 1 + 2? Answer with just the result.",
      expected: "3",
    },
  ],
  task: async (input) => runAgent(input),
  scorers: [Levenshtein],
});

import { spawn } from "node:child_process";
import { Levenshtein } from "autoevals";
import { evalite } from "evalite";
import { readFile } from "node:fs/promises";

type RunAgentOptions = {
  prompt: string;
  model?: string;
};

const DEFAULT_MODEL_FOR_EVALS = "haiku";

function runAgent(options: RunAgentOptions): Promise<string> {
  const { prompt, model } = options;
  const modelArgs = ["--model", model ?? DEFAULT_MODEL_FOR_EVALS];
  return new Promise((resolve, reject) => {
    const proc = spawn("bun", ["start", ...modelArgs], {
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
    proc.stdin.end(prompt);
  });
}

evalite("Tool calling", {
  data: [
    {
      input: {
        prompt:
          "Write 'Hello world' to a file called 'hello.txt' in the current directory.",
      },
      expected: "Hello world",
    },
  ],
  task: async (input) => {
    await runAgent({ prompt: input.prompt });
    return await readFile("hello.txt", { encoding: "utf-8" });
  },
  scorers: [
    {
      name: "trimmed-match",
      scorer: ({ output, expected }) => {
        return {
          score: output.trim() === expected?.trim() ? 1 : 0,
          metadata: { matched: output === expected },
        };
      },
    },
  ],
});

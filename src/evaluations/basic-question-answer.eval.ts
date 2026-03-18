import { spawn } from "node:child_process";
import { Levenshtein } from "autoevals";
import { evalite } from "evalite";

type RunAgentOptions = {
  prompt: string;
  model?: string;
};
function runAgent(options: RunAgentOptions): Promise<string> {
  const { prompt, model } = options;
  const modelOptions = model ? ["-m", model] : [];
  return new Promise((resolve, reject) => {
    const proc = spawn("bun", ["start", ...modelOptions], {
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

evalite("Model selection", {
  data: [
    {
      input: {
        prompt:
          "Which model are you? Answer with just the model name: haiku|sonnet|opus",
        model: "haiku",
      },
      expected: "3",
    },
  ],
  task: async (input) => runAgent(input),
  scorers: [Levenshtein],
});

evalite("Basic question", {
  data: [
    {
      input: {
        prompt: "What is 1 + 2? Answer with just the result.",
      },
      expected: "3",
    },
  ],
  task: async (input) => runAgent({ prompt: input.prompt }),
  scorers: [Levenshtein],
});

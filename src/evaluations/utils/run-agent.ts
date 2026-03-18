import { spawn } from "node:child_process";

type RunAgentOptions = {
  prompt: string;
  model?: string;
};

const DEFAULT_MODEL_FOR_EVALS = "haiku";

export function runAgent(options: RunAgentOptions): Promise<string> {
  const { prompt, model } = options;
  const modelArgs = ["--model", model ?? DEFAULT_MODEL_FOR_EVALS];
  return new Promise((resolve, reject) => {
    const proc = spawn("bun", ["start", ...modelArgs], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
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

import { Levenshtein } from "autoevals";
import { evalite } from "evalite";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAgent } from "./utils/run-agent";

let tempDir: string;

//- Code understanding: Make ts file with a fibonacci function, but call it X. Ask the agent what X does. Score 1 if fibonacci, otherwise 0

const FIBONACCI_FUNCTION = `
export function x(n: number): number {
  if (n < 0) throw new RangeError(\`n must be >= 0, got \${n}\`);
  if (n === 0) return 0;
  let a = 0;
  let b = 1;
  for (let i = 1; i < n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}
`;

evalite("Code understanding", {
  data: [
    {
      input: {
        prompt:
          "There is a file called 'code-understanding.ts' with a function named x. What does it calculate? Write the answer to the file 'code-understanding-answer.txt'.",
      },
      expected: "The function x calculates the nth Fibonacci number.",
    },
  ],
  task: async (input) => {
    tempDir = mkdtempSync(join(tmpdir(), "ai-coding-agent-eval"));
    const filename = join(tempDir, "code-understanding.ts");
    writeFileSync(filename, FIBONACCI_FUNCTION);
    await runAgent({ prompt: input.prompt, cwd: tempDir });
    return readFileSync(join(tempDir, "code-understanding-answer.txt"), {
      encoding: "utf-8",
    });
  },
  scorers: [Levenshtein],
  columns: (_opts) => {
    return [
      { label: "Input", value: _opts.input.prompt },
      { label: "Output", value: _opts.output },
      { label: "Temp Dir", value: tempDir },
    ];
  },
});

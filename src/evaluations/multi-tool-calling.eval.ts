import { Levenshtein } from "autoevals";
import { evalite } from "evalite";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAgent } from "./utils/run-agent";

let tempDir: string;

evalite("Multi tool calling", {
  data: [
    {
      input: {
        prompt:
          "Read the file 'multi-tool-calling.txt' and capitalize all words.",
      },
      expected: "Smart Agent",
    },
  ],
  task: async (input) => {
    tempDir = mkdtempSync(join(tmpdir(), "ai-coding-agent-eval"));
    const filename = join(tempDir, "multi-tool-calling.txt");
    writeFileSync(filename, "smart agent");
    await runAgent({ prompt: input.prompt, cwd: tempDir });
    return readFileSync(filename, { encoding: "utf-8" });
  },
  scorers: [Levenshtein],
  columns: (_opts) => {
    return [{ label: "Temp Dir", value: tempDir }];
  },
});

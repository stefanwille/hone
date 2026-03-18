import { evalite } from "evalite";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TrimmedLevenshtein } from "./scorers/scorers";
import { runAgent } from "./utils/run-agent";

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
    const tempDir = await mkdtemp(join(tmpdir(), "ai-coding-agent-eval"));
    await runAgent({ prompt: input.prompt, cwd: tempDir });
    return await readFile(join(tempDir, "hello.txt"), { encoding: "utf-8" });
  },
  scorers: [TrimmedLevenshtein],
});

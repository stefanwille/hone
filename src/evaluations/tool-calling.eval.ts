import { evalite } from "evalite";
import { readFile } from "node:fs/promises";
import { runAgent } from "./run-agent";
import { TrimmedMatch } from "./scorers";

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
  scorers: [TrimmedMatch],
});

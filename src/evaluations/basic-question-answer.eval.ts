import { Levenshtein } from "autoevals";
import { evalite } from "evalite";
import { runAgent } from "./run-agent";

evalite("Basic question", {
  data: [
    {
      input: {
        prompt: "What is 1 + 2? Answer with just the result.",
      },
      expected: "3",
    },
  ],
  task: async (input) => await runAgent({ prompt: input.prompt }),
  scorers: [Levenshtein],
});

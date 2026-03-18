import { createScorer } from "evalite";
import Anthropic from "@anthropic-ai/sdk";

export const FibonacciMentioned = createScorer<unknown, string, string>({
  name: "Fibonacci Mentioned",
  description:
    "Checks if the output correctly identifies the function as computing Fibonacci numbers",
  scorer: async ({ output }) => {
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Does the following text correctly identify a function as computing Fibonacci numbers? Answer with ONLY "yes" or "no".\n\nText: ${output}`,
        },
      ],
    });

    const text =
      message.content[0]!.type === "text" ? message!.content[0]!.text : "";
    return text.trim().toLowerCase().startsWith("yes") ? 1 : 0;
  },
});

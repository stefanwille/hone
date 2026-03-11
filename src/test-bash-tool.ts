// Test the bash tool

import Anthropic from "@anthropic-ai/sdk";
import { BashSession } from "./bash-session";

const MODEL = "claude-haiku-4-5";

async function runAgent(userPrompt: string) {
  const client = new Anthropic();
  const session = new BashSession();

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      tools: [{ type: "bash_20250124", name: "bash" }],
      messages,
    });

    // Add assistant turn to history
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") break;
    if (response.stop_reason !== "tool_use") break;

    // Process all tool calls in this turn
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      let result: string;
      try {
        console.log("Tool use", block);
        if ((block.input as any).restart) {
          session.restart();
          result = "Bash session restarted.";
        } else {
          const { command, timeout } = block.input as {
            command: string;
            timeout?: number;
          };
          result = await session.run(command, timeout);
        }
      } catch (err) {
        result = `Error: ${(err as Error).message}`;
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    // Feed results back
    messages.push({ role: "user", content: toolResults });
  }

  // Print final text response
  for (const block of messages.at(-1)?.content ?? []) {
    if (typeof block === "object" && "type" in block && block.type === "text") {
      console.log((block as Anthropic.TextBlock).text);
    }
  }
}

runAgent(
  "List all files in the current directory that are not in node_modules and that contain the string 'ANTHROPIC_API_KEY'.",
  // "List all TypeScript files in the current directory and count lines in each.",
)
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch(console.error);

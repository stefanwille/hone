import Anthropic from "@anthropic-ai/sdk";
import { createAgentSession, type AgentSession } from "./agent-session";
import { createReadlineSession } from "./readline";
import { loadHistory, saveHistory } from "./history";
import { renderMarkdown, renderToolFrame } from "./render-markdown";
import { type ToolResult } from "./tools";

async function executeToolUse(
  toolUse: Anthropic.Messages.ToolUseBlockParam,
  session: AgentSession,
): Promise<Anthropic.Messages.ToolResultBlockParam> {
  let result: ToolResult;

  const tool = session.tools.find((t) => t.name === toolUse.name);
  if (!tool) {
    return {
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: `Unknown tool name: ${toolUse.name}`,
    };
  }
  try {
    result = await tool.run(toolUse.input);
  } catch (err) {
    result = `Error calling tool ${toolUse.name}: ${(err as Error).message}`;
  }

  const resultStr =
    typeof result === "string" ? result : JSON.stringify(result, null, 2);
  console.log(renderToolFrame(toolUse.name, toolUse.input, resultStr));

  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: result,
  };
}

async function agentRequest(request: string, session: AgentSession) {
  let agentRequestTokens = 0;
  try {
    session.messages.push({
      role: "user",
      content: request,
    });

    let turns;
    for (turns = 0; turns < session.maxTurns; turns++) {
      let response: Anthropic.Messages.Message;
      try {
        response = await session.anthropicAPI.messages.create({
          model: session.model,
          max_tokens: session.maxTokens,
          system: session.system || undefined,
          tools: session.anthropicTools,
          messages: session.messages,
        });
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) {
          console.error("Rate limited, try again in a moment");
        } else if (err instanceof Anthropic.APIConnectionError) {
          console.error("Connection failed, check your network");
        } else {
          console.error(`API error: ${(err as Error).message}`);
        }
        return;
      }
      session.messages.push({ role: response.role, content: response.content });
      agentRequestTokens += response.usage?.output_tokens ?? 0;
      session.tokens += response.usage?.output_tokens ?? 0;

      for (const block of response.content) {
        if (block.type === "text") {
          console.log(renderMarkdown(block.text));
        }
      }

      switch (response.stop_reason) {
        case "end_turn":
          return;
        case "max_tokens":
          console.log(
            "We exceeded the requested max_tokens or the model's maximum, stopping conversation",
          );
          return;
        case "stop_sequence":
          console.log("Stop sequence reached, stopping conversation");
          return;
        case "tool_use": {
          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
          for (const block of response.content) {
            if (block.type === "tool_use") {
              toolResults.push(await executeToolUse(block, session));
            }
          }
          session.messages.push({ role: "user", content: toolResults });
          // Continue looping to allow the LLM to process the tool results
          break;
        }
        case "pause_turn":
          // We paused a long-running turn. You may provide the response back as-is in a subsequent request to let the model continue.
          console.log("Paused turn");
          break;
        case "refusal":
          // When streaming classifiers intervene to handle potential policy violations
          console.log("Refusal, stopping conversation");
          return;
        default:
          console.log(
            `Unknown stop reason ${response.stop_reason}, stopping conversation`,
          );
          return;
      }
    }

    if (turns >= session.maxTurns) {
      console.log(
        `Reached maximum number of turns (${session.maxTurns}), stopping.`,
      );
    }
  } finally {
    // Claude API requires that messages strictly alternate between user and assistant messages.
    // session.messages must end with an assistant message,
    // so that we can add a user message in the agentRequest() call.
    if (session.messages.at(-1)?.role === "user") {
      session.messages.push({
        role: "assistant",
        content: [{ type: "text", text: "Request interrupted." }],
      });
    }
    if (agentRequestTokens > session.maxTokens * 0.8) {
      console.log(
        "Warning: Output tokens in agent request was greater than 80% of the max tokens",
      );
    }
  }
}

async function main() {
  const history = await loadHistory();
  const agentSession = await createAgentSession();
  const readlineSession = createReadlineSession(history);

  for (;;) {
    const line = await readlineSession.promptUser("> ");
    if (line === null) {
      break;
    }
    if (!line) continue;
    await saveHistory(readlineSession.getHistory());
    await agentRequest(line, agentSession);
  }

  process.exit(0);
}

main().catch(console.error);

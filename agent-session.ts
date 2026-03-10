import type Anthropic from "@anthropic-ai/sdk";
import { BashSession } from "./BashSession";
import { loadSystemPrompt } from "./system-prompt";
import { createTools, type Tool } from "./tools";

export type AgentSession = {
  messages: Anthropic.Messages.MessageParam[];
  // System prompt
  system?: string;
  tools: Tool[];
  anthropicTools: Anthropic.Messages.ToolUnion[];
  maxTokens: number;
  maxTurns: number;
  model: string;
};

const MODEL = "claude-sonnet-4-6";

function convertTools(tools: Tool[]): Anthropic.Messages.ToolUnion[] {
  const convertedTools: Anthropic.Messages.ToolUnion[] = tools.map((tool) => {
    if (tool.name === "bash") {
      return {
        type: "bash_20250124",
        name: tool.name,
      };
    }
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema.toJsonSchema() as any,
    };
  });
  return convertedTools;
}

export async function createAgentSession(options?: {
  model: string;
  maxTokens: number;
  maxTurns: number;
}): Promise<AgentSession> {
  const { model = MODEL, maxTokens = 8192, maxTurns = 20 } = options ?? {};
  const tools = createTools(new BashSession());
  const anthropicTools = convertTools(tools);
  const system = await loadSystemPrompt();
  const session: AgentSession = {
    messages: [],
    system,
    tools,
    anthropicTools,
    maxTokens,
    maxTurns,
    model,
  };
  return session;
}

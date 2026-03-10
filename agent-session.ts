import type Anthropic from "@anthropic-ai/sdk";
import { BashSession } from "./BashTool";
import { loadSystemPrompt } from "./system-prompt";
import { createTools, type Tool } from "./tools";

export type AgentSession = {
  messages: Anthropic.Messages.MessageParam[];
  // System prompt
  system?: string;
  tools: Tool[];
  anthropicTools: Anthropic.Messages.ToolUnion[];
  bashSession: BashSession;
  max_tokens: number;
  max_turns: number;
  model: string;
};

function convertTools(tools: Tool[]): Anthropic.Messages.ToolUnion[] {
  const convertedTools: Anthropic.Messages.ToolUnion[] = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema.toJsonSchema() as any,
  }));
  convertedTools.push({ type: "bash_20250124", name: "bash" });
  return convertedTools;
}

export async function createAgentSession(model: string): Promise<AgentSession> {
  const tools = createTools();
  const anthropicTools = convertTools(tools);
  const systemPrompt = await loadSystemPrompt();
  const session: AgentSession = {
    messages: [],
    system: systemPrompt,
    tools,
    anthropicTools,
    max_tokens: 8192,
    max_turns: 10,
    model,
    bashSession: new BashSession(),
  };
  return session;
}

import type Anthropic from "@anthropic-ai/sdk";
import { BashSession } from "./BashSession";
import { loadSystemPrompt } from "./system-prompt";
import { convertTools, createTools, type Tool } from "./tools";

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

const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function createAgentSession(options?: {
  model: string;
  maxTokens: number;
  maxTurns: number;
}): Promise<AgentSession> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 8192,
    maxTurns = 20,
  } = options ?? {};
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

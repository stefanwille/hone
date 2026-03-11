import Anthropic from "@anthropic-ai/sdk";
import { BashSession } from "./bash-session";
import { loadSystemPrompt } from "./system-prompt";
import { convertTools, createTools, type Tool } from "./tools";

export type AgentSession = {
  anthropicAPI: Anthropic;
  messages: Anthropic.Messages.MessageParam[];
  // System prompt
  system?: string;
  tools: Tool[];
  anthropicTools: Anthropic.Messages.ToolUnion[];
  model: string;
  /**
   * The maximum number of tokens to generate in a single response.
   */
  maxTokens: number;
  /**
   * The maximum number of turns to allow the agent to take in a response to the user.
   */
  maxTurns: number;
  /**
   * Output tokens generated so far.
   */
  tokens: number;
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
  const anthropicAPI = new Anthropic();
  const tools = createTools(new BashSession());
  const anthropicTools = convertTools(tools);
  const system = await loadSystemPrompt();
  const session: AgentSession = {
    anthropicAPI,
    messages: [],
    system,
    tools,
    anthropicTools,
    maxTokens,
    maxTurns,
    model,
    tokens: 0,
  };
  return session;
}

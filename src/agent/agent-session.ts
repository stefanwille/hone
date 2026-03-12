import Anthropic from "@anthropic-ai/sdk";
import { BashSession } from "./tools/available-tools/bash/bash-session";
import { convertTools, createTools } from "./tools/tool-list";
import type { Tool } from "./tools/tool";

/**
 * Agent session models the session the user has with the agent.
 */
export type Mode = "agent" | "plan";

export type AgentSession = {
  anthropicAPI: Anthropic;
  messages: Anthropic.Messages.MessageParam[];
  mode: Mode;
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
  const session: AgentSession = {
    anthropicAPI,
    messages: [],
    mode: "agent",
    tools,
    anthropicTools,
    maxTokens,
    maxTurns,
    model,
    tokens: 0,
  };
  return session;
}

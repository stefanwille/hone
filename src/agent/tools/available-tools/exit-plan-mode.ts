import { type } from "arktype";
import type { AIAgentTool } from "../tool";
import type { Mode } from "../../agent-session";

const exitPlanModeSchema = type({ "+": "reject" });

export function exitPlanMode(setMode: (mode: Mode) => void): AIAgentTool {
  return {
    type: "local_tool",
    name: "exit_plan_mode",
    description:
      "Exit plan mode and switch to agent mode. Call this when the user asks you to implement the plan, execute it, go ahead, or otherwise proceed with making changes.",
    inputSchema: exitPlanModeSchema,
    run: async () => {
      setMode("agent");
      return "Switched to agent mode.";
    },
  };
}

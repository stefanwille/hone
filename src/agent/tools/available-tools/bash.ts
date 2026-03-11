import type { ExtendedAnthropicTool } from "../tool";
import type { BashSession } from "./bash-session";

type BashToolInput =
  | { command: string; timeout?: number; restart?: never }
  | { restart: true; command?: never; timeout?: never };

export function bash(bashSession: BashSession): ExtendedAnthropicTool {
  return {
    type: "bash_20250124",
    name: "bash",
    run: async (input: BashToolInput) => {
      if (input.restart) {
        bashSession.restart();
        return "Bash session restarted.";
      }
      return await bashSession.run(input.command, input.timeout);
    },
  };
}

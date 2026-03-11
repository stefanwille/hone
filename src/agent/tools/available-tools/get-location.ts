import { type } from "arktype";
import type { AIAgentTool } from "../tool";

export const get_location: AIAgentTool = {
  type: "local_tool",
  name: "get_location",
  description: "Get the user's location",
  inputSchema: type({ "+": "reject" }),
  run: async () => {
    return "Berlin, Germany";
  },
};
